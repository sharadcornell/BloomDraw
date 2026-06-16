# 10 — Handoff

> Status: **Milestones 1–8 complete — Milestones 9–12 not started (awaiting approval).** · Owner: Delivery · Last updated: 2026-06-15
> Living document, updated as milestones complete. Records docs + M1 setup + M2 app shell + M3 content library + M4 local state + M5 Supabase foundation + M6 AI Edge Functions + M7 AI prompt flow + M8 upload/camera flow.

## Current state (2026-06-15)
- **Phase:** Documentation + **M1–M7** + **M8 (Upload / Camera Flow)** complete. The app boots → splash → onboarding → tabs, browses content, persists local state, runs the **AI creation flow** (M7), and now the **photo creation flow**: Create → Add a photo (gallery or camera) → preview → process → **Variant Selection** (Original / Line art / Pencil sketch / Coloring page / Cartoon) → save the chosen style to recents (reopenable). Friendly processing/long-running/error copy; permission-denied + no-camera fall back to gallery; **demo/mock works with zero keys** (the real photo as Original + deterministic style placeholders + Demo badge). **The app still runs fully in local/mock mode with no Supabase/AI env** (no crash). No projector controls yet (M9).
- **Awaiting:** explicit approval to proceed to **Milestone 9 (Projector Preview)**.
- **Repo:** git initialized at M1; local commits only, no remote configured, nothing pushed.

## Milestone 1 — Project Setup (✅ complete, 2026-06-15)

**What was created**
- Expo **SDK 56** managed app (React 19.2.3, React Native 0.85.3), scaffolded from `create-expo-app` (latest stable template) and merged into this repo without disturbing `/docs`.
- **Expo Router** configured (routes at repo-root `app/`; `@/*` → `src/*` path alias). **TypeScript strict** on (`tsconfig` extends `expo/tsconfig.base`, `strict: true`).
- **Minimal bootable app:** `app/_layout.tsx` (provider shell: GestureHandlerRootView + SafeAreaProvider + StatusBar + headerless Stack) and `app/index.tsx` (placeholder Home). No features.
- **Planned folder structure** created per `03` §3: `src/{components,theme,state,services,content,lib,types}` and `supabase/{migrations,functions/_shared,functions/<4 functions>}` (empty `.gitkeep` placeholders).
- **App config** (`app.json`): name `BloomDraw`, slug `bloomdraw`, scheme `bloomdraw`, iOS `bundleIdentifier` + Android `package` = `com.bloomdraw.app` (placeholders), `supportsTablet`, splash bg → brand violet `#7C5CFC`, `userInterfaceStyle: light`. Icon/splash use Expo placeholder assets (to be replaced in the brand pass).
- **ESLint** (flat config, `eslint-config-expo`) + scripts: `start`/`ios`/`android`/`web`/`lint` (`eslint .`)/`typecheck` (`tsc --noEmit`).
- **`.gitignore`** hardened to ignore real `.env`/`.env.*` while keeping `.env.example` tracked. `.env.example` unchanged; **no secrets created or committed.**

**Installed dependency versions** (exact set pinned in `README.md` → "Pinned versions"; lockfile = `package-lock.json`):
`expo ~56.0.12`, `react 19.2.3`, `react-native 0.85.3`, `expo-router ~56.2.11`, `react-native-reanimated 4.3.1`, `react-native-worklets 0.8.3`, `react-native-gesture-handler ~2.31.1`, `react-native-safe-area-context ~5.7.0`, `react-native-screens 4.25.2`, `zustand ^5.0.14`, `@react-native-async-storage/async-storage 2.2.0`, `@supabase/supabase-js ^2.108.2`, `moti ^0.30.0`, `expo-image-picker ~56.0.18`, `expo-camera ~56.0.8`, `expo-image-manipulator ~56.0.19`, `expo-image ~56.0.11`, `expo-file-system ~56.0.8`, `expo-font ~56.0.7`, `expo-haptics ~56.0.3`, `expo-crypto ~56.0.4`, `expo-linear-gradient ~56.0.4`, `expo-status-bar ~56.0.4`, `typescript ~6.0.3`, `eslint ^9.0.0`, `eslint-config-expo ~56.0.4`.

**Commands run & results**
| Command | Result |
| --- | --- |
| `npm install` | ✅ 593 pkgs (EBADENGINE warning: RN 0.85 prefers Node ≥22.13; on 22.12) |
| `npx expo install <12 extras>` | ✅ added image-picker, camera, image-manipulator, file-system, haptics, crypto, linear-gradient, async-storage, zustand, supabase-js (+ moti separately) |
| `npm run lint` | ✅ exit 0, no findings |
| `npm run typecheck` | ✅ exit 0 (strict) |
| `npx expo-doctor` | ✅ 18/18 checks passed |
| `npm run start` (Metro) | ✅ boots — "Waiting on http://localhost:8086", React Compiler enabled |
| `npx expo export -p ios` | ✅ bundled 1,517 modules → Hermes bundle (proves app compiles/starts) |

**Warnings / unresolved (non-blocking)**
- **Node engine:** Node v22.12.0 is just below RN 0.85's preferred `≥22.13`; everything works, but recommend Node ≥22.13 / 24.x to clear `EBADENGINE`.
- **Moti vs Reanimated 4:** `moti@0.30.0` installed cleanly (peer `reanimated: "*"`); runtime compatibility with Reanimated 4 is **to be validated when first used** (M2/M10). Fallback = use Reanimated directly (docs allow "Moti or similar").
- **npm audit:** 11 moderate advisories, all transitive in the Expo/Metro toolchain; not fixed (a forced fix risks breaking the SDK 56 dep set). Revisit during M11.
- **React Compiler** experiment is enabled (template default) and the iOS bundle compiled fine with it on.

## Milestone 2 — App Shell (✅ complete, 2026-06-15)

**What was built**
- **Provider shell** (`app/_layout.tsx`): GestureHandlerRootView + SafeAreaProvider + StatusBar; loads Baloo 2 + Nunito via `useFonts`; **splash gate** holds the native splash until fonts load + the store hydrates, then plays an animated in-app splash. A 2s fallback prevents hangs on slow/corrupt storage.
- **Animated splash** (`BloomSplash`): gradient backdrop, "blooming" flower (scale + settle + pulse), wordmark fade-in, then fades out. **Reanimated used directly** (not Moti) — see decision below.
- **Bottom tabs** (`app/(tabs)/_layout.tsx`): Home · Explore · Create · Recents · Settings (Ionicons), themed; gated on onboarding via `<Redirect>`.
- **First-run onboarding** (`app/onboarding.tsx`): age picker (3–5 / 6–8 / 9–12) + "Skip for now" → defaults to 6–8. Persists locally (Zustand + AsyncStorage); no backend, no profiles.
- **Home scaffold**: header + Demo-mode badge, gradient hero + CTA, functional age-filter chips, and PLACEHOLDER sections (featured row, category grid, quick-create, recents/favorites empty states, projector "coming soon" card).
- **Explore / Create / Recents / Settings scaffolds**: placeholders (skeleton grid + "library coming soon"; create options as "coming soon" cards; recents empty state; Settings with **functional age band**, kid-safe AI note, version, and future Account/Privacy placeholders + a dev-only "Reset onboarding").
- **Theme** (`src/theme`): `tokens.ts` (color/gradient/space/radius/shadow/typography), `theme.ts` (+ category accents), `fonts.ts`, `useTheme.ts` (responsive `isTablet`). No ThemeProvider context — theme is static (no over-engineering).
- **State** (`src/state/useAppStore.ts`): age + onboarding, AsyncStorage-persisted, hydration-gated.
- **13 shared components** (`src/components`): AppText, Button, Card, Chip, AgeFilter, SectionHeader, EmptyState, ErrorState, Loader, SkeletonCard, DemoModeBadge, Screen, BloomSplash (+ `index.ts` barrel).
- **Copy** centralized in `src/lib/strings.ts`; shell placeholder data in `src/lib/placeholders.ts`.

**Dependencies added in M2**
`@expo-google-fonts/baloo-2`, `@expo-google-fonts/nunito`, `@expo/vector-icons ^15.1.1` (the SDK 56 template ships SF Symbols, not vector-icons — added for tab/UI icons).

**Animation decision (Moti vs Reanimated 4):** Moti (`0.30.0`, peer `reanimated: "*"`) installed cleanly, but its runtime compatibility with **Reanimated 4** can't be verified here without a device. To guarantee a stable splash/gate and shell, **M2 uses Reanimated 4 directly** (`useSharedValue`, `withTiming/Sequence/Repeat`, `FadeInDown` layout animations). Moti remains installed and can be adopted for declarative micro-animations once validated on a device (M10). This matches the milestone instruction ("if Moti causes risk, use Reanimated directly and document").

**Commands run & results (M2)**
| Command | Result |
| --- | --- |
| `npx expo install @expo-google-fonts/baloo-2 @expo-google-fonts/nunito` | ✅ |
| `npx expo install @expo/vector-icons` | ✅ `15.1.1` (fixed an export-time resolve error) |
| `npx expo export -p ios` | ✅ bundled (4.1MB Hermes bundle) — app compiles |
| `npm run lint` | ✅ exit 0, no findings |
| `npm run typecheck` | ✅ exit 0 (after typed-routes regen — see note) |
| `npx expo-doctor` | ✅ 18/18 |
| `npm run start` (Metro) | ✅ "Waiting on http://localhost:8087" |

**Issues hit & fixed during M2**
- **`@expo/vector-icons` missing** → iOS export failed resolving the import. Fixed by `expo install @expo/vector-icons`; re-export passed.
- **Typed-routes typecheck error** (`/create`, `/explore`, `/onboarding` not assignable): `.expo/types/router.d.ts` was stale from M1 (only knew `/`). `expo export` does not regenerate it; the **dev server does**. Booted Metro once to regenerate, then typecheck passed. Note: `.expo/types` is git-ignored and regenerated on `expo start`; on a fresh clone (no `.expo`) expo-router's `Href` is permissive so `tsc` still passes — run the app once for strict route typing.

**Warnings / unresolved (non-blocking)**
- Node engine `EBADENGINE` (RN 0.85 prefers Node ≥22.13; on 22.12) — carried over from M1.
- Moti-on-Reanimated-4 runtime compatibility unverified (deferred; Reanimated used directly) — see decision above.
- Visual polish (real animations beyond entrances, tablet fine-tuning, a11y audit) is intentionally deferred to **Milestone 10**.
- Not run on a physical device/simulator in this environment; validated via Metro boot + iOS bundle export. Recommend a quick simulator pass when available.

## Milestone 3 — Content Library (✅ complete, 2026-06-15)

**What was built**
- **Content data model** (`src/types`): `Category`, `DrawingItem`, `DrawingStep`, `CategorySlug`, `Difficulty`, `AgeRangeId` — camelCase + slug refs, aligned to the planned Postgres schema (docs/04). No Supabase yet.
- **8 categories** (`src/content/categories.ts`) with slug, name, description, emoji, accent key, sort order.
- **100 drawing items** across 8 per-category files (`src/content/items/*`), built via `_helpers.ts` (`buildItems` + `genericSteps`). **20 detailed hero items** with authored child-friendly steps; **80 structured placeholders** with generic-but-reasonable steps. Step counts enforced: easy 4 / medium 6 / hard 8. **"Cute robot" → Space** (documented). No copyrighted assets — visuals are emoji-on-accent branded placeholders.
- **Queries** (`src/content/index.ts`): `getItemBySlug`, `getItemsByCategory`, `getFeaturedItems`, `getRecommendedItems(age)`, `filterItems`, `itemMatchesAge` + `AGE_BAND_RANGE`.
- **Integrity validator** (`src/content/validate.ts`) + **Jest suite** (`content.test.ts`, jest-expo): 9 tests, all passing.
- **5 content components**: `DrawingThumbnail` (branded placeholder), `DrawingCard`, `DifficultyDots`, `StepProgress`, `BackHeader`.
- **Explore** rewritten: category/age/difficulty filters (toggle), responsive grid, result count, empty state + reset; reads `?category=` deep-link param.
- **Drawing Detail** (`app/drawing/[slug].tsx`): final + trace placeholders, meta (category/difficulty/age), description, Start-tutorial CTA, Projector "coming soon" card, placeholder favorite heart (ephemeral — M4).
- **Step-by-Step Tutorial** (`app/tutorial/[slug].tsx`): step placeholder, title + instruction, `StepProgress`, large Back/Next, finish action; works for 4/6/8 steps.
- **Home** now uses real content: featured row, age-based recommendations, real 8-category grid (deep-links into Explore).

**Content counts** — categories 8 · items **100** · heroes **20** · placeholders **80**. By category: Alphabets 26, Numbers 10, Animals 18, Vehicles 10, Space 8, Nature 12, School/Curriculum 8, Cards 8.

**Tooling added:** `jest-expo ~56.0.5`, `jest ~29.7.0`, `@types/jest` (devDeps) + `jest.config.js`, `babel.config.js` (explicit `babel-preset-expo` so Jest transforms like Metro — no app behavior change), `npm test` script.

**Commands run & results (M3)**
| Command | Result |
| --- | --- |
| `npm test` | ✅ 9/9 content integrity tests pass |
| `npm run typecheck` | ✅ exit 0 (after typed-routes regen + `@jest/globals` import) |
| `npm run lint` | ✅ exit 0 (added jest globals override) |
| `npx expo-doctor` | ✅ 18/18 |
| `npm run start` (Metro) | ✅ "Waiting on http://localhost:8088" |
| `npx expo export -p ios` | ✅ bundled (1,680 modules) |

**Issues hit & fixed during M3**
- **Typed-routes typecheck** failed for new `/drawing/[slug]` + `/tutorial/[slug]` (stale `.expo/types`); regenerated by booting Metro once (as in M2).
- **Jest globals** (`describe/it/expect`) unresolved by `tsc` (expo base tsconfig scopes `types`); fixed by importing from `@jest/globals` in the test (+ ESLint jest-globals override for the test files).

**Warnings / unresolved (non-blocking)**
- `EBADENGINE` (Node 22.12 vs RN's ≥22.13) — carried from M1.
- Explore grid renders results in a plain wrapping view (not virtualized). Fine at 100 items; **FlatList/virtualization deferred to Milestone 10** (perf pass).
- Favorite heart on cards/detail is a visual placeholder (ephemeral state); real persistence is **Milestone 4**.
- Not run on a device/simulator here; validated via Metro boot + iOS export.

## Milestone 4 — Local State (✅ complete, 2026-06-15)

**What was built**
- **Pure state reducers** (`src/state/_helpers.ts`): age (`isValidAgeRange`, `sanitizeAgeRange`, `coerceAgeRange`→6-8 default), favorites (`add/remove/toggle`, `sanitizeFavorites` dedupe), recents (`addRecent` newest-first + de-dupe by id + cap 50, `removeRecent`, `sanitizeRecents`). All immutable + unit-tested without AsyncStorage.
- **Favorites store** (`useFavoritesStore`): persisted slug array; `toggleFavorite/add/remove/isFavorite/clearFavorites`; `useIsFavorite(slug)` selector hook. Versioned (v1), sanitized on rehydrate.
- **Recents store** (`useRecentsStore`): persisted `RecentCreation[]` supporting `ai_generation | uploaded_image | preloaded_drawing`; actions `addRecentCreation / removeRecentCreation / clearRecents / getRecentCreations` + a non-React `recents` API for future flows; auto id/createdAt; cap 50; versioned + sanitized.
- **App store** age safety: `_sanitize` on every rehydrate — invalid age → 6-8 (if onboarded) else null; non-boolean onboarded → false. Corrupt payload can never crash or hang (2s splash fallback retained).
- **Hydration gate**: splash now waits for all three stores to hydrate (no favorites/recents flash).
- **UI wired**: DrawingCard + Drawing Detail hearts persist favorites; **Favorites route** (`app/favorites.tsx`) reachable from Home; Home shows **real** favorites + recents previews (with empty states + "See all"); **Recents screen** lists creations with remove + Clear; **Settings → Manage** clears favorites/recents (confirm dialogs) + dev "Add demo recent" / "Reset onboarding".
- **Recents type model** (`RecentCreation` in `src/types`) ready for M7–M8 to populate.

**Tests (`src/state/__tests__/state.test.ts`)** — 13 tests: age validate/sanitize/coerce-default; favorites add/remove/toggle/idempotency/no-dupes/sanitize; recents newest-first/de-dupe/cap/remove/sanitize; favorites & recents **store** actions (toggle/clear, add/remove/clear) via the official AsyncStorage Jest mock. Total suite now **22/22**.

**Commands run & results (M4)**
| Command | Result |
| --- | --- |
| `npm test` | ✅ **22/22** (9 content + 13 state) |
| `npm run typecheck` | ✅ exit 0 (after typed-routes regen for `/favorites`) |
| `npm run lint` | ✅ exit 0, no warnings |
| `npx expo-doctor` | ✅ 18/18 |
| `npm run start` (Metro) | ✅ "Waiting on http://localhost:8089" |
| `npx expo export -p ios` | ✅ bundled (1,686 modules) |

**Issues hit & fixed during M4**
- **State tests failed** importing stores: AsyncStorage's native module is null under Jest. Fixed with the package's official Jest mock (`@react-native-async-storage/async-storage/jest/async-storage-mock`) via a hoisted `jest.mock`.
- **Typecheck/lint on the hoisted mock**: global `jest` untyped under expo's scoped tsconfig, plus `import/first` + `no-require-imports` warnings. Fixed via a `/// <reference types="jest" />` in the state test and an ESLint test-files rule override.
- **Typed routes**: regenerated for the new `/favorites` route (Metro boot), as in M2/M3.

**Warnings / unresolved (non-blocking)**
- `EBADENGINE` (Node 22.12 vs RN ≥22.13) — carried from M1.
- Full AsyncStorage persistence **round-trip across app restarts** is verified manually (unit tests use the in-memory mock); store logic itself is unit-tested.
- Recents stays empty in normal use until M7–M8 (a dev-only "Add demo recent" button exercises the UI).
- Favorites/recents are **device-local only** (no cloud sync/login) by V1 design.
- Not run on a device/simulator here; validated via Metro boot + iOS export.

## Milestone 5 — Supabase Foundation (✅ complete, 2026-06-15)

**What was built**
- **Guarded client** (`src/services/supabase.ts`): initializes `@supabase/supabase-js` **only** when `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` are present and `EXPO_PUBLIC_FORCE_MOCK !== 'true'`; otherwise exports `null` + `isSupabaseConfigured=false`. Anon key only; service-role key never read. Imports `react-native-url-polyfill/auto` for RN.
- **Anonymous session** (`src/services/session.ts`): stable device id (expo-crypto `randomUUID` + JS fallback, persisted in AsyncStorage); `ensureSession(age)` upserts `anonymous_sessions` when configured, else returns a local session — never throws, never blocks startup (fire-and-forget call added in `app/_layout.tsx`). `updateSessionAge` best-effort.
- **Storage foundation** (`src/services/storage.ts`): typed, guarded `getPublicUrl` / `getSignedUrl` / `uploadToBucket` + `BUCKETS` constants. No upload/camera UI, no AI; returns `unconfigured` when offline.
- **DB types** (`src/types/db.ts`): snake_case row types + full enums (incl. `pending`/`processing`) + a `Database` generic typing the client — kept separate from the camelCase app/API types.
- **Migrations** (`supabase/migrations/`): `0001_init` (extensions, 6 enums, 6 tables, checks, indexes), `0002_rls` (RLS on all; content read-only to anon; sessions anon best-effort; ai/upload tables service-role-only), `0003_storage` (3 buckets + public-read policy), `0004_retention` (purge function + commented pg_cron).
- **Seed generation** (preferred path): `src/content/seed.ts` `buildSeedSql()` + `scripts/generate-seed.ts` (`npm run seed:gen`) generate `supabase/seed.sql` from `src/content` (source of truth) using slug-keyed subselects (deterministic, no hard-coded UUIDs). Generated **8 categories, 100 items, 486 steps**. A test guards against drift (committed file must equal generator output).

**Migration files:** `0001_init.sql`, `0002_rls.sql`, `0003_storage.sql`, `0004_retention.sql`.
**Tables/enums/policies:** 6 tables + 6 enums (`difficulty_level`, `age_range`, `ai_input_type`, `moderation_status`, `generation_status`, `processed_status`); RLS policies — content readable, sessions anon insert/select/update (best-effort), ai/upload tables no anon access (service-role only).
**Buckets:** `drawing-assets` (public-read), `user-uploads` (private), `ai-generations` (private; signed-URL pattern).

**Security posture (honest):** documented in `0002_rls.sql` — without auth, `device_id` is **not** a secure identity (spoofable); policies are a pragmatic best-effort for anonymous non-PII metadata; activity tables are service-role-only; no service-role operations in the app. A test asserts no `SUPABASE_SERVICE_ROLE_KEY` / `OPENAI_API_KEY` / `REPLICATE_API_TOKEN` appears in `src/` or `app/`.

**Tests (`__tests__`)** — +10: services (Supabase null/unconfigured offline; local session stable + non-throwing; no-secret-env scan) and seed (header/transaction, 8 categories, 100 item subselects, step-row count, apostrophe escaping, **committed seed.sql matches generator**). Total suite **32/32**.

**Commands run & results (M5)**
| Command | Result |
| --- | --- |
| `npm run seed:gen` | ✅ wrote `supabase/seed.sql` (8 cats / 100 items / 486 steps) |
| `npm test` | ✅ **32/32** (content, seed, state, services) |
| `npm run typecheck` | ✅ exit 0 |
| `npm run lint` | ✅ exit 0, no warnings |
| `npx expo-doctor` | ✅ 18/18 |
| `npm run start` (Metro) | ✅ "Waiting on http://localhost:8090" |
| `npx expo export -p ios` | ✅ bundled 1,756 modules (supabase-js + url-polyfill OK) |

**Supabase CLI:** not installed in this environment. Run these later against a project (docs/09 §3–§4): `supabase login` → `supabase link --project-ref <ref>` → `supabase db push` (or `supabase db reset` for a local stack via `supabase start`) → apply `seed.sql` → `supabase migration list` to verify.

**Issues hit & fixed during M5**
- **Services test transform error**: a `declare const require` shim clashed with the hoisted `jest.mock` (jest-hoist saw a local `require`). Fixed by reading `fs` via `jest.requireActual('fs')` (typed by jest, no node-types pollution).
- **Session test**: `expo-crypto.randomUUID()` returns `undefined` under the Expo Jest mock (doesn't throw) → `getDeviceId` now falls back on any falsy result (robust in app + tests).
- **Lint**: removed an unused `eslint-disable no-console` in the seed script (expo config doesn't enable no-console).

**Warnings / unresolved (non-blocking)**
- `EBADENGINE` (Node 22.12 vs RN ≥22.13) — carried from M1.
- Migrations/seed are **not applied to a live project here** (no Supabase CLI/Docker/cloud); validated by SQL review + the deterministic seed + drift test. Apply against a real project before the pilot.
- `device_id` RLS is best-effort (no auth) — documented in the migration + `04`/`08`.
- Storage upload/signed-URL helpers are foundations; the upload flow (M8) and AI writes (M6) are not implemented.
- Not run on a device/simulator here; validated via Metro boot + iOS export.

## Milestone 6 — AI Edge Functions (✅ complete, 2026-06-15)

**What was built** — the server-side AI foundation (Deno Edge Functions). The mobile AI/upload/projector UI is intentionally **not** built here (M7–M9).

- **Four Edge Functions** (`supabase/functions/*/index.ts`), each per `05-api-contract.md`:
  - **`moderate-prompt`** — classify → `safe` / `rewritten` / `blocked` (+ `safePrompt`, `userMessage`, server-only `reasonCode`). Always called before generation; not separately rate-limited (cheap).
  - **`generate-image`** — defensively **re-moderates** the `safePrompt`, writes/updates an `ai_generations` row (when configured), returns `imageUrl` (+ `lineArtUrl` when requested), `provider`, `status`, `demo`.
  - **`transform-image`** — `imageUrl`|`uploadRef` + one `style` → `outputImageUrl`.
  - **`process-uploaded-image`** — `imageUrl`|`uploadRef` + `styles[]` (default all four) → `line_art`/`sketch`/`cartoon`/`coloring_page` URLs; `complete`/`partial`/`failed`; writes an `uploaded_images` row.
- **Shared modules** (`supabase/functions/_shared/`): `types.ts`, `env.ts`, `strings.ts` (re-exports the app's single source of child copy), `util.ts`, `errors.ts`, `response.ts`, `cors.ts`, `validation.ts`, `moderation.ts`, `timeout.ts`, `rate-limit.ts`, `handler.ts`, `db.ts` (Deno-only service-role), `enforce.ts` (Deno-only), and `ai-provider/{config,mock,openai,replicate,index}.ts`.
- **Provider abstraction** (`AIProvider`): `moderatePrompt`, `rewritePromptForKidSafety`, `generateImage`, `transformImage`, `generateLineArt/Sketch/Cartoon/ColoringPage`, plus `name` + `isMock`. `getProvider()` returns **Mock** when `AI_MOCK_MODE=true` (default), `AI_PROVIDER=mock`, **or the selected provider's key is missing** (fail-safe + server warning); else OpenAI (default) / Replicate. **Model IDs come from env/config** (`_shared/ai-provider/config.ts`), never hardcoded literals.
- **Mock fallback** (default): deterministic, offline, no keys. Moderation uses the local keyword/category ladder; images are self-contained **SVG data URLs** keyed off a prompt/source hash (stable across calls); every mock response sets `demo:true`. **Mock is never rate-limited.**
- **Moderation:** blocks violence (graphic/targeted), sexual/adult, hate, self-harm, dangerous content, and disturbing/scary content; **softens** borderline fantasy aggression to a gentle prompt (e.g. "dragon fighting monster with blood" → rewritten). Re-checks a rewrite **once** (never loops). Raw categories are server-side `reasonCode` only; the child sees the fixed block/rewrite copy from `src/lib/strings.ts`.
- **Rate limiting & global cap** (real mode only, per `AI_RATE_LIMIT_*` / `AI_GLOBAL_DAILY_*` env): per-device checked **first**, then global; over-device → `rate_limited` ("Let's take a tiny break…"), global → `global_limit_reached` ("Our art helper is resting for now…"). Counts derive from `ai_generations` + `uploaded_images` rows in the window (no extra table). Spend cap (`AI_GLOBAL_DAILY_SPEND_CAP_USD`) is carried + documented as a **provider-budget integration before the pilot**; count cap enforced first.
- **Timeouts:** each provider call is wrapped with `withTimeout` (`AI_PROVIDER_TIMEOUT_MS`, default 25s) → child-safe "nap" retry on timeout; rows marked `failed` when configured. No job queue (async/polling documented as the real-key upgrade — `05` §12).
- **Security:** secrets read server-side only (`env.ts`); service-role used only in `db.ts`; CORS is hygiene-only; primary controls = validation + server-side secrets + device/session checks + rate limiting + safe errors. Child prompt text is **not** logged (only status/reasonCode/length).
- **Supabase writes:** service-role client writes/updates `ai_generations`, `uploaded_images`, and upserts `anonymous_sessions` — all **best-effort**; when service role is absent the functions still return valid mock responses and never crash.

**Engineering note (Deno × Node):** Edge Functions run on Deno (`Deno.serve` + `npm:@supabase/supabase-js@2`, the latter isolated in `db.ts`). The pure safety/validation/provider logic is dependency-free and **unit-tested under Node/Jest** using explicit `.ts` import extensions (Deno-required) resolved via a jest `moduleNameMapper`. The app's `tsc` and ESLint **exclude** `supabase/functions` (Deno-typed, not part of the RN bundle).

**Deviations from the contract (documented in `05` §13):** `generate-image` stores `original_prompt = safePrompt` (it only receives the safe prompt); `transform-image` writes no row (no `uploadedImageId` in its contract); real provider image URLs are returned directly in V1 (persisting to the `ai-generations` bucket + signed URL is a pre-pilot task); `process-uploaded-image` partial → row `processed_status='complete'` while the API returns `partial`.

**Tests (`supabase/functions/_shared/__tests__/`)** — +54 (7 suites): moderation (safe/rewrite/block per category, no-loop, block-over-soften priority), provider (mock determinism, demo flag, missing-key → mock fallback, provider selection), config/env (defaults, model-ID overrides, limit knobs, useMock logic), validation (prompt/age/style/styles/source/device-id/JSON), errors (code → child-safe message + retryable + status, envelope shapes, no-leak), rate-limit (pure evaluator ordering + wired counters), timeout (fast/slow/propagate). **Total suite 86/86.**

**Commands run & results (M6)**
| Command | Result |
| --- | --- |
| `npm test` | ✅ **86/86** (11 suites; +54 Edge-Function tests) |
| `npm run lint` | ✅ exit 0, no findings |
| `npm run typecheck` | ✅ exit 0 (strict; `supabase/functions` excluded — Deno-typed) |
| `npx expo-doctor` | ✅ 18/18 |
| `npx expo export -p ios` | ✅ bundled (4.9MB Hermes bundle; server code correctly excluded) |

**Local function smoke (Deno/Supabase CLI):** **not run here** — Deno and the Supabase CLI are not installed in this environment. Exact commands to run later are in `09-deployment-runbook.md` §4 ("Edge Function runtime notes"): `deno check supabase/functions/**/*.ts`, then `supabase functions serve` + curl each function in mock mode.

**Warnings / unresolved (non-blocking, M6)**
- `EBADENGINE` (Node 22.12 vs RN ≥22.13) — carried from M1.
- Edge Functions not served/deployed here (no Deno/Supabase CLI/Docker); validated by 54 Node unit tests + review. Run `supabase functions serve` + a real-key smoke before the pilot.
- OpenAI/Replicate real paths (image generation/edits, prediction polling) are **API-ready but unverified without keys**; the exact request shapes + **model IDs** must be confirmed at the real-key pilot.
- Real generated/transformed outputs are returned as the provider URL/`b64` in V1; persisting them to the private `ai-generations` bucket + short-TTL signed URLs is a pre-pilot task.

## Milestone 7 — AI Prompt Flow (✅ complete, 2026-06-15)

**What was built** — the mobile AI creation flow (prompt → safety → image), wired to the M6 Edge Functions. Upload/camera (M8) and projector controls (M9) are intentionally NOT built here.

- **Client Edge service** (`src/services/edge.ts`): typed callers `moderatePrompt` + `generateImage` returning the `docs/05` envelopes. Configured → invokes the real Edge Functions via the **anon** Supabase client, sending `x-device-id` for rate-limit accounting; unconfigured / `FORCE_MOCK` (`supabase===null`) → local demo equivalent. Failures normalize to a typed **`EdgeError { code, userMessage, retryable }`** carrying ONLY the child-safe message (no provider/stack/moderation detail). **No Deno/server code imported; no secrets in the app.** (transform/process callers land in M8.)
- **Demo fallback** (`src/services/aiMock.ts`): client mirror of the server mock — a lightweight `mockModerate` (safe/rewritten/blocked) + deterministic `mockGenerate` (SVG-data-URL image + line art, `demo:true`). The authoritative classifier is the Edge Function; this is the offline/demo mirror. Child copy stays single-source in `src/lib/strings.ts`.
- **Orchestration** (`src/services/ai.ts`): `createAiArt()` = validate → moderate → (**blocked** → stop, no generate | **rewritten** → banner + use safePrompt | **safe** → use prompt) → generate (image + line art) → save a `RecentCreation`. Fully **dependency-injected → unit-tested** without Supabase/network. Plus `isValidPrompt` (1–300) and `titleFromPrompt`.
- **Hook** (`src/hooks/useAiGeneration.ts`): UI state machine (`idle`/`moderating`/`generating`/`blocked`/`error`), the rewrite flag, and a long-running timer (6s → "Still adding a little magic…").
- **Screens:**
  - **`app/create/ai.tsx`** — title + explanation, prompt input (300-char cap + counter), **5 kid-safe example chips**, age passed to moderation/generation, Generate (disabled when empty/loading), and inline **loading / safety-check / long-running / blocked / error** states with child-safe copy.
  - **`app/create/ai-result.tsx`** — generated image + simplified line art (via `AiArtView`), Demo badge when `demo:true`, original idea + kid-friendly idea (when rewritten) + rewrite banner, "saved to recents" indicator, **Try another idea**, Back to Create, and a Projector "coming soon" card (no real preview — that's M9). Reads the saved recent by `id` (also how Recents/Home reopen it).
- **Components:** `AiArtView` (renders real http images via `expo-image`; renders a branded deterministic placeholder for demo/data-URL results — native loaders don't reliably render SVG data URLs), `Banner` (gentle info/success notice), and `RecentCard` updated to show a real http thumbnail when present (else the emoji placeholder).
- **Recents integration:** a successful generation saves an `ai_generation` `RecentCreation` (id, createdAt, title, prompt, safePrompt, rewritten, imageUrl, lineArtUrl, provider, demo, + http thumbnail). Recents + Home now **reopen the AI Result** for `ai_generation` items. `RecentCreation` gained optional AI fields (all optional → backwards-safe; `sanitizeRecents` unchanged).
- **Loading / timeout / error UX:** moderation → "Checking that your idea is safe and fun…"; generation → "Making your drawing…"; long-running → "Still adding a little magic…"; provider timeout/failure → "Our art helper is taking a quick nap…"; global cap → "Our art helper is resting for now…"; per-device limit → the Edge `rate_limited` message. **No raw provider/stack/moderation/cost detail ever shown to the child.**
- **Demo/mock mode:** with no Supabase env / no keys / `FORCE_MOCK`, the full flow completes — deterministic placeholder image + line art render, Demo badge shows, result saves to recents. Verified by unit tests.
- **Narration (§8):** **deferred to Milestone 10.** `expo-speech` is not installed; adding+wiring it now would add dependency/scope risk against the milestone's "not a blocker / defer if risky" guidance. Documented as deferred (docs/02 §11, docs/06 §12).

**Engineering notes:** the client↔server boundary is clean — moderation logic is intentionally NOT shared across the Deno/RN boundary (a file in `src/` is app-`tsc`-checked and can't use the `.ts` import extensions Deno requires; the M6 `_shared` modules are excluded from app tsc). The client demo classifier is a small, documented mirror; the real safety bar is the Edge Function. Route types (`.expo/types`) were regenerated by booting Metro once (typed-routes pattern from M2/M3).

**Tests (`src/services/__tests__/`)** — +17 (3 suites): `ai.test.ts` (validation, safe/rewritten/blocked orchestration, blocked does NOT call generate or save, recents entry added, EdgeError + unknown-error normalization, no detail leak, phase sequence), `aiMock.test.ts` (mock moderation safe/rewrite/block + generation determinism/`demo:true`), `edge.test.ts` (Supabase-unconfigured fallback → local mock; EdgeError normalization). **Total suite 103/103.**

**Commands run & results (M7)**
| Command | Result |
| --- | --- |
| `npm test` | ✅ **103/103** (14 suites; +17 AI-flow tests) |
| `npm run lint` | ✅ exit 0, no findings |
| `npm run typecheck` | ✅ exit 0 (after typed-routes regen via Metro) |
| `npx expo-doctor` | ✅ 18/18 |
| `npm run start` (Metro) | ✅ "Waiting on http://localhost:8081" (regenerated route types) |
| `npx expo export -p ios` | ✅ bundled (5.0MB Hermes bundle) |

**Warnings / unresolved (non-blocking, M7)**
- `EBADENGINE` (Node 22.12 vs RN ≥22.13) — carried from M1.
- **Offline detection is pragmatic** (no `@react-native-community/netinfo` dependency): when configured-but-offline, the real invoke is attempted and its transport failure is caught → mapped to the child-safe "nap" retry. Precise "don't even attempt while offline" + the distinct "You're offline right now…" copy (T19) is a small follow-up (add netinfo) — documented, not blocking the mock build.
- Real provider image URLs are shown directly (M6 note); persisting to the private `ai-generations` bucket + signed URLs remains a pre-pilot task.
- Not run on a device/simulator here; validated via Metro boot + iOS export + unit tests. Recommend a quick simulator pass of the safe/rewrite/block prompts when available.

## Milestone 8 — Upload / Camera Flow (✅ complete, 2026-06-15)

**What was built** — the mobile photo creation flow (pick/capture → variants → select → recents), wired to the M6 `process-uploaded-image` / `transform-image` Edge Functions. Projector controls (M9) are intentionally NOT built here.

- **Client Edge service** (`src/services/edge.ts`): added typed `processUploadedImage` + `transformImage` callers (+ `ProcessData`/`TransformData`/`TransformStyle`/`TRANSFORM_STYLES`/`isTransformStyle`), same real-vs-mock transport + `EdgeError` normalization as M7. Configured → invokes the real functions with `x-device-id`; unconfigured/`FORCE_MOCK` → local demo variants. No Deno/secret exposure.
- **Demo fallback** (`src/services/aiMock.ts`): added `mockProcessUpload` (all four style variants, deterministic SVG-data-URL placeholders, `demo:true`) + `mockTransform` (one styled variant).
- **Orchestration** (`src/services/upload.ts`): `processUpload()` = call process → map to `UploadResultData` (keeps the **local uri as Original**, four style urls) with child-safe errors; `buildUploadRecentInput()` builds the `uploaded_image` recent for the selected variant (with a renderable-thumbnail fallback to the original photo); `variantUrl()`, `VARIANT_KEYS`, `UPLOAD_STYLES`. Fully **dependency-injected → unit-tested** (no Supabase/camera/network).
- **Ephemeral draft store** (`src/state/useUploadStore.ts`, not persisted): hands the processed variant set from Upload → Variant Selection. Re-opening a saved result reads from the recents store instead.
- **Screens:**
  - **`app/create/upload.tsx`** — gallery pick + camera capture via `expo-image-picker` (own permission requests); **permission-denied / no-camera (simulator) → friendly Banner + gallery fallback, never crashes**; image preview + retake; best-effort resize/compress via `expo-image-manipulator` (defensive — never blocks); when Supabase is configured, uploads the original to `user-uploads/{device}/{uuid}.jpg` (best-effort) and passes `uploadRef`; processing loader ("Turning your photo into drawing styles…" / long-running) → on success navigates to variants; child-safe storage/provider error states.
  - **`app/create/variants.tsx`** — polished grid of the five variants (`VariantCard`), clear selected state, Demo badge when `demo:true`, **Use this style** → saves an `uploaded_image` recent (re-savable), `partial` notice, Try-another-photo, and a Projector "coming soon" card (no real preview — M9). Re-opens a saved upload by `id` from Recents/Home.
- **Components:** `VariantCard` (square preview + style label + selected check; renders real images via `expo-image`, demo/SVG → style-specific placeholder). Refactored `AiArtView` + `RecentCard` to share a new `src/lib/image.ts#isRenderableImage` helper (renders http/file/content/raster; SVG-data → branded placeholder) — so the **real picked photo shows as the Original even in demo mode**, and upload recents show a real thumbnail.
- **Recents integration:** a selected variant saves an `uploaded_image` `RecentCreation` (original uri, selected variant url, the full variant set, style, provider, demo, thumbnail). Recents + Home **reopen the Variant Selection** for `uploaded_image` items. `RecentCreation` gained optional `originalUri` + `variants` (all optional → backwards-safe; `sanitizeRecents` unchanged).
- **Permissions:** added the `expo-image-picker` config plugin to `app.json` with kid-friendly `photosPermission` + `cameraPermission` usage strings (iOS Info.plist + Android permissions). Real store-compliance review remains a gated pre-release task.
- **Demo/mock mode:** with no Supabase env / no keys / `FORCE_MOCK` / offline, the flow completes — the real photo renders as Original, deterministic style placeholders render, Demo badge shows, the selection saves to recents. Verified by unit tests.

**Scope guardrails honored:** no real Projector controls, no upload/output image moderation (documented pre-pilot item), no login/payments/hardware/B2B/true-tutorials. Image moderation for uploads/outputs remains a pre-pilot/kids-release task (`08` §7, checklist below).

**Tests (`src/services/__tests__/upload.test.ts`)** — +15: transform style validation; mock variant determinism + subset + `demo:true`; edge unconfigured fallback (process + transform); `processUpload` (success mapping, `uploadRef` vs `imageUrl`, partial passthrough, `EdgeError` + unknown-error normalization with no leak); `variantUrl`; `buildUploadRecentInput` (entry shape + demo-thumbnail fallback) + adds to the recents store. **Total suite 118/118.**

**Commands run & results (M8)**
| Command | Result |
| --- | --- |
| `npm test` | ✅ **118/118** (15 suites; +15 upload tests) |
| `npm run lint` | ✅ exit 0, no findings/warnings |
| `npm run typecheck` | ✅ exit 0 (after typed-routes regen via Metro) |
| `npx expo-doctor` | ✅ 18/18 |
| `npm run start` (Metro) | ✅ boots, regenerated route types (`/create/upload`, `/create/variants`) |
| `npx expo export -p ios` | ✅ bundled (5.0MB Hermes bundle; image-picker/manipulator OK) |

**Warnings / unresolved (non-blocking, M8)**
- `EBADENGINE` (Node 22.12 vs RN ≥22.13) — carried from M1.
- **Camera + gallery picking + on-device upload are not exercised here** (no device/simulator/Supabase project): the native bits live in `upload.tsx` and are validated by review + the typed flow; the **orchestration + mock + recents are unit-tested**. Run a device pass (gallery + camera + permission-denied) and a configured-Supabase upload smoke before the pilot.
- `expo-image-manipulator` API differs across SDKs → preprocessing is best-effort (falls back to the original uri); confirm resize/compress on-device at the pilot.
- Configured-but-offline maps an upload failure to the child-safe storage/"nap" retry (pragmatic, no `netinfo` dep) — same documented follow-up as M7.
- Real provider transformed outputs are returned/displayed as their URLs; persisting to the private `ai-generations` bucket + signed URLs remains a pre-pilot task (carried from M6).

## What was built (so far)
Documentation set under `/docs` plus root config drafts:
- `docs/00-product-brief.md` … `docs/10-handoff.md` (this file)
- `CLAUDE.md` (repo operating rules)
- `README.md` (draft)
- `.env.example` (draft)

App shell, content library, local state, the Supabase foundation (M5), the AI Edge Functions (M6), the mobile AI prompt flow (M7), and the upload/camera flow (M8) are **implemented**. Remaining feature code — projector preview (M9), polish (M10) — is **planned** (see `07-implementation-plan.md`) but not yet written.

## Files changed

**Documentation phase (new):** `docs/00…10-*.md`, `CLAUDE.md`, `README.md`, `.env.example`.

**Milestone 1 — Project Setup (new/added):**
```
package.json            (new)   package-lock.json     (new)
app.json                (new)   tsconfig.json         (new)
eslint.config.js        (new)   .gitignore            (new, hardened for .env)
expo-env.d.ts           (new, git-ignored)
app/_layout.tsx         (new)   app/index.tsx         (new)
src/{components,theme,state,services,content,lib,types}/.gitkeep   (new, empty scaffolding)
supabase/migrations/.gitkeep                                       (new)
supabase/functions/{_shared,moderate-prompt,generate-image,transform-image,process-uploaded-image}/.gitkeep  (new)
assets/**               (new, Expo placeholder icons/splash)
README.md               (updated: status + pinned versions + layout)
docs/10-handoff.md      (updated: this M1 section)
```

**Milestone 2 — App Shell (new/added):**
```
app/_layout.tsx                         (rewritten: provider shell + fonts + splash gate)
app/index.tsx                           (removed — Home moved into the tabs group)
app/onboarding.tsx                      (new — first-run age picker)
app/(tabs)/_layout.tsx                  (new — bottom tabs + onboarding redirect)
app/(tabs)/{index,explore,create,recents,settings}.tsx   (new — Home + 4 scaffolds)
src/theme/{tokens,theme,fonts,useTheme}.ts               (new)
src/state/useAppStore.ts                                 (new)
src/lib/{strings,placeholders}.ts                        (new)
src/types/index.ts                                       (new)
src/components/*.tsx (13 components) + index.ts          (new)
src/{components,theme,state,lib,types}/.gitkeep          (removed — folders now have real files)
package.json / package-lock.json        (fonts, @expo/vector-icons)
README.md / docs/10-handoff.md          (updated for M2)
```

**Milestone 3 — Content Library (new/added):**
```
src/types/index.ts                                  (extended: Category, DrawingItem, DrawingStep, …)
src/content/_helpers.ts · categories.ts · index.ts · validate.ts   (new)
src/content/items/{alphabets,numbers,animals,vehicles,space,nature,curriculum,cards}.ts   (new)
src/content/__tests__/content.test.ts               (new — 9 integrity tests)
src/content/.gitkeep                                (removed)
src/components/{DrawingThumbnail,DrawingCard,DifficultyDots,StepProgress,BackHeader}.tsx + index.ts   (new)
app/(tabs)/explore.tsx                              (rewritten — real grid + filters)
app/(tabs)/index.tsx                                (updated — real featured/recommended/categories)
app/drawing/[slug].tsx · app/tutorial/[slug].tsx    (new routes)
jest.config.js · babel.config.js                    (new)
eslint.config.js                                    (updated — jest globals override)
package.json / package-lock.json                    (jest-expo, jest, @types/jest; test script)
README.md / docs/10-handoff.md                      (updated for M3)
```

**Milestone 4 — Local State (new/added):**
```
src/state/_helpers.ts                               (new — pure age/favorites/recents reducers)
src/state/useFavoritesStore.ts · useRecentsStore.ts (new — persisted, versioned)
src/state/useAppStore.ts                            (updated — _sanitize on rehydrate)
src/state/index.ts                                  (new — barrel + useIsFavorite + recents API)
src/state/__tests__/state.test.ts                   (new — 13 tests)
src/types/index.ts                                  (extended — RecentCreation, RecentType)
src/components/RecentCard.tsx + index.ts            (new)
src/components/DrawingCard.tsx                       (updated — persisted favorite heart)
app/_layout.tsx                                      (updated — hydrate all 3 stores)
app/favorites.tsx                                    (new route)
app/drawing/[slug].tsx                               (updated — persisted favorite heart)
app/(tabs)/index.tsx                                 (updated — real favorites/recents previews)
app/(tabs)/recents.tsx                               (rewritten — real recents + clear)
app/(tabs)/settings.tsx                              (updated — Manage: clear favorites/recents + dev)
eslint.config.js                                     (updated — jest test-file rule override)
README.md / docs/10-handoff.md                       (updated for M4)
```

**Milestone 5 — Supabase Foundation (new/added):**
```
src/services/supabase.ts · session.ts · storage.ts   (new — guarded, offline-safe)
src/services/.gitkeep                                (removed)
src/types/db.ts                                      (new — DB row types + enums + Database)
src/content/seed.ts                                  (new — buildSeedSql)
scripts/generate-seed.ts                             (new — npm run seed:gen)
supabase/migrations/{0001_init,0002_rls,0003_storage,0004_retention}.sql   (new)
supabase/migrations/.gitkeep                         (removed)
supabase/seed.sql                                    (new — generated; 8 cats / 100 items / 486 steps)
src/services/__tests__/services.test.ts              (new — 4 tests)
src/content/__tests__/seed.test.ts                   (new — 6 tests)
app/_layout.tsx                                       (updated — fire-and-forget ensureSession)
tsconfig.json                                         (updated — exclude scripts/ from tsc)
eslint.config.js                                      (updated — allowEmptyCatch)
package.json / package-lock.json                      (react-native-url-polyfill, tsx; seed:gen)
README.md / docs/10-handoff.md                        (updated for M5)
```

**Milestone 6 — AI Edge Functions (new/added):**
```
supabase/functions/_shared/{types,env,strings,util,errors,response,cors,validation,
   moderation,timeout,rate-limit,handler,db,enforce}.ts                       (new)
supabase/functions/_shared/ai-provider/{config,mock,openai,replicate,index}.ts (new)
supabase/functions/{moderate-prompt,generate-image,transform-image,
   process-uploaded-image}/index.ts                                           (new)
supabase/functions/**/.gitkeep                                                (removed)
supabase/functions/_shared/__tests__/{moderation,provider,config-env,validation,
   errors,rate-limit,timeout}.test.ts                                         (new — 54 tests)
src/lib/strings.ts            (updated — errors.invalidInput + errors.storage for the edge error map)
tsconfig.json                 (updated — exclude supabase/functions from app tsc; Deno-typed)
jest.config.js                (updated — strip `.ts` import extensions for Node resolution)
.env.example                  (updated — AI_PROVIDER_TIMEOUT_MS)
docs/05-api-contract.md       (updated — §13 implementation notes)
docs/09-deployment-runbook.md (updated — Edge runtime notes + AI_PROVIDER_TIMEOUT_MS)
README.md / docs/10-handoff.md (updated for M6)
```

**Milestone 7 — AI Prompt Flow (new/added):**
```
app/create/ai.tsx · app/create/ai-result.tsx            (new — AI Prompt + Result screens)
src/services/edge.ts                                    (new — typed Edge callers + EdgeError)
src/services/aiMock.ts                                  (new — client demo fallback)
src/services/ai.ts                                      (new — createAiArt orchestration + validation)
src/hooks/useAiGeneration.ts                            (new — UI state machine)
src/components/AiArtView.tsx · Banner.tsx               (new) + components/index.ts (barrel)
src/services/__tests__/{ai,aiMock,edge}.test.ts         (new — 17 tests)
src/types/index.ts            (updated — RecentCreation optional AI fields; backwards-safe)
src/lib/strings.ts            (updated — `ai` flow copy)
src/components/RecentCard.tsx (updated — real http thumbnail; else emoji)
app/(tabs)/create.tsx         (updated — AI option navigates to /create/ai)
app/(tabs)/recents.tsx · app/(tabs)/index.tsx  (updated — reopen AI Result for ai_generation)
README.md / docs/10-handoff.md (updated for M7)
```

**Milestone 8 — Upload / Camera Flow (new/added):**
```
app/create/upload.tsx · app/create/variants.tsx        (new — Upload/Capture + Variant Selection)
src/services/upload.ts                                  (new — processUpload orchestration + helpers)
src/state/useUploadStore.ts                             (new — ephemeral draft hand-off) + state/index.ts barrel
src/components/VariantCard.tsx                          (new) + components/index.ts barrel
src/lib/image.ts                                        (new — isRenderableImage helper)
src/services/__tests__/upload.test.ts                   (new — 15 tests)
src/services/edge.ts          (updated — processUploadedImage/transformImage + ProcessData/TransformData/styles)
src/services/aiMock.ts        (updated — mockProcessUpload + mockTransform)
src/types/index.ts            (updated — RecentCreation optional originalUri + variants; backwards-safe)
src/lib/strings.ts            (updated — `upload` flow copy)
src/components/{AiArtView,RecentCard}.tsx  (updated — use isRenderableImage)
app/(tabs)/create.tsx         (updated — upload + camera cards navigate; camera passes ?mode=camera)
app/(tabs)/recents.tsx · app/(tabs)/index.tsx  (updated — reopen Variant Selection for uploaded_image)
app.json                      (updated — expo-image-picker plugin + camera/photo permission strings)
README.md / docs/10-handoff.md (updated for M8)
```

## How to run (current — Milestone 8)
See `09-deployment-runbook.md` §2. The app runs fully **without** Supabase (local/mock).
```bash
npm install && cp .env.example .env && npm run start   # mock mode (no keys) — no crash
npm test                                               # content + seed + state + services + edge fns + AI + upload (118 tests)
npm run seed:gen                                       # regenerate supabase/seed.sql from src/content
```
Try the creation flows with zero backend:
- **AI:** Create → Generate with AI → type/tap an idea → Make my drawing. Safe → demo image + line art (Demo badge); "dragon fighting with blood" → kid-friendly rewrite banner; clearly-unsafe → block message.
- **Photo:** Create → Upload a photo (or Take a photo) → pick → Use this photo → Pick a style (Original / Line art / Pencil sketch / Coloring page / Cartoon) → Use this style.
Both save to **Recents** (reopenable). (Camera needs a physical device; the simulator falls back to gallery.)
To enable the backend: set `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env`, apply migrations + `seed.sql` to a Supabase project (docs/09 §3). To serve/deploy the **Edge Functions** (needs Deno + Supabase CLI): `supabase functions serve` (smoke in mock mode) → `supabase functions deploy <name>` (docs/09 §4). (Node ≥ 22.13 recommended.)

## How to configure Supabase
See `09-deployment-runbook.md` §3–§4 and `04-database-schema.md`. Summary: create project → `supabase link` → `db push` migrations → run `seed.sql` → create buckets → set `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env`.

## How to configure AI keys
See `09-deployment-runbook.md` §4. Secrets go to Supabase function env only:
```bash
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set AI_PROVIDER=openai AI_MOCK_MODE=false
# verify current model IDs at setup (kept in env/config, not hardcoded):
supabase secrets set OPENAI_MODERATION_MODEL=<id> OPENAI_REWRITE_MODEL=<id> OPENAI_IMAGE_MODEL=<id>
# rate limiting (real mode only; mock unlimited) + retention window:
supabase secrets set AI_RATE_LIMIT_ENABLED=true AI_RATE_LIMIT_PER_DAY=50 DATA_RETENTION_DAYS=30
supabase functions deploy moderate-prompt generate-image transform-image process-uploaded-image
```
Never place secret keys in `.env`/`EXPO_PUBLIC_*`/the app bundle. With no keys (or `AI_MOCK_MODE=true`), the app uses the mock provider. Record the **exact model IDs used** here after the real-key smoke test.

## Tests run
- **Milestone 1 checks (all pass):** `npm run lint` (0 findings), `npm run typecheck` (strict, 0 errors), `npx expo-doctor` (18/18), `npm run start` (Metro boots), `npx expo export -p ios` (bundle compiles).
- **Milestone 2 checks (all pass):** `npm run lint` (0 findings), `npm run typecheck` (0 errors, after typed-routes regen), `npx expo-doctor` (18/18), `npm run start` (Metro boots), `npx expo export -p ios` (4.1MB bundle compiles).
- **Milestone 3 checks (all pass):** `npm test` (**9/9** content integrity), `npm run lint` (0 findings), `npm run typecheck` (0 errors), `npx expo-doctor` (18/18), `npm run start` (Metro boots), `npx expo export -p ios` (1,680 modules).
- **Milestone 4 checks (all pass):** `npm test` (**22/22** — content + state), `npm run lint` (0 findings/warnings), `npm run typecheck` (0 errors), `npx expo-doctor` (18/18), `npm run start` (Metro boots), `npx expo export -p ios` (1,686 modules).
- **Milestone 5 checks (all pass):** `npm test` (**32/32** — content + seed + state + services), `npm run lint` (0 findings/warnings), `npm run typecheck` (0 errors), `npx expo-doctor` (18/18), `npm run start` (Metro boots), `npx expo export -p ios` (1,756 modules), `npm run seed:gen` (seed generated). Supabase CLI not run locally (no project) — commands documented for later.
- **Milestone 6 checks (all pass):** `npm test` (**86/86** — +54 Edge-Function tests across 7 suites), `npm run lint` (0 findings), `npm run typecheck` (0 errors; `supabase/functions` excluded — Deno-typed), `npx expo-doctor` (18/18), `npx expo export -p ios` (4.9MB bundle; server code excluded). Deno + Supabase CLI not installed → `deno check` / `supabase functions serve` smoke documented for later (docs/09 §4).
- **Milestone 7 checks (all pass):** `npm test` (**103/103** — +17 AI-flow tests across 3 suites), `npm run lint` (0 findings), `npm run typecheck` (0 errors, after typed-routes regen via Metro), `npx expo-doctor` (18/18), `npm run start` (Metro boots, regenerates route types), `npx expo export -p ios` (5.0MB bundle). Not run on a device/simulator here.
- **Milestone 8 checks (all pass):** `npm test` (**118/118** — +15 upload tests), `npm run lint` (0 findings/warnings), `npm run typecheck` (0 errors, after typed-routes regen via Metro), `npx expo-doctor` (18/18), `npm run start` (Metro boots, regenerates route types), `npx expo export -p ios` (5.0MB bundle). Camera/gallery/upload not exercised on-device here.
- The full unit/manual test matrix (`08-test-plan.md`) runs in Milestone 11.

## Data retention (V1)
Anonymous uploaded images and AI-generated images (plus their metadata/prompts) are retained for **30 days by default** (`DATA_RETENTION_DAYS`, configurable), then purged from Postgres and Storage by a scheduled job. Content tables are retained. Full policy: `04-database-schema.md` §9; setup: `09-deployment-runbook.md` §4 "Data retention purge". Confirm/adjust the window with the owner before a real-key pilot.

## Known issues / limitations (planned-state)
- AI output is provider-dependent + non-deterministic in real mode; mock output is illustrative.
- No login/auth → `device_id`-based RLS is best-effort (spoofable); acceptable for anonymous non-PII V1.
- No real projector hardware connection (preview only).
- AI/uploaded **true** step-by-step generation not implemented (out of scope).
- **AI rate limiting** is a simple per-device/session cap (mock unlimited); not full per-account quotas. Default `AI_RATE_LIMIT_PER_DAY=50`, tunable.
- **Provider model IDs** are env-configured and must be verified at implementation time (not hardcoded); record the exact IDs used after the real-key smoke test.
- **Data retention** purge requires the scheduled job (pg_cron or scheduled function) to be set up per project; until then, data is not auto-deleted.
- **Moderation is text-prompt-only in V1** — uploaded-image and generated-output-image moderation are deferred to the pre-pilot / App Store checklist (below), not implemented in the mock build.
- **Audio narration** (TTS via `expo-speech`) is optional Milestone-10 polish scoped to creation flows; may be deferred to future. No recorded voice in V1.
- **`ai_generations` schema:** only `output_image_url` + `line_art_url` are produced in V1; `sketch_url`/`cartoon_url`/`coloring_page_url` are kept as nullable **future-use** AI-prompt variants. `uploaded_images` still uses all four photo-transform variant columns (unchanged).
- No COPPA/GDPR-K legal certification or App Store kids-category approval is claimed — human/legal review required before public release.
- Open product decisions remain (see `00-product-brief.md` §Open questions) — none block a mock-mode build.

## Next steps
1. **Get approval to proceed to Milestone 9 (Projector Preview: full-screen canvas with rotate / zoom / brightness / high-contrast / paper-size, reachable from Detail / Tutorial / AI Result / Variant Selection / Recents / Favorites, + "Connect projector — coming soon").** (Milestones 1–8 are complete; AI Result + Variant Selection already host a Projector "coming soon" entry point to replace.)
2. Execute Milestones 9→12 (`07-implementation-plan.md`), testing after each, local commit per completed milestone (with summary), no remote push.
3. Resolve the brief's open questions before a real-key pilot (provider/budget, privacy posture, storage exposure, fonts/branding, moderation strictness, telemetry, min OS).
4. Pre-release (separate track): legal/privacy review for a kids' product, store metadata, real brand/asset pass.

### Roadmap (future phases, not V1)
auth + child profiles · cloud sync of favorites/recents · subscriptions · real Bluetooth/Wi-Fi projector pairing · parent dashboard · teacher/classroom + B2B school · marketplace · social sharing · video tutorials · AI-generated true step-by-step tutorials · print/export · store-release polish + compliance.

## Pre-pilot & pre-release checklist

> Gating steps **outside** the V1 mock build. The mock MVP does not require these; a real-key pilot and a public kids release do.

### Before a real-key pilot
- [ ] Confirm AI **provider** and **exact model IDs** (set via env; record the IDs used).
- [ ] Confirm the **per-device/session rate limit** (`AI_RATE_LIMIT_PER_DAY`, window).
- [ ] Confirm the **global daily cap** (`AI_GLOBAL_DAILY_LIMIT`) and **spend cap** (`AI_GLOBAL_DAILY_SPEND_CAP_USD`, wired to provider budget/usage; count cap enforced first).
- [ ] **Test real-key latency**; decide sync vs async/polling (`05` §12); tune client/Edge timeouts.
- [ ] Verify **private storage** (`user-uploads`, `ai-generations`) + **signed URLs** with short TTLs.
- [ ] Run **one real-key smoke test** (`moderate-prompt` safe/blocked + `generate-image`); record results.
- [ ] **No secrets in the bundle** (string-scan; only `EXPO_PUBLIC_*` present).
- [ ] Confirm **data-retention** purge job is configured (`DATA_RETENTION_DAYS`).

### Before App Store / public kids release
- [ ] **Human legal/privacy review** for a children's product.
- [ ] **COPPA / GDPR-K posture** confirmed (consent model, data handling).
- [ ] **Privacy policy URL** published and linked in-app + store listing.
- [ ] **Upload/output image moderation decision** implemented (provider image-moderation and/or human review of uploaded photos + generated outputs) — V1 moderates prompts only.
- [ ] **Real brand / art pass** (logo, fonts licensing, hero/placeholder assets).
- [ ] **App Store / Google Play kids-category review** (Kids / Designed for Families requirements).
- [ ] **Data retention/deletion workflow verified** end-to-end (purge runs; objects + rows removed).
- [ ] App icons/splash, permission usage strings, age-rating questionnaire complete.

## App-store build path
See `09-deployment-runbook.md` §6–§7: EAS build/submit, permission usage strings, icons/splash, privacy policy, age rating; Kids/Designed-for-Families category is a gated, human-reviewed step (no compliance claimed here). The checklist above is the authoritative gate.
