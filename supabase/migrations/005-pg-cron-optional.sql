-- OPTIONAL: Supabase pg_cron (Database → Extensions → pg_cron)
-- Replace YOUR_CRON_SECRET and app URL before running.

-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- CREATE EXTENSION IF NOT EXISTS pg_net;

-- SELECT cron.schedule(
--   'addy-optimize-6h',
--   '0 */6 * * *',
--   $$
--   SELECT net.http_get(
--     url := 'https://ad-engine-khaki.vercel.app/api/cron/optimize-ads',
--     headers := jsonb_build_object(
--       'Authorization', 'Bearer YOUR_CRON_SECRET'
--     )
--   );
--   $$
-- );
