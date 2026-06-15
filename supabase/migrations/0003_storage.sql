-- BloomDraw — Storage buckets (docs/04 §5, docs/05 §6)
--
-- drawing-assets : public-read (non-sensitive preloaded art)
-- user-uploads   : private (anonymous uploaded/captured originals) — signed URLs
-- ai-generations : private (AI outputs / transforms) — signed URLs
--
-- Private objects are served to the app via short-TTL signed URLs created with
-- the service role (Edge Functions, M6+). The upload flow that writes to these
-- buckets arrives in Milestone 8; nothing here implements upload/camera or AI.

insert into storage.buckets (id, name, public)
values
  ('drawing-assets', 'drawing-assets', true),
  ('user-uploads', 'user-uploads', false),
  ('ai-generations', 'ai-generations', false)
on conflict (id) do nothing;

-- Public bucket: allow anon read of objects (public buckets are world-readable,
-- but we add an explicit select policy for clarity/portability).
create policy "drawing-assets are public-readable" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'drawing-assets');

-- Private buckets (user-uploads, ai-generations): NO anon policies. Access is via
-- service-role signed URLs only. Client-direct upload policies (scoped to a
-- device path) can be added in Milestone 8 if we choose client-direct uploads.
