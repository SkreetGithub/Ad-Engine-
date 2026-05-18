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

ALTER TABLE addy_brand_agent_memory
  ADD COLUMN IF NOT EXISTS super_learning_count int DEFAULT 0;

ALTER TABLE addy_brand_agent_memory
  ADD COLUMN IF NOT EXISTS last_cursor_sync timestamptz;

ALTER TABLE addy_super_learning ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "addy_super_learning_anon" ON addy_super_learning FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
