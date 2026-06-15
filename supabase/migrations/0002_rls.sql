-- BloomDraw — Row-Level Security (docs/04 §6, docs/03 §10)
--
-- HONEST V1 LIMITATION: there is no auth in V1, so `device_id` is NOT a secure
-- identity — it is a client-generated value and can be spoofed. The policies
-- below are a pragmatic best-effort for anonymous, non-PII metadata. True
-- per-device ownership requires auth (post-V1, via auth.uid()). We do NOT treat
-- device_id as a trust boundary, and the service-role key is never in the app.

alter table drawing_categories enable row level security;
alter table drawing_items      enable row level security;
alter table drawing_steps      enable row level security;
alter table anonymous_sessions enable row level security;
alter table ai_generations     enable row level security;
alter table uploaded_images    enable row level security;

-- Content: world-readable to the mobile client (anon). No client writes — only
-- migrations/seed (and future admin tooling) modify content.
create policy "content categories are readable" on drawing_categories
  for select to anon, authenticated using (true);
create policy "content items are readable" on drawing_items
  for select to anon, authenticated using (true);
create policy "content steps are readable" on drawing_steps
  for select to anon, authenticated using (true);

-- Anonymous sessions: the client (anon key) upserts its own device row. Without
-- auth we cannot bind a row to a verified caller, so insert/select/update are
-- open to anon (best-effort; non-PII). No deletes from the client.
create policy "anon can create a session" on anonymous_sessions
  for insert to anon, authenticated with check (true);
create policy "anon can read sessions" on anonymous_sessions
  for select to anon, authenticated using (true);
create policy "anon can update sessions" on anonymous_sessions
  for update to anon, authenticated using (true) with check (true);

-- ai_generations / uploaded_images: NO anon policies. RLS is enabled, so the
-- mobile client cannot read or write these tables. They are written exclusively
-- by Supabase Edge Functions using the service role (which bypasses RLS),
-- arriving in Milestone 6. The app keeps its own copy in local recents.
