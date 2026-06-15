# 09 — Deployment Runbook

> Status: Draft for approval · Owner: Eng/DevOps · Last updated: 2026-06-15
> Covers local dev, Supabase setup, Edge Function deploy, env/secrets, and EAS builds. The app runs fully in **mock mode with no backend**; sections below add the real backend/AI path.

## 1. Prerequisites
- Node LTS (≥ 20), npm (or pnpm), Git.
- Expo: `npx expo` (no global install needed) + the **Expo Go** app for quick device testing.
- For native/EAS builds: an **Expo (EAS) account**; Xcode (iOS) / Android Studio (Android) for local native runs.
- For backend: **Supabase account** + **Supabase CLI** (`npm i -g supabase` or `brew install supabase/tap/supabase`); Docker (for local `supabase start`, optional).
- For real AI: an OpenAI (or Replicate) API key.

## 2. Local setup (app only, mock mode)
```bash
# from repo root
npm install
cp .env.example .env          # leave AI keys blank; AI_MOCK_MODE=true
npm run start                 # Expo dev server
# press i (iOS sim) / a (Android emulator), or scan QR with Expo Go
```
With no Supabase/AI env set, the app runs entirely local: library, tutorials, favorites/recents, and **mock** AI/upload flows (Demo-mode badge shown). This is the default demo path.

Useful scripts: `npm run ios`, `npm run android`, `npm run lint`, `npm run typecheck`, `npm run test`, `npx expo-doctor`.

## 3. Supabase setup (enables metadata + storage)
1. Create a project at supabase.com → note the **Project URL**, **anon key** (public), **service-role key** (secret), and **project ref**.
2. Link CLI: `supabase login` then `supabase link --project-ref <PROJECT_REF>`.
3. Apply schema:
   ```bash
   supabase db push            # applies supabase/migrations/* (init, rls, storage)
   # or, for a clean local DB: supabase start && supabase db reset
   ```
4. Seed content: run `supabase/seed.sql` (e.g., `psql` or the SQL editor). It is **generated** from `src/content` via `npm run seed:gen` (the committed file is kept in sync by a drift test) — regenerate after editing content rather than hand-editing.
5. Create storage buckets (if not created by migration `0003_storage.sql`): `drawing-assets` (public read), `user-uploads` (private), `ai-generations` (private). Apply storage policies per `04` §5/§6.
6. Put the public values in the app env:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
   ```
7. Restart the dev server. The app now upserts `anonymous_sessions` and (after M6/M7/M8) stores generation/upload metadata. **Never** put the service-role key in `.env` consumed by the app — it belongs only to Edge Function secrets (§4).

## 4. Edge Function deployment (enables real AI)
Secrets live **only** in Supabase function env — never in the app bundle.
```bash
# set server-side secrets (examples)
supabase secrets set OPENAI_API_KEY=sk-...           # or REPLICATE_API_TOKEN=...
supabase secrets set AI_PROVIDER=openai
supabase secrets set AI_MOCK_MODE=false              # true to force mock even with keys
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service-role>   # if functions write with service role
# rate limiting + global cap (real mode only; mock is unlimited)
supabase secrets set AI_RATE_LIMIT_ENABLED=true AI_RATE_LIMIT_PER_DAY=50
supabase secrets set AI_GLOBAL_DAILY_LIMIT=500 AI_LIMIT_WINDOW_HOURS=24
# optional dollar ceiling (provider-budget integration; count cap enforced first):
supabase secrets set AI_GLOBAL_DAILY_SPEND_CAP_USD=  # leave blank to use count cap only
# model IDs — verify current IDs at setup; defaults documented in _shared/ai-provider/config.ts
supabase secrets set OPENAI_MODERATION_MODEL=<verified-id> OPENAI_REWRITE_MODEL=<verified-id> OPENAI_IMAGE_MODEL=<verified-id>
# data retention window (days)
supabase secrets set DATA_RETENTION_DAYS=30

# local run / smoke test
supabase functions serve                              # serves all functions locally
# deploy
supabase functions deploy moderate-prompt
supabase functions deploy generate-image
supabase functions deploy transform-image
supabase functions deploy process-uploaded-image
```
Verify each per `08-test-plan.md` §4. If `AI_MOCK_MODE=true` or a key is missing, functions return mock results (`demo:true`) — safe for staging demos. Mock mode is never rate-limited; real mode enforces the per-device limit and the global daily cap above (per-device checked first, then global) and returns a calm child/parent-safe message when either is exceeded.

### Data retention purge (V1)
Anonymous uploaded/AI images + metadata are retained for `DATA_RETENTION_DAYS` (default **30**), then purged (policy: `04-database-schema.md` §9). Set up the scheduled purge once per project:
- **Option A — `pg_cron`** (applied by `migrations/0004_retention.sql`): a daily job calls a purge function that deletes expired `uploaded_images`/`ai_generations` rows and their storage objects.
- **Option B — scheduled Edge Function**: a `cleanup` function run on a schedule (e.g., Supabase scheduled function / external cron) does the same with the service role.
Verify by inserting a back-dated test row and confirming it (and its storage object) is removed on the next run. To disable purging in dev, set `DATA_RETENTION_DAYS=0`/unset.

## 5. Environment variables (reference)
See `.env.example` for the authoritative list. Summary:

| var | scope | secret? | notes |
| --- | --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | app (client) | no | public |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | app (client) | no | public anon key |
| `EXPO_PUBLIC_APP_ENV` | app (client) | no | `development`/`staging`/`production` |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions | **YES** | server only |
| `SUPABASE_PROJECT_REF` | tooling/CI | no | project ref |
| `OPENAI_API_KEY` | Edge Functions | **YES** | server only |
| `REPLICATE_API_TOKEN` | Edge Functions | **YES** | server only |
| `AI_PROVIDER` | Edge Functions | no | `openai`/`replicate`/`mock` |
| `AI_MOCK_MODE` | Edge Functions | no | `true` default; forces mock |
| `AI_RATE_LIMIT_ENABLED` | Edge Functions | no | `true` default; rate limiting in real mode (mock is always unlimited) |
| `AI_RATE_LIMIT_PER_DAY` | Edge Functions | no | per-device/session generation cap per window (default `50`) |
| `AI_GLOBAL_DAILY_LIMIT` | Edge Functions | no | global request-count cap across all devices per window (default `500`) |
| `AI_GLOBAL_DAILY_SPEND_CAP_USD` | Edge Functions | no | optional dollar ceiling; provider-budget integration (count cap enforced first) |
| `AI_LIMIT_WINDOW_HOURS` | Edge Functions | no | rolling window for both limits (default `24`) |
| `OPENAI_MODERATION_MODEL` | Edge Functions | no | model ID; **verified at implementation**, has a documented default |
| `OPENAI_REWRITE_MODEL` | Edge Functions | no | model ID; verified at implementation, default documented |
| `OPENAI_IMAGE_MODEL` | Edge Functions | no | model ID; verified at implementation, default documented |
| `REPLICATE_IMAGE_MODEL` | Edge Functions | no | model/version ID for the Replicate provider |
| `DATA_RETENTION_DAYS` | Edge Functions / DB | no | anonymous image+metadata retention window (default `30`; `0`/unset disables purge in dev) |

**Rule:** anything secret is set via `supabase secrets set` (or CI secret store), **never** prefixed `EXPO_PUBLIC_`, never committed. `.env` is git-ignored; only `.env.example` is committed. Model IDs are **configuration, not code** — set/verify them via these env vars rather than hardcoding literals.

## 6. EAS build setup (native binaries)
```bash
npm i -g eas-cli && eas login
eas build:configure                  # creates eas.json (development/preview/production profiles)
# public envs for builds: set in eas.json env or EAS project env vars (EXPO_PUBLIC_* only)
eas build -p ios --profile preview
eas build -p android --profile preview
# internal distribution / store submission
eas submit -p ios
eas submit -p android
```
- Set `EXPO_PUBLIC_*` build-time vars via EAS env (never secrets).
- iOS needs Apple Developer account + bundle id; Android needs a keystore (EAS-managed is fine).
- `app.config.ts` holds name/slug/icon/splash/permissions (camera, photo library usage strings — required by stores).

## 7. iOS / Android release notes
- **iOS:** set `NSCameraUsageDescription` + `NSPhotoLibraryUsageDescription` (kid-friendly wording); choose category; if targeting the **Kids** category, expect stricter review (no third-party analytics/ads, privacy practices) — treat as a gated, human-reviewed step.
- **Android:** Play "Designed for Families" / Data safety form; camera + storage permissions justified.
- **Both:** app icons + splash, privacy policy URL, age rating questionnaire. These are **release** tasks, not demo tasks.

## 8. Configuration matrix
| mode | Supabase env | AI secrets | behavior |
| --- | --- | --- | --- |
| Pure demo (default) | absent | absent | fully local; mock AI; Demo badge; no DB writes |
| Backend-only | present | absent / `AI_MOCK_MODE=true` | metadata stored; mock AI |
| Full | present | present, `AI_MOCK_MODE=false` | metadata stored; real AI |

## 9. Rollback & safety
- App: revert to the last good commit/build; EAS keeps prior builds.
- Functions: `supabase functions deploy` is per-function; redeploy a prior version from git.
- DB: migrations are forward-only in V1; take a snapshot before applying in a shared project. Toggle `AI_MOCK_MODE=true` to instantly stop real provider spend.

## 10. CI suggestions (future, not V1-blocking)
Lint + typecheck + unit tests on PR; `expo-doctor`; optional EAS preview build on main; secret scanning. Documented as a follow-up.
