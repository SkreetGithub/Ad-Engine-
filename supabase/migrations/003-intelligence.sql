-- Addy Intelligence v3 — run after schema.sql (safe to re-run)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Granular per-brand memory (wins/losses with impact)
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

-- Social posts: auto-boost
ALTER TABLE addy_social_posts ADD COLUMN IF NOT EXISTS auto_boost boolean DEFAULT false;
ALTER TABLE addy_social_posts ADD COLUMN IF NOT EXISTS boost_budget double precision DEFAULT 5.00;
ALTER TABLE addy_social_posts ADD COLUMN IF NOT EXISTS boost_status text DEFAULT 'pending';

-- Profit predictions
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

-- Competitive intel
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

-- A/B tests
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

-- Extend profit_log for per-brand ROI tracking
ALTER TABLE profit_log ADD COLUMN IF NOT EXISTS company_id text;
ALTER TABLE profit_log ADD COLUMN IF NOT EXISTS roi double precision;
ALTER TABLE profit_log ADD COLUMN IF NOT EXISTS action text;
ALTER TABLE profit_log ADD COLUMN IF NOT EXISTS cost double precision DEFAULT 0;

-- Recall similar memories (keyword + impact)
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

ALTER TABLE addy_memory_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE addy_profit_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE addy_competitive_intel ENABLE ROW LEVEL SECURITY;
ALTER TABLE addy_ab_tests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "addy_memory_entries_anon" ON addy_memory_entries FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "addy_profit_predictions_anon" ON addy_profit_predictions FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "addy_competitive_intel_anon" ON addy_competitive_intel FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "addy_ab_tests_anon" ON addy_ab_tests FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
