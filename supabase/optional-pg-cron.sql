-- =============================================================================
-- Supabase pg_cron — Addy autonomous profit cycle
-- Run AFTER supabase/schema.sql
--
-- 1. Dashboard → Database → Extensions → enable: pg_cron, pg_net
-- 2. Replace YOUR_CRON_SECRET and app URL in the INSERT below
-- 3. Run this entire file in SQL Editor
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Store secrets here (same values as Vercel CRON_SECRET + NEXT_PUBLIC_APP_URL)
CREATE TABLE IF NOT EXISTS addy_cron_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE addy_cron_config ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "addy_cron_config_service" ON addy_cron_config FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ⚠️ EDIT THESE TWO LINES before running (must match Vercel env)
INSERT INTO addy_cron_config (key, value) VALUES
  ('app_url', 'https://ad-engine-khaki.vercel.app'),
  ('cron_secret', 'YOUR_CRON_SECRET')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- HTTP helper — calls your Vercel API with Bearer auth
CREATE OR REPLACE FUNCTION addy_cron_invoke(api_path text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_url text;
  cron_secret text;
  req_id bigint;
BEGIN
  SELECT value INTO base_url FROM addy_cron_config WHERE key = 'app_url';
  SELECT value INTO cron_secret FROM addy_cron_config WHERE key = 'cron_secret';

  IF base_url IS NULL OR cron_secret IS NULL OR cron_secret = 'YOUR_CRON_SECRET' THEN
    RAISE EXCEPTION 'Update addy_cron_config: set app_url and cron_secret (same as Vercel CRON_SECRET)';
  END IF;

  SELECT net.http_get(
    url := rtrim(base_url, '/') || api_path,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || cron_secret,
      'x-cron-source', 'pg_cron',
      'Accept', 'application/json'
    ),
    timeout_milliseconds := 120000
  ) INTO req_id;

  RETURN req_id;
END;
$$;

-- Remove old Addy schedules if re-running this file
DO $$
DECLARE
  job record;
BEGIN
  FOR job IN SELECT jobname FROM cron.job WHERE jobname LIKE 'addy-%'
  LOOP
    PERFORM cron.unschedule(job.jobname);
  END LOOP;
END $$;

-- Full cycle every 6 hours: Meta sync → gather all feedback → review → audit → competitive → A/B
SELECT cron.schedule(
  'addy-full-cycle-6h',
  '5 */6 * * *',
  $$SELECT addy_cron_invoke('/api/cron/addy-cycle');$$
);

-- Meta metrics refresh mid-cycle (every 3h) so spend/ROAS stay current between full reviews
SELECT cron.schedule(
  'addy-meta-sync-3h',
  '20 */3 * * *',
  $$SELECT addy_cron_invoke('/api/cron/sync-facebook-metrics');$$
);

-- Optional: lightweight optimize only (uncomment if you want extra runs between full cycles)
-- SELECT cron.schedule(
--   'addy-optimize-12h',
--   '0 8,20 * * *',
--   $$SELECT addy_cron_invoke('/api/cron/optimize-ads');$$
-- );

COMMENT ON TABLE addy_cron_config IS 'pg_cron → Vercel: app_url + cron_secret for Addy autonomous runs';
COMMENT ON FUNCTION addy_cron_invoke IS 'Calls Addy API with CRON_SECRET; used by pg_cron schedules';

-- Verify scheduled jobs:
-- SELECT jobid, jobname, schedule, command FROM cron.job WHERE jobname LIKE 'addy-%';

-- View recent HTTP responses from pg_net:
-- SELECT * FROM net._http_response ORDER BY created DESC LIMIT 10;
