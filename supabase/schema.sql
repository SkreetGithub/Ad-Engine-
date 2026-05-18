-- =============================================================================
-- Addy Ad Engine — complete Supabase schema (run once in SQL Editor)
-- Safe to re-run: uses IF NOT EXISTS + idempotent policies
-- Optional hosted cron: supabase/optional-pg-cron.sql
--   → /api/cron/addy-cycle every 6h (Meta + feedback gather + profit review)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- -----------------------------------------------------------------------------
-- Part A: AI Business Engine (optimizer brain — /api/ai-engine/run)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS brain_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state jsonb NOT NULL,
  action text NOT NULL,
  reward double precision NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS brain_memory_created_at ON brain_memory(created_at DESC);

CREATE TABLE IF NOT EXISTS creative_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hook text,
  style text,
  pacing double precision,
  cta text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS creative_memory_created_at ON creative_memory(created_at DESC);

CREATE TABLE IF NOT EXISTS profit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profit double precision NOT NULL,
  company_id text,
  roi double precision,
  action text,
  cost double precision DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profit_log_created_at ON profit_log(created_at DESC);

ALTER TABLE profit_log ADD COLUMN IF NOT EXISTS company_id text;
ALTER TABLE profit_log ADD COLUMN IF NOT EXISTS roi double precision;
ALTER TABLE profit_log ADD COLUMN IF NOT EXISTS action text;
ALTER TABLE profit_log ADD COLUMN IF NOT EXISTS cost double precision DEFAULT 0;

CREATE TABLE IF NOT EXISTS ai_swarm_state (
  id text PRIMARY KEY DEFAULT 'default',
  ads jsonb NOT NULL DEFAULT '[]',
  dataset jsonb NOT NULL DEFAULT '[]',
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS debug_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error text,
  context jsonb,
  root_cause text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS debug_memory_created_at ON debug_memory(created_at DESC);

-- -----------------------------------------------------------------------------
-- Part B: Addy — companies, reviews, engine state, chat
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS addy_companies (
  id text PRIMARY KEY,
  payload jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS addy_app_state (
  id text PRIMARY KEY DEFAULT 'global',
  active_company_id text,
  settings jsonb NOT NULL DEFAULT '{}',
  engine jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS addy_review_cycles (
  id text PRIMARY KEY,
  company_id text NOT NULL REFERENCES addy_companies(id) ON DELETE CASCADE,
  payload jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS addy_review_cycles_company_created
  ON addy_review_cycles(company_id, created_at DESC);

CREATE TABLE IF NOT EXISTS addy_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES addy_companies(id) ON DELETE CASCADE,
  lesson text NOT NULL,
  source_cycle_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS addy_lessons_company_created
  ON addy_lessons(company_id, created_at DESC);

CREATE TABLE IF NOT EXISTS addy_cron_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'ok',
  companies_processed int NOT NULL DEFAULT 0,
  summary text,
  details jsonb DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS addy_brand_agent_memory (
  company_id text PRIMARY KEY REFERENCES addy_companies(id) ON DELETE CASCADE,
  owner_name text NOT NULL DEFAULT 'Demetrius',
  insights jsonb NOT NULL DEFAULT '[]',
  platform_prefs jsonb NOT NULL DEFAULT '{}',
  super_learning_count int NOT NULL DEFAULT 0,
  last_cursor_sync timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE addy_brand_agent_memory ADD COLUMN IF NOT EXISTS super_learning_count int DEFAULT 0;
ALTER TABLE addy_brand_agent_memory ADD COLUMN IF NOT EXISTS last_cursor_sync timestamptz;

CREATE TABLE IF NOT EXISTS addy_creative_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES addy_companies(id) ON DELETE CASCADE,
  asset_id text NOT NULL,
  profit_score double precision,
  analysis text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS addy_creative_analysis_company
  ON addy_creative_analysis(company_id, created_at DESC);

CREATE TABLE IF NOT EXISTS addy_social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES addy_companies(id) ON DELETE CASCADE,
  platform text NOT NULL,
  external_post_id text,
  message text,
  payload jsonb DEFAULT '{}',
  auto_boost boolean DEFAULT false,
  boost_budget double precision DEFAULT 5.00,
  boost_status text DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE addy_social_posts ADD COLUMN IF NOT EXISTS auto_boost boolean DEFAULT false;
ALTER TABLE addy_social_posts ADD COLUMN IF NOT EXISTS boost_budget double precision DEFAULT 5.00;
ALTER TABLE addy_social_posts ADD COLUMN IF NOT EXISTS boost_status text DEFAULT 'pending';

CREATE TABLE IF NOT EXISTS addy_chat_budget_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  amount double precision DEFAULT 0,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Part C: Intelligence — memory, predictions, A/B, competitive intel
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS addy_memory_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES addy_companies(id) ON DELETE CASCADE,
  memory text NOT NULL,
  impact_score double precision NOT NULL DEFAULT 0.5,
  profit_impact double precision DEFAULT 0,
  applied_at timestamptz,
  source text DEFAULT 'chat',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS addy_memory_entries_company_impact
  ON addy_memory_entries(company_id, impact_score DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS addy_profit_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES addy_companies(id) ON DELETE CASCADE,
  creative_summary text,
  predicted_roi double precision NOT NULL,
  confidence_score double precision NOT NULL DEFAULT 0.5,
  suggested_budget double precision,
  actual_roi double precision,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS addy_profit_predictions_company
  ON addy_profit_predictions(company_id, created_at DESC);

CREATE TABLE IF NOT EXISTS addy_competitive_intel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES addy_companies(id) ON DELETE CASCADE,
  competitor_name text NOT NULL,
  ad_copy text,
  estimated_ctr double precision,
  addy_notes text,
  detected_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS addy_competitive_intel_company
  ON addy_competitive_intel(company_id, detected_at DESC);

CREATE TABLE IF NOT EXISTS addy_ab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES addy_companies(id) ON DELETE CASCADE,
  test_name text NOT NULL,
  variant_a_creative text NOT NULL,
  variant_b_creative text NOT NULL,
  budget_per_variant double precision NOT NULL DEFAULT 15,
  spend_a double precision DEFAULT 0,
  spend_b double precision DEFAULT 0,
  roi_a double precision DEFAULT 0,
  roi_b double precision DEFAULT 0,
  status text NOT NULL DEFAULT 'running',
  winner text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

CREATE INDEX IF NOT EXISTS addy_ab_tests_company_status
  ON addy_ab_tests(company_id, status);

-- -----------------------------------------------------------------------------
-- Part D: Super Brain, daily audit, cron locks
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS addy_super_learning (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES addy_companies(id) ON DELETE CASCADE,
  question text NOT NULL,
  cursor_answer text NOT NULL,
  used_cursor boolean NOT NULL DEFAULT false,
  agent_url text,
  was_helpful boolean,
  profit_impact double precision,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS addy_super_learning_company
  ON addy_super_learning(company_id, created_at DESC);

CREATE TABLE IF NOT EXISTS addy_daily_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES addy_companies(id) ON DELETE CASCADE,
  audit_date date NOT NULL DEFAULT CURRENT_DATE,
  portfolio_roas double precision NOT NULL DEFAULT 0,
  spend double precision NOT NULL DEFAULT 0,
  profit double precision NOT NULL DEFAULT 0,
  target_roas double precision NOT NULL DEFAULT 3,
  budget_used_pct double precision NOT NULL DEFAULT 0,
  cuts_recommended int NOT NULL DEFAULT 0,
  keeps_recommended int NOT NULL DEFAULT 0,
  decision_brief text NOT NULL DEFAULT '',
  benchmarks jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, audit_date)
);

CREATE INDEX IF NOT EXISTS addy_daily_audit_company_date
  ON addy_daily_audit(company_id, audit_date DESC);

CREATE TABLE IF NOT EXISTS addy_cron_locks (
  job_name text PRIMARY KEY,
  locked_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  locked_by text
);

-- Recall similar memories (keyword + impact) for chat and reviews
CREATE OR REPLACE FUNCTION recall_similar_situations(
  p_company_id text,
  p_question text,
  p_limit int DEFAULT 5
)
RETURNS TABLE (
  memory text,
  impact_score double precision,
  similarity_score double precision
) LANGUAGE sql STABLE AS $$
  SELECT
    m.memory,
    m.impact_score,
    GREATEST(
      similarity(lower(m.memory), lower(p_question)),
      CASE WHEN m.memory ILIKE '%' || split_part(lower(p_question), ' ', 1) || '%' THEN 0.3 ELSE 0 END
    ) AS similarity_score
  FROM addy_memory_entries m
  WHERE m.company_id = p_company_id
    AND m.impact_score >= 0.4
  ORDER BY similarity_score DESC, m.impact_score DESC, m.created_at DESC
  LIMIT p_limit;
$$;

-- -----------------------------------------------------------------------------
-- Row Level Security (anon key from Next.js on Vercel)
-- -----------------------------------------------------------------------------

ALTER TABLE brain_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE profit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_swarm_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE debug_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE addy_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE addy_app_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE addy_review_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addy_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE addy_cron_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE addy_brand_agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE addy_creative_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE addy_social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE addy_chat_budget_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE addy_memory_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE addy_profit_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE addy_competitive_intel ENABLE ROW LEVEL SECURITY;
ALTER TABLE addy_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE addy_super_learning ENABLE ROW LEVEL SECURITY;
ALTER TABLE addy_daily_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE addy_cron_locks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY "brain_memory_anon" ON brain_memory FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "creative_memory_anon" ON creative_memory FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "profit_log_anon" ON profit_log FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "ai_swarm_state_anon" ON ai_swarm_state FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "debug_memory_anon" ON debug_memory FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "addy_companies_anon" ON addy_companies FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "addy_app_state_anon" ON addy_app_state FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "addy_review_cycles_anon" ON addy_review_cycles FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "addy_lessons_anon" ON addy_lessons FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "addy_cron_runs_anon" ON addy_cron_runs FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "addy_brand_agent_memory_anon" ON addy_brand_agent_memory FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "addy_creative_analysis_anon" ON addy_creative_analysis FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "addy_social_posts_anon" ON addy_social_posts FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "addy_chat_budget_events_anon" ON addy_chat_budget_events FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "addy_memory_entries_anon" ON addy_memory_entries FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "addy_profit_predictions_anon" ON addy_profit_predictions FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "addy_competitive_intel_anon" ON addy_competitive_intel FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "addy_ab_tests_anon" ON addy_ab_tests FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "addy_super_learning_anon" ON addy_super_learning FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "addy_daily_audit_anon" ON addy_daily_audit FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "addy_cron_locks_anon" ON addy_cron_locks FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
