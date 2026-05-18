-- Cron locks — prevent duplicate GitHub Actions + Vercel + pg_cron runs
CREATE TABLE IF NOT EXISTS addy_cron_locks (
  job_name text PRIMARY KEY,
  locked_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  locked_by text
);

ALTER TABLE addy_cron_locks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "addy_cron_locks_anon" ON addy_cron_locks FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
