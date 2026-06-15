# 03 — Technical Architecture

> Status: Draft for approval · Owner: Engineering · Last updated: 2026-06-15
> Canonical decisions live here. Other docs reference these names verbatim.

## 1. Stack

### App (client)
- **Expo (managed)** — target the **latest stable Expo SDK at implementation time**; pin the exact version in `README.md` after setup. Enable the New Architecture if the pinned SDK/RN version supports it cleanly. Do not hardcode a specific SDK number across the codebase.
- **TypeScript** (strict).
- **Expo Router** (file-based routing, typed routes).
- **React Native Reanimated 3** + **Moti** for animation; **react-native-gesture-handler** for projector gestures.
- **Styling:** lightweight **design-token theme** (a typed `theme` object) + `StyleSheet`, exposed via a `ThemeProvider`/`useTheme` hook. *(Rationale: full control of the premium/animated look without NativeWind's metro/babel config surface. NativeWind remains a viable alternative; see §13 Alternatives considered.)*
- **State:** **Zustand** stores with `persist` middleware over **AsyncStorage** (`@react-native-async-storage/async-storage`) for age, favorites, recents, onboarding.
- **Media:** `expo-image-picker`, `expo-camera`, `expo-image-manipulator`, `expo-image` (rendering), `expo-file-system` (temp files).
- **Misc:** `expo-font` + `@expo-google-fonts/baloo-2` + `@expo-google-fonts/nunito`, `expo-haptics`, `expo-crypto` (device id), `expo-linear-gradient`, `expo-status-bar`.

### Backend
- **Supabase**: Postgres + Storage + Edge Functions (Deno) + JS client (`@supabase/supabase-js`).
- Edge Functions are the **only** place secret AI keys exist.

### AI
- Provider-agnostic **`AIProvider`** interface (§7) with implementations: **OpenAI** (default), **Replicate** (alt), **Mock** (always available, default in dev). Selected by env (`AI_PROVIDER`, `AI_MOCK_MODE`).

## 2. App architecture (layers)

```
UI (screens/components)        ← presentational + screen composition
  │ hooks (useAgeFilter, useFavorites, useRecents, useAiGenerate, useTransform)
  ▼
state (Zustand stores)         ← age, favorites, recents, ui; persisted slices
  │
services (client API layer)    ← supabase client, edgeFunctions client, sessions, storage upload
  ▼
Edge Functions (server)        ← moderate-prompt, generate-image, transform-image, process-uploaded-image
  │ AIProvider abstraction (openai | replicate | mock) + moderation + key handling
  ▼
External AI providers + Supabase Postgres/Storage
```

Principles: screens stay thin; data access lives in `services/`; AI/network details never leak into components; **no secret ever touches the client**.

## 3. Folder structure (planned)

```
BloomDraw Codebase/
├─ app/                          # Expo Router routes (file-based)
│  ├─ _layout.tsx                # Root: providers (theme, fonts, stores), splash gate
│  ├─ index.tsx                  # Boot → redirect to onboarding or (tabs)
│  ├─ onboarding.tsx             # First-run age picker
│  ├─ (tabs)/
│  │  ├─ _layout.tsx             # Bottom tab navigator
│  │  ├─ index.tsx               # Home
│  │  ├─ explore.tsx             # Library
│  │  ├─ create.tsx              # Create hub
│  │  ├─ recents.tsx             # Recents
│  │  └─ settings.tsx            # Settings
│  ├─ drawing/[slug].tsx         # Drawing Detail
│  ├─ tutorial/[slug].tsx        # Step-by-Step Tutorial
│  ├─ create/
│  │  ├─ ai.tsx                  # AI Prompt
│  │  ├─ ai-result.tsx           # AI Result
│  │  ├─ upload.tsx              # Upload/Capture
│  │  └─ variants.tsx            # Variant Selection
│  ├─ favorites.tsx              # Favorites (also surfaced on Home)
│  └─ projector.tsx              # Projector Preview (modal/stack)
├─ src/
│  ├─ components/                # Button, Card, Chip, AgeFilter, EmptyState, Loader, ErrorState, StepProgress, ImageVariantCard, ProjectorCanvas, DemoModeBadge, …
│  ├─ theme/                     # tokens.ts, theme.ts, ThemeProvider.tsx, useTheme.ts
│  ├─ state/                     # useAgeStore, useFavoritesStore, useRecentsStore, useUiStore (+ persist config)
│  ├─ services/
│  │  ├─ supabase.ts             # client init (guarded: returns null if unconfigured)
│  │  ├─ session.ts             # device id + anonymous_sessions upsert
│  │  ├─ edge.ts                 # typed callers for the 4 Edge Functions
│  │  ├─ storage.ts              # upload to buckets, signed URLs
│  │  └─ ai.ts                   # client-facing orchestration (moderate→generate→transform)
│  ├─ content/                   # seed: categories.ts, items/ (per-category), heroes, types
│  ├─ lib/                       # strings.ts (all child-facing copy), images.ts (placeholder), validation.ts, format.ts
│  └─ types/                     # shared TS types: DB-row types (mirror Postgres enums incl. pending/processing) kept separate from API-response types (client-visible subset) — see 05 §1
├─ supabase/
│  ├─ migrations/                # 0001_init.sql, 0002_rls.sql, …
│  ├─ seed.sql                   # categories + items + steps seed (mirrors src/content)
│  └─ functions/
│     ├─ _shared/                # ai-provider/ (openai.ts, replicate.ts, mock.ts, index.ts), moderation.ts, cors.ts, errors.ts, env.ts
│     ├─ moderate-prompt/
│     ├─ generate-image/
│     ├─ transform-image/
│     └─ process-uploaded-image/
├─ assets/                       # placeholder art, fonts, splash/icon
├─ docs/                         # this folder
├─ app.json / app.config.ts      # Expo config
├─ .env.example                  # documented; real .env is git-ignored
├─ CLAUDE.md · README.md
```

## 4. Navigation structure

- **Root layout** loads fonts + theme + hydrates Zustand, holds the splash until ready, then routes: `hasOnboarded ? (tabs) : onboarding`.
- **Bottom tabs (5):** Home · Explore · Create · Recents · Settings. (Matches the brief; Favorites is surfaced within Home + reachable as a route. Projector is not a tab — it opens from result/detail screens.)
- **Stack/modal routes:** drawing detail, tutorial, AI prompt/result, upload/variants, projector preview, favorites.
- Typed routes enabled; deep-linkable by slug for drawings (useful for future sharing, not built in V1).

## 5. Supabase architecture

- **Postgres** holds content (`drawing_categories`, `drawing_items`, `drawing_steps`) and anonymous activity (`anonymous_sessions`, `ai_generations`, `uploaded_images`). Full schema: `04-database-schema.md`.
- **Storage buckets:** `drawing-assets` (content; public-read), `user-uploads` (private), `ai-generations` (private). Private buckets served via signed URLs.
- **Client uses the anon key only** (`EXPO_PUBLIC_SUPABASE_ANON_KEY`). RLS allows reading content and inserting/updating only rows tied to the caller's own `device_id`/session. Service-role key is used **only** inside Edge Functions.
- Content can be served **two ways**: (a) bundled local seed in `src/content` (works offline, always available), and (b) the same data in Postgres for parity/future remote updates. V1 reads from local seed for speed/offline; Supabase mirrors it. This keeps the app demoable with zero backend.
- **`src/content` is the single source of truth for content.** `supabase/seed.sql` is **generated from it** (a `scripts/generate-seed.ts` generator, or an explicit TODO + checklist until that exists) — never hand-edited as a parallel source. This prevents seed drift between the app and DB. See `04-database-schema.md` §7.
- **Offline & connectivity behavior:** (1) Supabase **unconfigured** → local/mock mode; every flow stays demoable (mock AI/upload). (2) Supabase **configured but offline** → library/favorites/recents (local) still work; AI/upload **must not silently call the real provider** — the client checks connectivity/short-circuits and shows the offline/nap message + Retry. The app must **never crash** on connectivity loss. (3) **Optional dev-only mock override** (e.g., an `EXPO_PUBLIC_FORCE_MOCK`/dev flag) lets a developer force mock results for offline demos even when keys/Supabase are configured — dev convenience only, never a production default.

## 6. Edge Functions

Four Deno functions (contracts in `05-api-contract.md`):
1. `moderate-prompt` — classify → safe / rewritten / blocked (+ safe_prompt, user_message, reason_code).
2. `generate-image` — safe_prompt → image (+ derived line art when requested).
3. `transform-image` — image + style → transformed image.
4. `process-uploaded-image` — uploaded image + styles → all requested variants.

Shared `_shared/`: the `AIProvider` factory, moderation helper, CORS, error mapping (provider error → child-safe message + server log), and env/secret access. Each function: validates input → resolves provider (mock if keys missing/`AI_MOCK_MODE=true`) → does the work → writes/updates Postgres rows with the **service role** → returns a typed, child-safe JSON envelope.

## 7. AI provider abstraction

```ts
// supabase/functions/_shared/ai-provider/index.ts
export type ModerationStatus = 'safe' | 'rewritten' | 'blocked'; // terminal result; 'pending' is a DB-row write state only (see 04 §1 / 05 §1)
export type TransformStyle = 'line_art' | 'sketch' | 'cartoon' | 'coloring_page';
export type AgeRange = '3-5' | '6-8' | '9-12';

export interface ModerationResult {
  status: ModerationStatus;
  safePrompt: string;        // original or rewritten; '' when blocked
  userMessage: string;       // child-safe copy (from strings)
  reasonCode: string;        // server-side only (e.g. 'violence', 'ok', 'rewrite_softened')
}

export interface ImageResult { imageUrl: string; provider: string; meta?: Record<string, unknown>; }

export interface AIProvider {
  moderatePrompt(prompt: string, ageRange?: AgeRange): Promise<ModerationResult>;
  rewritePromptForKidSafety(prompt: string, ageRange?: AgeRange): Promise<string>;
  generateImage(prompt: string, options: { ageRange?: AgeRange; style?: 'illustration' | 'line_art' | 'projection' }): Promise<ImageResult>;
  transformImage(imageUrl: string, style: TransformStyle): Promise<ImageResult>;
  generateLineArt(imageUrl: string): Promise<ImageResult>;
  generateSketch(imageUrl: string): Promise<ImageResult>;
  generateCartoon(imageUrl: string): Promise<ImageResult>;
  generateColoringPage(imageUrl: string): Promise<ImageResult>;
}

export function getProvider(): AIProvider { /* mock if AI_MOCK_MODE or missing keys; else openai|replicate */ }
```

- **OpenAIProvider** (default real): a moderation model, a small chat-completion model for rewrite (strict kid-safe system prompt), and an image model for generation + edits/transforms. **Model IDs are not hardcoded.** They are read from server-side env (`OPENAI_MODERATION_MODEL`, `OPENAI_REWRITE_MODEL`, `OPENAI_IMAGE_MODEL`) with sensible documented defaults, and the **exact current model IDs are verified at implementation time** (per brief open question #1) — never scattered as string literals through the app.
- **ReplicateProvider** (alt): equivalent calls against hosted image models, model IDs/versions likewise configurable via env (e.g., `REPLICATE_IMAGE_MODEL`).
- **MockProvider** (default in dev): deterministic, offline. Moderation uses a local keyword blocklist + gentle-rewrite map; image methods return stable placeholder/derived images (themed gradients, local grayscale/threshold transforms) so every flow completes without network/keys. Mock responses carry a `demo: true` flag → app shows the **Demo mode** badge.

Model IDs live in one config object per provider (`_shared/ai-provider/config.ts`), sourced from env — so verifying/swapping a model is a single-place change with no client or contract impact.

Selection: `AI_MOCK_MODE=true` (default) forces Mock; otherwise `AI_PROVIDER` picks openai/replicate; if the selected provider's key is missing, fall back to Mock and log a server-side warning.

## 8. Local storage

- Zustand `persist` (AsyncStorage) slices: `age` (`selectedAgeRange`, `hasOnboarded`), `favorites` (array of drawing slugs), `recents` (array of creation records: id, type `ai|upload`, thumbnail/local uri + optional remote url, prompt/style, createdAt), `ui` (`lastOpenedCategory`).
- All reads safe-parse; on corruption a slice resets to its default. Recents capped (e.g., last 50) to bound storage. Images for recents are referenced by URI (local cache or remote signed URL), not stored as blobs.

## 9. Image processing pipeline (V1)

1. Select/capture (Image Picker / Camera).
2. **Client preprocess** (Image Manipulator): resize to a max dimension (e.g., 1024px), compress, normalize orientation; optional local grayscale preview.
3. Upload original to `user-uploads` (or pass a short-lived reference) — skipped in pure-local mock if no Supabase.
4. Edge Function (`process-uploaded-image` / `transform-image`) requests variants from the provider (or Mock derives them locally).
5. App shows variants in Variant Selection; user picks one.
6. Selected variant → recents (+ metadata update). Open in Projector Preview.

Advanced on-device CV is explicitly out of scope; mock transforms are simple deterministic image ops so the UX is complete offline.

## 10. Security considerations

- **Secrets server-side only.** No secret key is ever read on the client; client holds only `EXPO_PUBLIC_*` (Supabase URL + anon key + app env). A bundle string-scan is part of launch criteria (PRD AC-11).
- **RLS** restricts anonymous rows to the caller's own `device_id`; content tables are read-only to anon. Service role used only in Edge Functions.
- **Prompt moderation before generation**, always (V1 scope). Raw provider/moderation detail is logged server-side and never returned to the child. **Scope note:** V1 (mock + initial real-key) moderates **text prompts only**. **Uploaded-image and generated-output-image moderation are not in V1**; reviewing uploads/outputs for safety (provider image-moderation and/or human review) is a pre-pilot/App-Store/kids-release task (see `10-handoff.md` checklist), documented as a known limitation rather than a silent gap.
- **Private media** (`user-uploads`, `ai-generations`) via signed URLs with short TTLs.
- **Input validation** on both client and Edge Function (length, type, allowed styles, allowed age ranges) — this is a **primary** server-side control.
- **Rate limiting & spend caps (V1):** real AI mode enforces a **configurable per-device/session limit** plus a **configurable global daily cap** (request count, with an optional provider-budget spend cap) server-side (see §11); mock mode is unlimited. Over-limit returns `rate_limited`; global cap reached returns `global_limit_reached` — both map to calm, child/parent-safe messages with no cost detail.
- **Session/device checks:** Edge Functions read `x-device-id`, validate it, and tie activity (and rate-limit counters) to the caller's `anonymous_sessions` row.
- **Safe error handling:** provider/moderation diagnostics are logged server-side only; the app only ever receives child-safe `userMessage`s.
- **CORS is a hygiene control, not the primary security boundary.** Native mobile clients do not enforce browser CORS, so it must **not** be relied on to protect Edge Functions. Real protection comes from input validation, server-side secrets, session/device checks, rate limiting, and safe error handling (above). CORS is still configured sanely (handle `OPTIONS`, restrict for any web/preview surfaces).
- **PII:** none collected by design (no name/email/login). Device id is a random UUID, not a hardware identifier.

## 11. AI rate limiting & spend caps (V1)

Lightweight abuse/cost guardrail; not full quota management. Two layers, both **real-mode only — mock mode is always unlimited** (no external calls, no cost):

**(a) Per-device/session limit** (anti-abuse, per user)
- A **configurable per-device/session limit** on generations/transformations over a rolling window. Defaults (tunable via env): `AI_RATE_LIMIT_PER_DAY=50` per device, window `AI_LIMIT_WINDOW_HOURS=24`, optional shorter burst window. `AI_RATE_LIMIT_ENABLED` toggles it.
- Counted server-side against the caller's `anonymous_sessions`/`device_id` (count of `ai_generations` + `uploaded_images` rows in the window, or a small counter table).
- Over-limit → `{ code:'rate_limited', userMessage:"Let's take a tiny break and try again in a moment.", retryable:true }`.

**(b) Global daily cap** (cost protection, across all devices)
- A **configurable global cap** so total real-AI usage can't run away. Two knobs:
  - `AI_GLOBAL_DAILY_LIMIT=500` — total successful real generations/transformations per `AI_LIMIT_WINDOW_HOURS` across all devices (always enforceable; provider-independent).
  - `AI_GLOBAL_DAILY_SPEND_CAP_USD` (optional) — a dollar ceiling. **Exact spend tracking is provider-dependent**, so V1 enforces the **request-count cap first**; the spend cap is documented as a **provider-budget integration to wire up before the real-key pilot** (e.g., provider usage API / billing alerts). If unset, only the count cap applies.
- Counted server-side via a tiny global counter (a `daily_usage` row/table keyed by date, incremented on each successful real call).
- Cap reached → `{ code:'global_limit_reached', userMessage:"Our art helper is resting for now. Please try again later.", retryable:true }`. This message is intentionally calm and parent-safe as well as child-safe; **no cost/spend/limit detail is exposed to the child.**

**Both layers:** mock requests are never counted; check order is per-device first, then global; diagnostics (counts, spend, windows) are logged server-side only.
- **Future:** per-account quotas, plan tiers, and prompt/transform result caching (out of V1 scope).

## 12. AI latency & timeouts (V1)

AI generation/transformation is slow (seconds to tens of seconds) and can fail. The app must feel calm and never hang.

- **Client UX:** generation and upload-transform show a **friendly long-running loading state** (branded "making your art…" animation), not a bare spinner. Copy scales by age band — simpler/encouraging for younger users ("Drawing your idea… 🎨"), slightly more informative for older ("Creating your picture — this can take a few seconds"). See `02-user-flows.md` and `06-design-system.md`.
- **Client timeout:** the client aborts a request after a configurable ceiling (≈30–45s) and shows the child-safe retry copy "Our art helper is taking a quick nap. Let's try again." (maps to the existing `provider_unavailable` error/state) with a Retry. No infinite spinners.
- **Edge Function timeout:** functions enforce their own upstream provider timeout (below the platform/Edge wall-clock limit) and return a child-safe error rather than letting the request die opaquely.
- **Preferred real-key path = async/polling:** if the provider supports async jobs, the real implementation should **submit → return a job/generation id → poll status** (or webhook), so neither client nor Edge Function blocks for the full duration. Documented as the recommended path for the real-key pilot.
- **V1 default = synchronous (with documented risk):** for the mock build and an initial real-key smoke, a simple synchronous call is acceptable. Risk: a slow provider can hit the timeout → we surface the retry state and (when configured) mark the row `failed`. The async/polling upgrade is the mitigation, not a job-queue.
- **Mock mode stays simple:** mock returns immediately (optionally a tiny artificial delay to exercise the loading state). **Do not build a full job queue in V1.**

## 13. Future scalability

- **Auth & sync:** anonymous session → real account is additive (link device_id to user_id); favorites/recents migrate from local to cloud.
- **Provider swap:** add a new `AIProvider` impl; no app changes.
- **Content scale:** items already in Postgres; can move from bundled seed to remote-first with caching; CDN on `drawing-assets`.
- **Hardware:** Projector Preview already models the output; a future `projector` service/module connects over BLE/Wi-Fi without UI rework.
- **Performance:** lists virtualized; images via `expo-image` cache; Reanimated runs on UI thread.
- **Cost controls:** per-device rate limiting ships in V1 (§11); caching of identical prompts/transforms and per-account quotas are follow-ups.

### Alternatives considered
- **NativeWind vs token theme:** chose token theme for control + minimal config; NativeWind acceptable later.
- **Redux/Jotai vs Zustand:** Zustand for minimal boilerplate + simple persistence.
- **Direct provider calls from client:** rejected — would leak secrets; all AI goes through Edge Functions.
- **Local-only content vs Postgres-only:** chose hybrid (bundled seed + Postgres mirror) for offline demo reliability.
