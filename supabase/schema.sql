-- =============================================================================
-- Addy + AI Business Engine — run this ENTIRE file once in Supabase SQL Editor
-- Creates all tables for: company workspaces, daily reviews, RL brain, creatives
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Part A: AI Business Engine (optimizer brain — /api/ai-engine/run)
-- -----------------------------------------------------------------------------

create table if not exists brain_memory (
  id uuid primary key default gen_random_uuid(),
  state jsonb not null,
  action text not null,
  reward double precision not null,
  created_at timestamptz default now()
);

create index if not exists brain_memory_created_at on brain_memory(created_at desc);

create table if not exists creative_memory (
  id uuid primary key default gen_random_uuid(),
  hook text,
  style text,
  pacing double precision,
  cta text,
  created_at timestamptz default now()
);

create index if not exists creative_memory_created_at on creative_memory(created_at desc);

create table if not exists profit_log (
  id uuid primary key default gen_random_uuid(),
  profit double precision not null,
  created_at timestamptz default now()
);

create index if not exists profit_log_created_at on profit_log(created_at desc);

create table if not exists ai_swarm_state (
  id text primary key default 'default',
  ads jsonb not null default '[]',
  dataset jsonb not null default '[]',
  updated_at timestamptz default now()
);

create table if not exists debug_memory (
  id uuid primary key default gen_random_uuid(),
  error text,
  context jsonb,
  root_cause text,
  created_at timestamptz default now()
);

create index if not exists debug_memory_created_at on debug_memory(created_at desc);

comment on table brain_memory is 'RL agent memory: state, action, reward for learning';
comment on table creative_memory is 'Creative evolution: hooks, styles, pacing, CTA';
comment on table profit_log is 'Profit per step for neural training and ROI tracking';
comment on table ai_swarm_state is 'Persisted swarm state (ads + training dataset)';
comment on table debug_memory is 'Autonomous Debug AI: logged failures and root cause';

-- -----------------------------------------------------------------------------
-- Part B: Addy Ad Strategy Manager (companies, reviews, lessons — Vercel)
-- -----------------------------------------------------------------------------

create table if not exists addy_companies (
  id text primary key,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists addy_app_state (
  id text primary key default 'global',
  active_company_id text,
  settings jsonb not null default '{}',
  engine jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists addy_review_cycles (
  id text primary key,
  company_id text not null references addy_companies(id) on delete cascade,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists addy_review_cycles_company_created
  on addy_review_cycles(company_id, created_at desc);

create table if not exists addy_lessons (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references addy_companies(id) on delete cascade,
  lesson text not null,
  source_cycle_id text,
  created_at timestamptz not null default now()
);

create index if not exists addy_lessons_company_created
  on addy_lessons(company_id, created_at desc);

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

-- Per-brand agent memory (chat insights, owner notes, platform prefs)
create table if not exists addy_brand_agent_memory (
  company_id text primary key references addy_companies(id) on delete cascade,
  owner_name text not null default 'Demetrius',
  insights jsonb not null default '[]',
  platform_prefs jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- Creative profit analysis from uploaded images/video
create table if not exists addy_creative_analysis (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references addy_companies(id) on delete cascade,
  asset_id text not null,
  profit_score double precision,
  analysis text not null,
  created_at timestamptz not null default now()
);

create index if not exists addy_creative_analysis_company
  on addy_creative_analysis(company_id, created_at desc);

-- Social posts pushed from Addy chat (Facebook, Instagram, TikTok)
create table if not exists addy_social_posts (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references addy_companies(id) on delete cascade,
  platform text not null,
  external_post_id text,
  message text,
  payload jsonb default '{}',
  created_at timestamptz not null default now()
);

-- OpenAI chat budget events (increments, top-up alerts)
create table if not exists addy_chat_budget_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  amount double precision default 0,
  note text,
  created_at timestamptz not null default now()
);

comment on table addy_brand_agent_memory is 'Per-brand Addy agent: learns from chat + reviews';
comment on table addy_creative_analysis is 'Profit potential score for uploaded creatives';
comment on table addy_social_posts is 'Posts published via Addy chat actions';
comment on table addy_chat_budget_events is 'Boss budget approvals and top-up alerts';

-- -----------------------------------------------------------------------------
-- Row Level Security (anon key from Next.js on Vercel)
-- -----------------------------------------------------------------------------

alter table brain_memory enable row level security;
alter table creative_memory enable row level security;
alter table profit_log enable row level security;
alter table ai_swarm_state enable row level security;
alter table debug_memory enable row level security;
alter table addy_companies enable row level security;
alter table addy_app_state enable row level security;
alter table addy_review_cycles enable row level security;
alter table addy_lessons enable row level security;
alter table addy_cron_runs enable row level security;
alter table addy_brand_agent_memory enable row level security;
alter table addy_creative_analysis enable row level security;
alter table addy_social_posts enable row level security;
alter table addy_chat_budget_events enable row level security;

create policy "brain_memory_anon" on brain_memory for all using (true) with check (true);
create policy "creative_memory_anon" on creative_memory for all using (true) with check (true);
create policy "profit_log_anon" on profit_log for all using (true) with check (true);
create policy "ai_swarm_state_anon" on ai_swarm_state for all using (true) with check (true);
create policy "debug_memory_anon" on debug_memory for all using (true) with check (true);
create policy "addy_companies_anon" on addy_companies for all using (true) with check (true);
create policy "addy_app_state_anon" on addy_app_state for all using (true) with check (true);
create policy "addy_review_cycles_anon" on addy_review_cycles for all using (true) with check (true);
create policy "addy_lessons_anon" on addy_lessons for all using (true) with check (true);
create policy "addy_cron_runs_anon" on addy_cron_runs for all using (true) with check (true);
create policy "addy_brand_agent_memory_anon" on addy_brand_agent_memory for all using (true) with check (true);
create policy "addy_creative_analysis_anon" on addy_creative_analysis for all using (true) with check (true);
create policy "addy_social_posts_anon" on addy_social_posts for all using (true) with check (true);
create policy "addy_chat_budget_events_anon" on addy_chat_budget_events for all using (true) with check (true);

-- Intelligence v3 (memory recall, predictions, A/B, competitive): also run
-- supabase/migrations/003-intelligence.sql in SQL Editor after this file.
