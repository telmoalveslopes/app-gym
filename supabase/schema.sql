-- App Gym: estrutura da base de dados (Supabase / Postgres).
-- Correr uma vez no Supabase → SQL Editor → New query → colar tudo → Run. Pode ser corrido de novo sem estragar nada.

-- Dados atuais de cada pessoa (uma linha por conta)
create table if not exists public.app_data (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  device     text
);

-- Uma cópia por dia de cada pessoa (para recuperar se algo correr mal)
create table if not exists public.app_backups (
  user_id    uuid not null references auth.users(id) on delete cascade,
  day        date not null,
  data       jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);

-- Segurança: cada pessoa só vê e altera os SEUS dados
alter table public.app_data    enable row level security;
alter table public.app_backups enable row level security;

drop policy if exists "own data"    on public.app_data;
drop policy if exists "own backups" on public.app_backups;
create policy "own data"    on public.app_data    for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own backups" on public.app_backups for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on public.app_data, public.app_backups to authenticated;

-- =====================================================================
-- Personal trainer (PT) e alunos  (acrescentado a 27-11-2026)
-- Regras de segurança:
--  * O estatuto (role) de cada conta só muda pelo admin (função admin_set_role) ou aqui no SQL Editor.
--    Ninguém consegue dar-se a si próprio o estatuto de PT: a tabela profiles não aceita escrita direta.
--  * É o ALUNO que se liga ao PT (join_coach com o código do PT). O aluno ou o PT podem terminar a ligação.
--  * O PT só LÊ os dados dos seus alunos (app_data). Nunca os altera nem apaga.
--  * O plano do PT (metas, rotinas, hábitos, refeições, pesagens, nota) fica em coach_plans;
--    a app do aluno lê-o e só ACRESCENTA aos dados do aluno.
--  * Cópias na nuvem (app_backups) continuam visíveis só para o próprio.
-- Primeiro admin (uma vez, depois de entrares na app com a tua conta; troca O_TEU_EMAIL):
--   insert into public.profiles (user_id, role) select id, 'admin' from auth.users where email = 'O_TEU_EMAIL'
--     on conflict (user_id) do update set role = 'admin';
-- =====================================================================
create table if not exists public.profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'user' check (role in ('user','coach','admin')),
  name       text,
  coach_code text unique,
  created_at timestamptz not null default now()
);
create table if not exists public.coach_links (
  coach_id   uuid not null references auth.users(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (coach_id, student_id),
  check (coach_id <> student_id)
);
create table if not exists public.coach_plans (
  coach_id   uuid not null references auth.users(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  plan       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (coach_id, student_id)
);
alter table public.profiles    enable row level security;
alter table public.coach_links enable row level security;
alter table public.coach_plans enable row level security;

-- funções auxiliares (correm com permissões do dono, mas só respondem sim/não)
create or replace function public.is_coach(u uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where user_id = u and role in ('coach','admin')) $$;
create or replace function public.is_admin(u uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where user_id = u and role = 'admin') $$;
create or replace function public.coaches_student(c uuid, s uuid) returns boolean language sql stable security definer set search_path = public as $$
  select public.is_coach(c) and exists (select 1 from public.coach_links where coach_id = c and student_id = s) $$;

-- profiles: cada um vê o seu; PT e aluno ligados veem o perfil um do outro. Sem escrita direta.
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select to authenticated using (
  user_id = auth.uid()
  or exists (select 1 from public.coach_links l where (l.coach_id = auth.uid() and l.student_id = profiles.user_id) or (l.student_id = auth.uid() and l.coach_id = profiles.user_id)));
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

-- coach_links: os dois lados veem e podem terminar a ligação. Criar só com join_coach (feito pelo aluno).
drop policy if exists "links read" on public.coach_links;
drop policy if exists "links end" on public.coach_links;
create policy "links read" on public.coach_links for select to authenticated using (coach_id = auth.uid() or student_id = auth.uid());
create policy "links end"  on public.coach_links for delete to authenticated using (coach_id = auth.uid() or student_id = auth.uid());
revoke all on public.coach_links from anon, authenticated;
grant select, delete on public.coach_links to authenticated;

-- coach_plans: o PT escreve o plano dos SEUS alunos; o aluno só lê o seu.
drop policy if exists "plans read" on public.coach_plans;
drop policy if exists "plans write" on public.coach_plans;
drop policy if exists "plans update" on public.coach_plans;
drop policy if exists "plans delete" on public.coach_plans;
create policy "plans read"   on public.coach_plans for select to authenticated using (coach_id = auth.uid() or student_id = auth.uid());
create policy "plans write"  on public.coach_plans for insert to authenticated with check (coach_id = auth.uid() and public.coaches_student(auth.uid(), student_id));
create policy "plans update" on public.coach_plans for update to authenticated using (coach_id = auth.uid() and public.coaches_student(auth.uid(), student_id)) with check (coach_id = auth.uid() and public.coaches_student(auth.uid(), student_id));
create policy "plans delete" on public.coach_plans for delete to authenticated using (coach_id = auth.uid());
revoke all on public.coach_plans from anon, authenticated;
grant select, insert, update, delete on public.coach_plans to authenticated;

-- app_data: além do próprio, o PT LIGADO pode LER (só ler) os dados do aluno
drop policy if exists "coach reads student" on public.app_data;
create policy "coach reads student" on public.app_data for select to authenticated using (public.coaches_student(auth.uid(), user_id));
revoke all on public.app_data, public.app_backups from anon;

-- cria/atualiza o meu perfil (nome) e, se eu for PT, gera o meu código
create or replace function public.ensure_profile(p_name text default null) returns public.profiles
language plpgsql security definer set search_path = public as $$
declare r public.profiles; begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into public.profiles (user_id, name) values (auth.uid(), nullif(left(trim(p_name), 60), ''))
    on conflict (user_id) do update set name = coalesce(nullif(left(trim(excluded.name), 60), ''), public.profiles.name)
    returning * into r;
  while r.role in ('coach','admin') and r.coach_code is null loop
    begin
      update public.profiles set coach_code = upper(substr(md5(random()::text || clock_timestamp()::text || auth.uid()::text), 1, 8))
        where user_id = auth.uid() returning * into r;
    exception when unique_violation then null; end;
  end loop;
  return r;
end $$;

-- o ALUNO liga-se a um PT com o código dele
create or replace function public.join_coach(p_code text) returns json
language plpgsql security definer set search_path = public as $$
declare c uuid; n text; begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select user_id, name into c, n from public.profiles where coach_code = upper(trim(p_code)) and role in ('coach','admin');
  if c is null then raise exception 'invalid code'; end if;
  if c = auth.uid() then raise exception 'own code'; end if;
  insert into public.profiles (user_id) values (auth.uid()) on conflict do nothing;
  insert into public.coach_links (coach_id, student_id) values (c, auth.uid()) on conflict do nothing;
  return json_build_object('coach_id', c, 'name', n);
end $$;

-- os meus alunos (só para PT) e os meus PT (para o aluno)
create or replace function public.my_students() returns table (student_id uuid, name text, email text, since timestamptz)
language sql stable security definer set search_path = public as $$
  select l.student_id, p.name, u.email::text, l.created_at
  from public.coach_links l join auth.users u on u.id = l.student_id left join public.profiles p on p.user_id = l.student_id
  where l.coach_id = auth.uid() and public.is_coach(auth.uid()) order by l.created_at $$;
create or replace function public.my_coaches() returns table (coach_id uuid, name text, since timestamptz)
language sql stable security definer set search_path = public as $$
  select l.coach_id, p.name, l.created_at from public.coach_links l left join public.profiles p on p.user_id = l.coach_id
  where l.student_id = auth.uid() and public.is_coach(l.coach_id) order by l.created_at $$;

-- admin: dar ou tirar o estatuto de PT (o estatuto de admin só se dá aqui no SQL Editor)
create or replace function public.admin_set_role(p_email text, p_role text) returns void
language plpgsql security definer set search_path = public as $$
declare u uuid; begin
  if not public.is_admin(auth.uid()) then raise exception 'not allowed'; end if;
  if p_role not in ('user','coach') then raise exception 'bad role'; end if;
  select id into u from auth.users where lower(email) = lower(trim(p_email));
  if u is null then raise exception 'no user'; end if;
  if public.is_admin(u) then raise exception 'is admin'; end if;
  insert into public.profiles (user_id, role) values (u, p_role) on conflict (user_id) do update set role = excluded.role;
end $$;
create or replace function public.admin_list() returns table (email text, role text, name text, students bigint)
language plpgsql stable security definer set search_path = public as $$ begin
  if not public.is_admin(auth.uid()) then raise exception 'not allowed'; end if;
  return query select u.email::text, p.role, p.name, (select count(*) from public.coach_links l where l.coach_id = p.user_id)
    from public.profiles p join auth.users u on u.id = p.user_id where p.role in ('coach','admin') order by p.role, u.email::text;
end $$;

revoke execute on function public.ensure_profile(text), public.join_coach(text), public.my_students(), public.my_coaches(),
  public.admin_set_role(text, text), public.admin_list(), public.is_coach(uuid), public.is_admin(uuid), public.coaches_student(uuid, uuid) from public, anon;
grant execute on function public.ensure_profile(text), public.join_coach(text), public.my_students(), public.my_coaches(),
  public.admin_set_role(text, text), public.admin_list(), public.is_coach(uuid), public.is_admin(uuid), public.coaches_student(uuid, uuid) to authenticated;
