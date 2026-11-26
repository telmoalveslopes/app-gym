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
