# 08 — Test Plan

> Status: Draft for approval · Owner: QA/Eng · Last updated: 2026-06-15
> Maps to PRD acceptance criteria (`01-prd.md` §6) and launch criteria (§10). Default test posture runs in **mock mode** (no keys); a small real-key smoke pass is called out separately.

## 1. Automated checks (CI-able commands)
Run from repo root after each milestone and before handoff:

| command | purpose | pass condition |
| --- | --- | --- |
| `npm install` | deps install | clean install, no peer-dep errors blocking build |
| `npm run lint` | ESLint | 0 errors (warnings triaged) |
| `npm run typecheck` | `tsc --noEmit` (strict) | 0 type errors |
| `npm run test` | Jest unit suite | all green |
| `npx expo-doctor` | Expo health | clean, or deviations documented |
| `supabase functions serve` (smoke) | Edge Functions boot | all 4 serve; mock requests return valid envelopes |
| secret scan (grep bundle/`EXPO_PUBLIC_*`) | no leaked secrets | no secret-key string in client bundle |

If a script is missing it must be added in M1/M11 or its absence documented with rationale.

**M11 bundle secret-scan (AC-11) — how it was run:** `npx expo export -p ios` then grep the
`dist/` Hermes bundle for `sk-…`/`r8_…`/`service_role`/`SERVICE_ROLE_KEY`/`OPENAI_API_KEY`/
`REPLICATE_API_TOKEN` and for JWT (`eyJ…`) strings. Pass = no provider/service-role keys and
no `EXPO_PUBLIC_*` secret values present (export with no env set ⇒ no anon key embedded). Note
that `sk-` substring hits inside Hermes word concatenations (e.g. `harddisk-`, `flask-`, `mask-`)
are false positives, not keys.

## 2. Unit tests (targeted, not exhaustive)
- **Moderation mapping:** unsafe keywords → `blocked` + exact child message; borderline → `rewritten` + banner; safe → `safe`. No rewrite loop.
- **Moderation — no category leak (M11):** the `moderate-prompt` wire `reasonCode` is coarse only (`ok` | `rewrite_softened` | `blocked`) via `publicReasonCode()`; the raw block category (`violence`/`sexual`/`self_harm`/`hate`/`dangerous`) is server-log-only and never returned to the client (CLAUDE.md AI-safety rule).
- **Strings module:** all referenced keys exist; block/rewrite copy matches PRD verbatim.
- **State stores:** favorites add/remove/idempotency; recents cap (≤50) + clear; age persistence; corrupt-payload safe reset.
- **Content integrity (`src/content` is source of truth):** ≥100 items; every item (incl. every hero — e.g., **Cute robot → Space**) maps to one of the 8 valid categories, no orphans; step count matches difficulty (easy4/med6/hard8) for authored items; 8 categories present; ≥20 hero items flagged; no duplicate slugs.
- **Seed parity:** `supabase/seed.sql` is generated from `src/content` (via `scripts/generate-seed.ts`); a check (or regenerate-and-diff) confirms they match, so seed never drifts. If the generator is deferred, the test asserts the TODO/checklist exists.
- **Edge error map:** each error `code` → correct child-safe `userMessage` + `retryable`.
- **Mock provider determinism:** same prompt → same mock image ref; `demo:true` always set.
- **Rate limiting & caps:** real-mode per-device counter returns `rate_limited` at `AI_RATE_LIMIT_PER_DAY`; global counter returns `global_limit_reached` at `AI_GLOBAL_DAILY_LIMIT`; per-device is checked before global; mock mode never counts/limits; `moderate-prompt` not separately limited; provider 429 maps to `rate_limited`; spend-cap (`AI_GLOBAL_DAILY_SPEND_CAP_USD`) is provider-budget integration (count cap enforced first).
- **Model-ID config:** provider model IDs resolve from env/config (with defaults), not from hardcoded literals.
- **Timeout handling:** a simulated slow/aborted request maps to `provider_unavailable` → "nap" retry copy; client aborts at the configured ceiling (no infinite wait); mock returns promptly.
- **AI prompt orchestration (M7, `src/services/ai.ts`):** safe path moderates → generates with the safe prompt → saves a recent; rewritten path uses `safePrompt` + flags the banner; blocked path returns blocked and does **not** call generate or save; empty/oversized prompt rejected before moderating; `EdgeError`/unknown errors normalize to child-safe messages with no detail leak; client falls back to the local demo mock when Supabase is unconfigured.
- **Upload orchestration (M8, `src/services/upload.ts`):** `processUpload` maps a successful result (keeping the local uri as Original) and sends `uploadRef` when uploaded; passes through `partial`; normalizes `EdgeError`/unknown errors to child-safe messages with no leak; `mockProcessUpload`/`mockTransform` are deterministic with `demo:true`; the four transform styles validate (`isTransformStyle`); `buildUploadRecentInput` produces an `uploaded_image` recent (with a renderable-thumbnail fallback to the original photo); the entry adds to the recents store on selection; the edge callers fall back to the local mock when Supabase is unconfigured.
- **Projector preview (M9, `src/lib/projector.ts`):** source normalization for a preloaded drawing (final + trace), an AI recent, an uploaded recent, and a live upload result (with missing-variant → original fallback); `previewFromRecent` is **null-safe** for missing/unknown sources and `defaultPreview` always returns a safe source (no crash); control helpers — `clampZoom` clamps to [1,4], `rotateBy` steps 90° with 360° wrap, `cycleIndex` wraps brightness/paper, `resetProjectorState` returns an independent copy of the initial state.

## 3. Manual test flows (scripted)
Run on at least **one iOS** and **one Android** target. Record pass/fail + notes.

| # | Flow | Steps | Expected (AC) |
| --- | --- | --- | --- |
| T1 | First open | Fresh install → splash → age picker → pick 6–8 | Smooth splash; lands on Home filtered to 6–8; choice persists on relaunch (AC-1, AC-3) |
| T2 | Skip age | First open → skip | Defaults to 6–8; gentle "pick age" chip on Home (edge case) |
| T3 | Home | Inspect Home | Hero, age chips, ≥1 featured row, category grid, create + projector entry points; recents/favorites previews or empty states (AC-2) |
| T4 | Age switch | Change band on Home | Recommendations + default difficulty update; persists (AC-3) |
| T5 | Browse | Explore → category → filters | Grid loads; age/difficulty/category filters work; placeholders render branded (AC-4) |
| T6 | Zero results | Over-filter | Empty state + reset chip (edge/empty) |
| T7 | Tutorial easy | Open an easy hero → Start tutorial | 4 steps, Back/Next, progress, final action (AC-5) |
| T8 | Tutorial hard | Open a hard item | 8 steps; final → projector/trace (AC-5) |
| T9 | Favorite | Heart an item → relaunch → Favorites | Persists; remove works (AC-9) |
| T10 | AI safe | Create → AI → "cute elephant astronaut on the moon" → Generate | Image + line-art result; saved to recents; (configured) `ai_generations` row (AC-7) |
| T11 | AI rewrite | Prompt "dragon fighting monster with blood" | Banner "I made your idea a little more kid-friendly."; gentle image generated; no raw detail shown (AC-8) |
| T12 | AI block | Prompt with clearly unsafe content | Standard block message; stays on prompt; no generation; no scary detail (AC-8) |
| T13 | AI errors/timeout | Force provider failure or slow response (mock off, no key, or low client-timeout) | Friendly long-running loading state shows first; on failure/timeout → child-safe "Our art helper is taking a quick nap. Let's try again." + Retry; no infinite spinner; no crash (AC + §12) |
| T14 | Upload gallery | Create → Upload → pick image → preview → process | Variants (Original/line art/sketch/coloring/cartoon); select one → recents (AC-6) |
| T15 | Camera | Create → Take photo (device) | Permission prompt; capture → preview → variants; denied → explainer + gallery fallback (AC-6, edge) |
| T16 | Projector | Open preview from a result | Full-screen; rotate/zoom/brightness/high-contrast work; "coming soon" present (AC-10) |
| T17 | Recents | Make 2 creations → Recents | Both listed newest-first; re-open; delete; clear (AC-9) |
| T18 | Settings | Open Settings | Age range editable; safety note; demo-mode indicator **+ plain-language explanation** when no keys (or a "Connected" line when configured); unified Demo badge style matches the creation/result/projector screens; version; future placeholders inert |
| T19 | Offline (configured) | Supabase configured, airplane mode → launch + browse + try AI/upload | Library/favorites/recents work from local; AI/upload show "You're offline right now…" + Retry; **real provider is never called while offline**; no crash (edge) |
| T19b | Unconfigured (local/mock) | No Supabase env → run every flow | App fully demoable in mock; AI/upload return mock + Demo badge; metadata writes skipped; no crash |
| T20 | Demo mode | No keys / `AI_MOCK_MODE=true` → run AI + upload | All flows complete with mock outputs + Demo-mode badge (AC-12) |
| T21 | Secret scan | Inspect bundle / env | No secret key in bundle or `EXPO_PUBLIC_*` (AC-11) |
| T22 | Per-device rate limit | Real mode, low `AI_RATE_LIMIT_PER_DAY` → generate past the limit | App shows "Let's take a tiny break and try again in a moment."; no counts/technical detail; mock never hits this (AC-13) |
| T23 | Global daily cap | Real mode, low `AI_GLOBAL_DAILY_LIMIT` → exceed across devices | App shows "Our art helper is resting for now. Please try again later."; no spend/cost detail; mock never hits this (AC-13) |
| T24 | Audio narration (optional, if shipped) | AI + upload flows with narration on | Short centralized strings speak; mute toggles audio off (persists); replay works; respects device silent mode; no-op where TTS unavailable. **Skip if deferred.** |

## 4. Edge Function tests (mock + real)
- **Mock (default):** curl/invoke each of the 4 functions with valid + invalid input; assert envelope shape, `demo:true`, child-safe errors, no leaked diagnostics; confirm **no rate limiting** applies in mock.
- **Rate limit + global cap (forced/real mode):** set a low `AI_RATE_LIMIT_PER_DAY`, send requests past it for one `device_id`; assert `rate_limited` + child-safe `userMessage`, counter is per-device, a different `device_id` is unaffected; confirm a provider 429 maps to `rate_limited`. Then set a low `AI_GLOBAL_DAILY_LIMIT` and exceed it across two device_ids; assert `global_limit_reached` + "Our art helper is resting for now…" and that per-device is checked before global.
- **Real-key smoke (once, before pilot):** with a real provider key, run `moderate-prompt` (safe/blocked) + `generate-image` (one safe prompt). Confirm a real image returns and a real block works. Record provider + **exact model IDs used** in `10-handoff.md`.
- **RLS sanity:** content tables readable by anon; activity writes succeed via service role; client cannot write activity tables directly.

## 5. Device checks
- **iOS:** one recent iPhone (phone layout) + one iPad (tablet layout). Simulator OK for most; camera requires a physical device.
- **Android:** one recent phone + one tablet (or large emulator). Camera on physical device.
- Check: safe areas/notch, font scaling (large dynamic type — `AppText` caps per-variant `maxFontSizeMultiplier` so layouts hold), reduce-motion, 2-col (phone) vs 3–4-col (tablet) grids, splash on cold start, 60fps on Home scroll + projector controls.
- **Cold-start measurement (AC-1):** measure < 3s to interactive on a **production/preview or dev-client build on a mid-range device**, not against the Metro/Expo-Go dev server (whose on-the-fly bundling is not representative and does not block implementation). Record the build type + device used.

## 6. Expected results summary
All §3 flows pass on one iOS + one Android; all §1 automated checks green or documented; AC-1…AC-13 satisfied; no crashes in the scripted pass; mock mode fully functional (and unlimited); rate limiting verified in real/forced mode; one real-key smoke recorded.

## 7. Known limitations (expected at MVP)
- AI output quality is provider-dependent and non-deterministic (real mode); mock output is illustrative, not "real art."
- Uploaded/AI **true step-by-step** generation is not implemented (out of scope).
- **Moderation is text-prompt-only in V1.** Uploaded-image and generated-output-image moderation are not implemented; they are a pre-pilot / App Store / kids-release item (`10-handoff.md`).
- `device_id` RLS is best-effort without auth (spoofable) — acceptable for anonymous non-PII data; hardened with future auth.
- No real projector connection (preview only).
- Paper-size overlay is "if feasible"; may ship as a visual frame approximation.
- No COPPA/GDPR-K legal certification or App Store kids-category approval claimed (human/legal gate).
- Camera unavailable on simulators (gallery fallback covers it).
- **Audio narration is optional polish** (Milestone 10) scoped to creation flows; may be deferred to future and is not an acceptance criterion.

## 8. Regression checklist (run before any commit/milestone close)
Boots on iOS + Android · tabs navigate · a tutorial runs · favorite persists · one AI mock flow completes · one upload mock flow completes · projector opens · `typecheck` + `lint` green.
