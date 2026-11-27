-- Teste das regras de segurança (RLS) na base de dados REAL, sem criar contas a sério.
-- Cria utilizadores falsos, faz-se passar por cada um (admin, PT, aluno, intruso, anónimo) e tenta o que deve
-- ser permitido e o que deve ser bloqueado. No fim desfaz TUDO (nada fica gravado). Correr no SQL Editor.
-- Cada linha do resultado deve dizer "ok".
create temp table if not exists t_out (n int, result text);
truncate t_out;
do $$
declare a uuid := gen_random_uuid(); p uuid := gen_random_uuid(); s uuid := gen_random_uuid(); x uuid := gen_random_uuid();
  o text := ''; code text; n int;
begin
  begin
    insert into auth.users (id, email, aud, role) values
      (a, 't-admin@teste.invalid', 'authenticated', 'authenticated'), (p, 't-pt@teste.invalid', 'authenticated', 'authenticated'),
      (s, 't-aluno@teste.invalid', 'authenticated', 'authenticated'), (x, 't-intruso@teste.invalid', 'authenticated', 'authenticated');
    insert into public.profiles (user_id, role) values (a, 'admin');
    perform set_config('role', 'authenticated', true);
    -- intruso tenta promover-se
    perform set_config('request.jwt.claims', json_build_object('sub', x, 'role', 'authenticated')::text, true);
    begin perform public.admin_set_role('t-intruso@teste.invalid', 'coach'); o := o || '01 intruso usa admin_set_role: FALHOU|'; exception when others then o := o || '01 intruso não usa admin_set_role: ok|'; end;
    begin insert into public.profiles (user_id, role) values (x, 'coach'); o := o || '02 intruso escreve profiles: FALHOU|'; exception when others then o := o || '02 intruso não escreve profiles: ok|'; end;
    perform public.ensure_profile('Intruso');
    select role into code from public.profiles where user_id = x; o := o || '03 ensure_profile não dá estatuto: ' || case when code = 'user' then 'ok' else 'FALHOU' end || '|';
    -- admin
    perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
    perform public.admin_set_role('t-pt@teste.invalid', 'coach'); o := o || '04 admin promove PT: ok|';
    begin perform public.admin_set_role('t-admin@teste.invalid', 'user'); o := o || '05 admin despromove admin: FALHOU|'; exception when others then o := o || '05 admin não despromove admin: ok|'; end;
    select count(*) into n from public.admin_list(); o := o || '06 admin_list: ' || case when n = 2 then 'ok' else 'FALHOU ' || n end || '|';
    -- aluno grava os seus dados
    perform set_config('request.jwt.claims', json_build_object('sub', s, 'role', 'authenticated')::text, true);
    insert into public.app_data (user_id, data) values (s, '{"habits":[]}'); insert into public.app_backups (user_id, day, data) values (s, current_date, '{"habits":[]}');
    o := o || '07 aluno grava os seus dados: ok|';
    begin insert into public.app_data (user_id, data) values (x, '{"habits":[]}'); o := o || '08 aluno grava dados de outro: FALHOU|'; exception when others then o := o || '08 aluno não grava dados de outro: ok|'; end;
    -- PT antes da ligação
    perform set_config('request.jwt.claims', json_build_object('sub', p, 'role', 'authenticated')::text, true);
    select (public.ensure_profile('PT teste')).coach_code into code; o := o || '09 PT recebe código: ' || case when length(code) = 8 then 'ok' else 'FALHOU' end || '|';
    select count(*) into n from public.app_data where user_id = s; o := o || '10 PT sem ligação não lê aluno: ' || case when n = 0 then 'ok' else 'FALHOU' end || '|';
    begin insert into public.coach_plans (coach_id, student_id, plan) values (p, s, '{}'); o := o || '11 PT sem ligação escreve plano: FALHOU|'; exception when others then o := o || '11 PT sem ligação não escreve plano: ok|'; end;
    begin insert into public.coach_links (coach_id, student_id) values (p, s); o := o || '12 PT cria ligação sozinho: FALHOU|'; exception when others then o := o || '12 PT não cria ligação sozinho: ok|'; end;
    -- aluno liga-se
    perform set_config('request.jwt.claims', json_build_object('sub', s, 'role', 'authenticated')::text, true);
    begin perform public.join_coach('ZZZZZZZZ'); o := o || '13 código errado: FALHOU|'; exception when others then o := o || '13 código errado recusado: ok|'; end;
    perform public.join_coach(lower(code)); o := o || '14 aluno liga-se com o código: ok|';
    -- PT com ligação
    perform set_config('request.jwt.claims', json_build_object('sub', p, 'role', 'authenticated')::text, true);
    select count(*) into n from public.app_data where user_id = s; o := o || '15 PT lê dados do aluno: ' || case when n = 1 then 'ok' else 'FALHOU' end || '|';
    select count(*) into n from public.my_students(); o := o || '16 PT vê o aluno na lista: ' || case when n = 1 then 'ok' else 'FALHOU' end || '|';
    insert into public.coach_plans (coach_id, student_id, plan) values (p, s, '{"note":"teste"}');
    update public.coach_plans set plan = '{"note":"teste 2"}' where coach_id = p and student_id = s; o := o || '17 PT escreve e muda o plano: ok|';
    update public.app_data set data = '{"habits":[1]}' where user_id = s; get diagnostics n = row_count; o := o || '18 PT não altera dados do aluno: ' || case when n = 0 then 'ok' else 'FALHOU' end || '|';
    delete from public.app_data where user_id = s; get diagnostics n = row_count; o := o || '19 PT não apaga dados do aluno: ' || case when n = 0 then 'ok' else 'FALHOU' end || '|';
    select count(*) into n from public.app_backups where user_id = s; o := o || '20 PT não lê cópias do aluno: ' || case when n = 0 then 'ok' else 'FALHOU' end || '|';
    begin update public.profiles set role = 'admin' where user_id = p; get diagnostics n = row_count; o := o || '21 PT promove-se a admin: ' || case when n = 0 then 'ok' else 'FALHOU' end || '|'; exception when others then o := o || '21 PT não se promove a admin: ok|'; end;
    -- intruso
    perform set_config('request.jwt.claims', json_build_object('sub', x, 'role', 'authenticated')::text, true);
    select count(*) into n from public.app_data where user_id <> x; o := o || '22 intruso não lê dados de outros: ' || case when n = 0 then 'ok' else 'FALHOU' end || '|';
    select count(*) into n from public.coach_plans; o := o || '23 intruso não lê planos: ' || case when n = 0 then 'ok' else 'FALHOU' end || '|';
    select count(*) into n from public.profiles where user_id <> x; o := o || '24 intruso não lê perfis de outros: ' || case when n = 0 then 'ok' else 'FALHOU' end || '|';
    select count(*) into n from public.my_students(); o := o || '25 intruso sem alunos: ' || case when n = 0 then 'ok' else 'FALHOU' end || '|';
    begin perform public.admin_list(); o := o || '26 intruso usa admin_list: FALHOU|'; exception when others then o := o || '26 intruso não usa admin_list: ok|'; end;
    delete from public.coach_links where student_id = s; get diagnostics n = row_count; o := o || '27 intruso não apaga ligações: ' || case when n = 0 then 'ok' else 'FALHOU' end || '|';
    -- aluno lê o plano e termina a ligação
    perform set_config('request.jwt.claims', json_build_object('sub', s, 'role', 'authenticated')::text, true);
    select count(*) into n from public.coach_plans where student_id = s; o := o || '28 aluno lê o plano: ' || case when n = 1 then 'ok' else 'FALHOU' end || '|';
    begin update public.coach_plans set plan = '{}' where student_id = s; get diagnostics n = row_count; o := o || '29 aluno não muda o plano: ' || case when n = 0 then 'ok' else 'FALHOU' end || '|'; exception when others then o := o || '29 aluno não muda o plano: ok|'; end;
    select count(*) into n from public.my_coaches(); o := o || '30 aluno vê o PT: ' || case when n = 1 then 'ok' else 'FALHOU' end || '|';
    delete from public.coach_links where student_id = s; get diagnostics n = row_count; o := o || '31 aluno termina a ligação: ' || case when n = 1 then 'ok' else 'FALHOU' end || '|';
    perform set_config('request.jwt.claims', json_build_object('sub', p, 'role', 'authenticated')::text, true);
    select count(*) into n from public.app_data where user_id = s; o := o || '32 PT perde o acesso: ' || case when n = 0 then 'ok' else 'FALHOU' end || '|';
    -- sem sessão (anon)
    perform set_config('role', 'anon', true); perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    begin select count(*) into n from public.app_data; o := o || '33 anónimo lê app_data: ' || case when n = 0 then 'ok (0 linhas)' else 'FALHOU' end || '|'; exception when others then o := o || '33 anónimo bloqueado: ok|'; end;
    begin perform public.join_coach(code); o := o || '34 anónimo usa funções: FALHOU|'; exception when others then o := o || '34 anónimo não usa funções: ok|'; end;
    raise exception 'FIM_DO_TESTE';
  exception when others then
    if sqlerrm <> 'FIM_DO_TESTE' then o := o || 'ERRO: ' || sqlerrm || '|'; end if;
  end;
  insert into t_out select ord, v from unnest(string_to_array(trim(trailing '|' from o), '|')) with ordinality as z(v, ord);
end $$;
select result from t_out order by n;
