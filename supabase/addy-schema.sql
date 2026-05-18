-- Addy Ad Strategy Manager — run in Supabase SQL Editor
-- Persists companies, engine state, review cycles, and learning lessons for Vercel/production

-- Companies (full profile per brand)
create table if not exists addy_companies (
  id text primary key,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Global app state: active company + settings + engine blob
create table if not exists addy_app_state (
  id text primary key default 'global',
  active_company_id text,
  settings jsonb not null default '{}',
  engine jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- Daily review cycles (plain-English reports + debug)
create table if not exists addy_review_cycles (
  id text primary key,
  company_id text not null references addy_companies(id) on delete cascade,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists addy_review_cycles_company_created
  on addy_review_cycles(company_id, created_at desc);

-- Cumulative lessons — Addy self-improvement per company
create table if not exists addy_lessons (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references addy_companies(id) on delete cascade,
  lesson text not null,
  source_cycle_id text,
  created_at timestamptz not null default now()
);

create index if not exists addy_lessons_company_created
  on addy_lessons(company_id, created_at desc);

-- Cron audit log
create table if not exists addy_cron_runs (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'ok',
  companies_processed int not null default 0,
  summary text,
  details jsonb default '[]',
  created_at timestamptz not null default now()
);

comment on table addy_companies is 'Addy: per-brand company profiles';
comment on table addy_app_state is 'Addy: global settings + engine JSON';
comment on table addy_review_cycles is 'Addy: daily review reports per company';
comment on table addy_lessons is 'Addy: learned patterns per company';
comment on table addy_cron_runs is 'Addy: scheduled daily job audit trail';

-- Allow anon key from Next.js (tighten with auth when you add login)
alter table addy_companies enable row level security;
alter table addy_app_state enable row level security;
alter table addy_review_cycles enable row level security;
alter table addy_lessons enable row level security;
alter table addy_cron_runs enable row level security;

create policy "addy_companies_anon" on addy_companies for all using (true) with check (true);
create policy "addy_app_state_anon" on addy_app_state for all using (true) with check (true);
create policy "addy_review_cycles_anon" on addy_review_cycles for all using (true) with check (true);
create policy "addy_lessons_anon" on addy_lessons for all using (true) with check (true);
create policy "addy_cron_runs_anon" on addy_cron_runs for all using (true) with check (true);
