# 07 — Implementation Plan

> Status: Draft for approval · Owner: Engineering/Delivery · Last updated: 2026-06-15
> Build only after explicit approval. Build **vertical slices**, milestone by milestone, testing after each. Local commits only after a completed milestone, with a summary. No remote push.

## Sequencing principles
- One milestone at a time; each ends in a runnable, demoable state.
- Mock mode is the default so every milestone runs without keys.
- Update the relevant doc whenever implementation deviates from it.
- Keep components reusable but not over-abstracted; strong TypeScript throughout.

## Dependency graph (high level)
```
M1 setup → M2 shell → M3 content library → M4 local state
                         │
                         ├→ M5 supabase → M6 edge functions ─┬→ M7 AI prompt flow
                         │                                    └→ M8 upload/camera flow
                         └────────────────────────────────────→ M9 projector preview
M7,M8,M9 → M10 polish → M11 test & fix → M12 handoff
```

---

## Milestone 1 — Project setup
**Goal:** a clean Expo + TS + Router app that boots.
- Tasks: init Expo (managed, TS) in this folder; add Expo Router; deps (Reanimated, Moti, gesture-handler, Zustand, AsyncStorage, image-picker/camera/manipulator, expo-image, fonts, gradient, haptics, crypto, safe-area); configure `app.config.ts` (name, slug, icon/splash placeholders, plugins); add `tsconfig` strict; scripts (`start`, `ios`, `android`, `lint`, `typecheck`, `test`); ESLint + Prettier; finalize `.env.example` + `README`; base folder structure per `03` §3.
- Files: `package.json`, `app.config.ts`, `tsconfig.json`, `babel.config.js`, `.eslintrc`, `.prettierrc`, `app/_layout.tsx`, `app/index.tsx`, `src/theme/*`.
- Deps: none.
- Acceptance: `npm run typecheck` + `npm run lint` pass; app boots to a placeholder home on iOS + Android.
- Verify: `npx expo-doctor`; launch in simulator/emulator.

## Milestone 2 — App shell
**Goal:** splash, tabs, home scaffold, age filter, shared state-of-UI components.
- Tasks: theme provider + fonts + splash gate in root layout; bottom tabs (Home/Explore/Create/Recents/Settings); onboarding age picker; Home scaffold (hero, age chips, featured/category placeholders, create + projector entry points); build `Button`, `Card`, `Chip`, `AgeFilter`, `EmptyState`, `Loader`, `ErrorState`, `SkeletonCard`, `DemoModeBadge`; gentle animations.
- Files: `app/_layout.tsx`, `app/onboarding.tsx`, `app/(tabs)/*`, `src/components/*`, `src/theme/*`, `src/lib/strings.ts`.
- Deps: M1.
- Acceptance: PRD AC-1, AC-2 (shell + home render + navigation), AC-3 partial (age picker persists once M4 lands; here it's in-memory + stubbed persist).
- Verify: navigate all tabs; splash → tabs; tablet layout sanity.

## Milestone 3 — Content library
**Goal:** ~100 seed items + 8 categories + tutorials browsable.
- Tasks: define TS types (`Category`, `DrawingItem`, `DrawingStep`); author **`src/content` as the single source of truth** (8 categories, 100 items per `04` §7 distribution — every hero assigned to a category, incl. **Cute robot → Space**; 20 hero items with full steps, generic steps for placeholders); branded placeholder image component; Explore (category cards + age/difficulty/category filters + grid + empty state); Drawing Detail (final/trace/meta/favorite/CTAs); Step-by-Step Tutorial (4/6/8 steps, Back/Next, progress, final action).
- Files: `src/content/*`, `src/types/*`, `src/lib/images.ts`, `app/(tabs)/explore.tsx`, `app/drawing/[slug].tsx`, `app/tutorial/[slug].tsx`, related components.
- Deps: M2.
- Acceptance: PRD AC-4, AC-5.
- Verify: open ≥5 categories incl. heroes; run an easy/medium/hard tutorial; confirm step counts; filter to zero → empty state.

## Milestone 4 — Local state
**Goal:** persistent age, favorites, recents.
- Tasks: Zustand stores + AsyncStorage persist (`age`, `favorites`, `recents`, `ui`); safe-parse/reset on corruption; favorite toggle on Detail/cards; Favorites screen/section; Recents screen (placeholder records until M7/M8) with delete + clear; wire age filter persistence into Home/Explore.
- Files: `src/state/*`, `app/favorites.tsx`, `app/(tabs)/recents.tsx`, Home/Explore wiring.
- Deps: M3.
- Acceptance: PRD AC-3 (persist), AC-9.
- Verify: favorite → relaunch persists; add/clear recents; corrupt a slice manually → app recovers.

## Milestone 5 — Supabase
**Goal:** schema, buckets, anonymous session, client services (guarded).
- Tasks: `supabase/migrations/0001_init.sql`, `0002_rls.sql`, `0003_storage.sql`; **`supabase/seed.sql` generated from `src/content` via `scripts/generate-seed.ts` (add an npm script; if deferred, leave an explicit TODO + checklist — never hand-maintain a second source)**; guarded `services/supabase.ts` (returns null/offline when env absent); `services/session.ts` (device id via expo-crypto + `anonymous_sessions` upsert); `services/storage.ts` (uploads + signed URLs); **TS types: DB-row types mirror the Postgres enums exactly (incl. `pending`/`processing`), defined separately from the narrower client-facing API-response types — no enum drift (see `04` §1 / `05` §1).**
- Files: `supabase/*`, `src/services/{supabase,session,storage}.ts`, `src/types/*`.
- Deps: M4 (+ a Supabase project for live test; works offline otherwise).
- Acceptance: schema applies cleanly on a fresh project; app still runs fully with no Supabase env (no crash); when configured, a session row upserts.
- Verify: `supabase db reset` (or `db push`) locally; toggle env on/off; confirm offline path.

## Milestone 6 — AI Edge Functions
**Goal:** four functions + provider abstraction + mock fallback + safe errors + rate limiting.
- Tasks: `_shared/ai-provider` (`index`, `openai`, `replicate`, `mock`, **`config.ts` for env-driven model IDs — no hardcoded model literals**), `_shared/{moderation,ratelimit,cors,errors,env}`; implement `moderate-prompt`, `generate-image`, `transform-image`, `process-uploaded-image` per `05`; service-role DB writes; mock fallback default (**unlimited in mock**); **configurable per-device/session rate limiting + a configurable global daily cap in real mode** keyed off `x-device-id`/`anonymous_sessions` (`AI_RATE_LIMIT_ENABLED`, `AI_RATE_LIMIT_PER_DAY`, `AI_GLOBAL_DAILY_LIMIT`, `AI_LIMIT_WINDOW_HOURS`; `AI_GLOBAL_DAILY_SPEND_CAP_USD` documented as provider-budget integration, count-cap enforced first), returning `rate_limited` (per-device) / `global_limit_reached` (global) envelopes when exceeded; **primary server-side controls = input validation + server-side secrets + session/device checks + rate limiting + safe error handling**; CORS handled as hygiene only (not the security boundary — see `03` §10); child-safe error mapping + server logging.
- Files: `supabase/functions/*`.
- Deps: M5.
- Acceptance: PRD AC-8 (block/rewrite), AC-12 (mock end-to-end + mock unlimited), AC-11 (no secrets client-side), **AC-13 (rate limit enforced in real mode → child-safe message)**; model IDs come from env/config; contracts match `05`.
- Verify: `supabase functions serve`; curl each function in mock mode (safe/rewritten/blocked + generate + transform + process; confirm no limit hit); in real/forced mode, exceed the configured limit and confirm `rate_limited` + child-safe message; with a real key, smoke-test moderate + generate once.

## Milestone 7 — AI prompt flow
**Goal:** full prompt → safety → image + line art → result → recents.
- Tasks: AI Prompt screen (input, example chips, validation); call `moderate-prompt` → handle safe/rewritten/blocked UI (banner / standard block message); call `generate-image` (+ line art); **friendly long-running loading state (age-appropriate copy) + client timeout (~30–45s, configurable) → child-safe "nap" retry**; safety/error/result states; AI Result screen (image + line art + projector CTA + save/favorite + try again); save to recents; metadata write when configured. (Async/polling is the documented real-key upgrade — see `05` §12; not required for the mock build.)
- Files: `app/create/ai.tsx`, `app/create/ai-result.tsx`, `src/services/{edge,ai}.ts`, hooks, strings.
- Deps: M6.
- Acceptance: PRD AC-7, AC-8.
- Verify: run safe / borderline (rewrite) / unsafe (block) prompts in mock; confirm recents + (if configured) `ai_generations` row.

## Milestone 8 — Upload / camera flow
**Goal:** pick/capture → preprocess → variants → select → recents.
- Tasks: Create hub options; gallery picker; camera capture w/ permission handling + simulator fallback; selected-image preview + retake; client resize/compress (Image Manipulator); upload to `user-uploads` (when configured); call `process-uploaded-image`/`transform-image`; **friendly long-running loading state + client timeout → child-safe "nap" retry**; Variant Selection (Original/line art/sketch/coloring page/cartoon); select → recents; metadata write; partial-failure handling.
- Files: `app/create/upload.tsx`, `app/create/variants.tsx`, services, components (`ImageVariantCard`).
- Deps: M6 (M7 patterns reused).
- Acceptance: PRD AC-6.
- Verify: gallery + camera (device) in mock; permission-denied path; variant select → recents + (if configured) `uploaded_images` row.

## Milestone 9 — Projector preview
**Goal:** polished preview with controls + "coming soon."
- Tasks: `app/projector.tsx` + `ProjectorCanvas`; full-screen image on paper surface; rotate (90° + free), pinch/slider zoom, brightness, high-contrast/outline mode, paper-size overlay (A4/Letter) if feasible; "Connect projector — coming soon" affordance; reachable from Detail/Tutorial/AI Result/Variants/Recents/Favorites; downscale large images for smooth gestures.
- Files: `app/projector.tsx`, `src/components/ProjectorCanvas.tsx`, gesture/animation utils.
- Deps: M3/M7/M8 (entry points).
- Acceptance: PRD AC-10.
- Verify: open from each entry point; exercise every control; large image stays smooth.

## Milestone 10 — Polish
**Goal:** production-feel finish.
- Tasks: animation pass (splash, transitions, loaders, success); tablet layouts (2 vs 3–4 cols, padding); accessibility (labels, contrast, reduce-motion, dynamic type); refine empty/error/loading everywhere; visual consistency vs `06`; remove dead code; perf check (list virtualization, image cache).
- **Optional subtask (not a blocker): audio narration.** If `expo-speech` is easy/stable, add narration of the centralized strings in the AI-creation + upload/camera-creation flows only, with mute + replay controls and device-silent-mode respect (`02` §11, `06` §12). Defer to future if it adds risk; **must not delay or destabilize M1–M9 or core polish.**
- Files: cross-cutting (+ optional `src/lib/narration.ts`, mute state in `ui` store).
- Deps: M7–M9.
- Acceptance: design-system adherence; AC accessibility notes; no jank on key screens. (Narration, if included: mute/replay work, no-op when unavailable, respects silent mode — otherwise documented as deferred.)
- Verify: phone + tablet pass; reduce-motion on; quick perf sanity; (if narration) mute/replay + silent-mode check.

## Milestone 11 — Testing & fixing
**Goal:** green checks + scripted manual pass.
- Tasks: run `npm install`, `npm run lint`, `npm run typecheck`, `npm run test` (add a small unit suite for moderation mapping, strings, store reducers, content integrity), `npx expo-doctor`, Edge Function checks (`supabase functions serve` smoke); fix all errors; bundle string-scan for secrets (AC-11); execute `08-test-plan.md` manual flows; add missing scripts or document why unavailable.
- Files: `__tests__/*`, config, fixes across app.
- Deps: M10.
- Acceptance: PRD §10 launch criteria checks 4–7; all listed commands pass or are documented.
- Verify: see `08-test-plan.md`.

## Milestone 12 — Final handoff
**Goal:** ship-ready docs + summary.
- Tasks: update `README`, `.env.example`, all `/docs`, and `10-handoff.md` (built features, files changed, run steps, Supabase + AI key config, tests run, known issues, next steps, app-store path).
- Files: `README.md`, `.env.example`, `docs/*`.
- Deps: M11.
- Acceptance: handoff complete + accurate; reproducible local run from a clean clone.
- Verify: dry-run setup from docs only.

---

## Files most likely to change (hotspots)
- `app/_layout.tsx` (providers/splash), `src/theme/*` (tokens), `src/state/*` (persistence shape), `src/services/{edge,ai,supabase}.ts` (contracts), `supabase/functions/_shared/ai-provider/*` (provider swaps), `src/content/*` (seed), `src/lib/strings.ts` (all child copy).

## Cross-milestone acceptance → PRD AC map
M2→AC1,2 · M3→AC4,5 · M4→AC3,9 · M5→(backend ready) · M6→AC8,11,12,13 · M7→AC7,8 · M8→AC6 · M9→AC10 · M10→(quality) · M11→AC11,12,13 + launch criteria.

## Estimated effort (rough, for planning only)
M1–M2 small; M3 medium-large (content authoring); M4 small; M5 medium; M6 large (AI core); M7 medium; M8 medium-large; M9 medium; M10 medium; M11 medium; M12 small. Build order favors a demoable app as early as M3–M4.
