-- Full Autonomous AI Business Engine – Supabase schema
-- Run this in Supabase SQL Editor (or via Supabase CLI) to create tables.

-- Brain memory: every decision the RL agent makes (state → action → reward)
create table if not exists brain_memory (
  id uuid primary key default gen_random_uuid(),
  state jsonb not null,
  action text not null,
  reward double precision not null,
  created_at timestamptz default now()
);

create index if not exists brain_memory_created_at on brain_memory(created_at desc);

-- Creative memory: every creative the AI generates or mutates (for evolution)
create table if not exists creative_memory (
  id uuid primary key default gen_random_uuid(),
  hook text,
  style text,
  pacing double precision,
  cta text,
  created_at timestamptz default now()
);

create index if not exists creative_memory_created_at on creative_memory(created_at desc);

-- Profit log: reward/profit per step (for ROI and neural training data)
create table if not exists profit_log (
  id uuid primary key default gen_random_uuid(),
  profit double precision not null,
  created_at timestamptz default now()
);

create index if not exists profit_log_created_at on profit_log(created_at desc);

-- Optional: store ad swarm state so engine can resume across restarts
create table if not exists ai_swarm_state (
  id text primary key default 'default',
  ads jsonb not null default '[]',
  dataset jsonb not null default '[]',
  updated_at timestamptz default now()
);

comment on table brain_memory is 'RL agent memory: state, action, reward for learning';
comment on table creative_memory is 'Creative evolution: hooks, styles, pacing, CTA';
comment on table profit_log is 'Profit per step for neural training and ROI tracking';
comment on table ai_swarm_state is 'Persisted swarm state (ads + training dataset)';

-- Autonomous Debug AI: failures and context for self-healing
create table if not exists debug_memory (
  id uuid primary key default gen_random_uuid(),
  error text,
  context jsonb,
  root_cause text,
  created_at timestamptz default now()
);

create index if not exists debug_memory_created_at on debug_memory(created_at desc);

comment on table debug_memory is 'Autonomous Debug AI: logged failures and root cause for self-healing';
