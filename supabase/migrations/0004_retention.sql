-- BloomDraw — Data retention purge (docs/04 §9, docs/09 §4)
--
-- Anonymous uploaded/AI images + metadata are retained for DATA_RETENTION_DAYS
-- (default 30), then purged. This migration installs a SQL function that deletes
-- expired ROWS. Purging the corresponding STORAGE OBJECTS is done by the
-- scheduled cleanup Edge Function (service role) — SQL cannot remove storage
-- objects directly. Content tables are never purged.
--
-- Scheduling: enable pg_cron (or run the function from a scheduled Edge Function).
-- The pg_cron schedule is left commented because the extension may not be enabled
-- on all plans; uncomment after enabling it.

create or replace function purge_expired_anonymous_data(retention_days int default 30)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from ai_generations
   where created_at < now() - make_interval(days => retention_days);
  delete from uploaded_images
   where created_at < now() - make_interval(days => retention_days);
end;
$$;

-- Optional scheduling via pg_cron (uncomment after `create extension pg_cron;`):
-- select cron.schedule(
--   'bloomdraw-retention-purge',
--   '0 3 * * *',                       -- daily at 03:00 UTC
--   $$ select purge_expired_anonymous_data(30); $$
-- );
