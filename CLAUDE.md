# CLAUDE.md — BloomDraw operating rules

Operating guide for any AI/dev agent working in this repo. Read this first, then `/docs`.

## Project goal
Ship a beautiful, fast, kid-safe MVP of **BloomDraw** — an AI-powered drawing companion for kids (ages 3–12) that turns preloaded lessons, photos, and text prompts into traceable art, sketches, cartoons, and a projector-ready preview. Target: investor demo + user pilot + manufacturer conversations, structured for App Store / Play Store later. Full scope in `docs/00-product-brief.md` and `docs/01-prd.md`.

## Stack (canonical — see `docs/03-technical-architecture.md`)
- **App:** Expo (managed; pin the **latest stable Expo SDK at implementation time** in `README.md` after setup — no hardcoded SDK number), TypeScript (strict), Expo Router, Reanimated 3 + Moti, gesture-handler, Zustand + AsyncStorage (persist), expo-image-picker / camera / image-manipulator / image, expo-font (Baloo 2 + Nunito), token-based theme.
- **Backend:** Supabase (Postgres + Storage + Edge Functions, Deno) + `@supabase/supabase-js`.
- **AI:** provider-agnostic `AIProvider` (OpenAI default, Replicate alt, Mock always) behind Edge Functions.

## Engineering principles
- Build **vertical slices**, milestone by milestone (`docs/07-implementation-plan.md`); each milestone ends runnable + demoable.
- Strong, explicit TypeScript. No `any` without a written reason.
- Reusable components, **but not over-abstracted**. Prefer the simplest thing that meets the AC.
- Screens stay thin; data/network/AI logic lives in `src/services`. Secrets never reach the client.
- Match surrounding code style; keep comments meaningful and sparse.
- Mock mode is the **default** — the app must run end-to-end with zero keys.

## No over-engineering rule
Do not add layers, abstractions, libraries, or config the MVP doesn't need. One state lib (Zustand), one styling approach (token theme), one backend (Supabase). If you're tempted to generalize, stop and ship the concrete case.

## No non-MVP features rule
Do **not** build (V1): login/auth, child profiles, cloud sync, payments/subscriptions, real Bluetooth/Wi-Fi projector pairing, parent/teacher/B2B dashboards, marketplace, social sharing, video tutorials, AI-generated *true* step-by-step tutorials, uploaded-image *true* step-by-step tutorials. These are roadmap only (`docs/10-handoff.md`). If asked to add one, flag it as out-of-scope and confirm before building.

## AI safety rules (non-negotiable)
- **Always moderate before generating.** Flow: `moderate-prompt` → `safe` / `rewritten` / `blocked`, then generate only on safe/rewritten.
- Block: violence, sexual/adult, hate, self-harm, dangerous, disturbing/scary-for-children. Borderline → gentle **rewrite**; clearly unsafe → **block**. Never loop rewrites.
- **Never expose** raw moderation categories, provider names/errors, codes, or stack traces to the child. Log diagnostics server-side only.
- Child-facing copy is fixed and centralized in `src/lib/strings.ts`:
  - Blocked: "Let’s make something fun and safe to draw. Try asking for an animal, space scene, vehicle, flower, or cartoon character."
  - Rewritten banner: "I made your idea a little more kid-friendly."
  - Generic AI error / timeout: "Our art helper is taking a quick nap. Let's try again!"
  - Per-device limit reached: "Let's take a tiny break and try again in a moment."
  - Global daily cap reached: "Our art helper is resting for now. Please try again later."
- All AI calls go through Supabase Edge Functions (`docs/05-api-contract.md`). No direct provider calls from the app.
- **Cost controls (real mode only; mock is unlimited):** enforce a configurable per-device/session limit **and** a configurable global daily cap (request count; optional provider-budget spend cap) server-side. Never expose counts, spend, or limits to the child. Details: `docs/03-technical-architecture.md` §11.

## Supabase rules
- Client uses **anon key only** (`EXPO_PUBLIC_*`). Service-role key lives **only** in Edge Function secrets.
- Enable RLS on all tables: content read-only to anon; activity rows scoped to the caller's `device_id`; activity writes go through Edge Functions (service role).
- Store **anonymous, non-PII** data only (no names/emails/login). `device_id` is a random UUID.
- Buckets: `drawing-assets` (public), `user-uploads` + `ai-generations` (private, signed URLs). Schema: `docs/04-database-schema.md`.
- The app must run fully when Supabase env is absent (metadata writes are skipped silently).

## Secret handling rules
- **No hardcoded secrets, ever.** No secret key may appear in source, `.env` consumed by the app, any `EXPO_PUBLIC_*` var, or the JS bundle.
- Secrets set via `supabase secrets set` / CI secret store only. `.env` is git-ignored; only `.env.example` is committed.
- A bundle/string secret-scan is part of launch criteria (`docs/01-prd.md` AC-11, `docs/08-test-plan.md`).

## Testing commands
Run after each milestone and before any commit:
```bash
npm install
npm run lint
npm run typecheck
npm run test
npx expo-doctor
supabase functions serve   # smoke the 4 functions in mock mode
```
Fix all errors. If a script is missing, add it or document why. Full matrix: `docs/08-test-plan.md`.

## Documentation update rules
- `/docs` is the source of truth. **If implementation deviates from a doc, update the doc in the same change.**
- Keep `docs/10-handoff.md` current as milestones complete (built features, files changed, tests run, known issues).
- New decisions/trade-offs go in `docs/03-technical-architecture.md` (§Alternatives) or the relevant doc.

## Workflow & commit rules
- **Do not push to any remote.** Local commits only, **after a completed milestone**, and only with a summary of what was committed.
- Do not start implementation until the human explicitly approves ("Approved. Proceed to implementation.").
- If something is unclear but reversible, make the best call and continue; ask only when truly blocked.

## App-store readiness notes
- Structure for iOS + Android release, but **do not claim** App Store/Play approval, Kids-category eligibility, or COPPA/GDPR-K compliance — those require human/legal review (`docs/09-deployment-runbook.md` §7).
- Provide permission usage strings (camera, photo library), icons/splash, and a privacy policy placeholder; real compliance is a gated pre-release task.

## Asset rules
- No copyrighted or competitor assets. Placeholders are locally generated/neutral; hero demo art is original/simple. Fonts via license-clear Google Fonts (pending brand sign-off).
