# 10 — Handoff

> Status: **Milestones 1–2 complete — Milestones 3–12 not started (awaiting approval).** · Owner: Delivery · Last updated: 2026-06-15
> Living document, updated as milestones complete. Records the documentation deliverable + the M1 setup + the M2 app shell.

## Current state (2026-06-15)
- **Phase:** Documentation + **Milestone 1 (Project Setup)** + **Milestone 2 (App Shell)** complete. The app boots through an animated splash → onboarding (first run) → bottom tabs; theme, shared components, and placeholder screens are in place. No real content/AI/Supabase/upload/projector logic yet.
- **Awaiting:** explicit approval to proceed to **Milestone 3 (Content library)**.
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

## What was built (so far)
Documentation set under `/docs` plus root config drafts:
- `docs/00-product-brief.md` … `docs/10-handoff.md` (this file)
- `CLAUDE.md` (repo operating rules)
- `README.md` (draft)
- `.env.example` (draft)

Supabase migrations/functions and seed content are **scaffolded as empty folders** (created in M1) and will be implemented in Milestones 5–6. Feature code (shell, content, AI, etc.) is **planned** (see `07-implementation-plan.md`) but not yet written.

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

## How to run (current — Milestone 2)
See `09-deployment-runbook.md` §2.
```bash
npm install && cp .env.example .env && npm run start   # then press i / a, or scan with Expo Go
```
First launch → animated splash → age-picker onboarding → bottom tabs. Returning launches go straight to tabs. (Node ≥ 22.13 recommended — see README.) Use Settings → "Reset onboarding (dev)" to replay the first-run flow.

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
1. **Get approval to proceed to Milestone 3 (Content library).** (Milestones 1–2 are complete.)
2. Execute Milestones 3→12 (`07-implementation-plan.md`), testing after each, local commit per completed milestone (with summary), no remote push.
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
