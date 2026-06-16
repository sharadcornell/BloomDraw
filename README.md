# BloomDraw 🌸✏️

> **Milestones 1–8 complete.** Bootable Expo + TypeScript + Expo Router app with an animated splash, age onboarding, themed tabs, a **content library** (8 categories, ~100 drawings / 20 heroes, Explore filters, Detail, 4/6/8-step tutorials), **persistent local state** (age, favorites, recents), a **Supabase foundation** (guarded offline-safe client, migrations, generated seed, anonymous session + storage services), the **AI Edge Functions** (four Deno functions + provider-agnostic `AIProvider` with OpenAI/Replicate/**Mock**, prompt moderation, rate limiting, child-safe errors — all server-side, no secrets in the bundle), the **mobile AI prompt flow** (Create → prompt → moderate → generate image + line art → result → recents; safe/rewritten/blocked), and the **upload/camera flow** (gallery or camera → process → pick a drawing style → recents, with a full zero-key demo). The app runs fully in local/mock mode without Supabase or AI keys. Projector preview (M9) begins next, pending approval.

**BloomDraw** is an AI-powered drawing companion for kids (ages 3–12) that turns preloaded lessons, photos, and text prompts into traceable art, sketches, cartoons, and projector-ready drawing experiences. Built for parents and gift-buyers as a premium, kid-safe creative-learning app — and as the software companion to a future BloomDraw drawing **projector**.

## Status
🟢 **Milestones 1–8 complete** — project setup + app shell + content library + local state + Supabase foundation + AI Edge Functions + AI prompt flow + **upload/camera flow** (gallery/camera → process → variant selection → recents; full zero-key demo). All checks pass (lint, typecheck, **118/118 tests**, expo-doctor 18/18, Metro boots, iOS bundle exports). 🟡 Milestones 9–12 not started (awaiting approval). See [`docs/10-handoff.md`](docs/10-handoff.md).

## What it does (V1 / MVP)
- 📚 Browse a library of ~100 guided drawings across 8 categories (Alphabets, Numbers, Animals, Vehicles, Space, Nature, Curriculum, Cards).
- 🪜 Follow **step-by-step tutorials** (4 / 6 / 8 steps by difficulty).
- 🎚️ Pick an **age band** (3–5 / 6–8 / 9–12) that tunes recommendations + difficulty.
- 📷 Turn a **photo** (gallery or camera) into Line art, Pencil sketch, Coloring page, or Cartoon.
- ✨ **Generate** a kid-safe image from a text prompt, plus a simplified line-art version.
- 🛡️ **AI safety layer**: every prompt is moderated → safe / gently rewritten / blocked, with kid-friendly messaging.
- ❤️ **Favorites & recents**, stored on-device (no login).
- 📽️ **Projector Preview Mode**: full-screen, rotate, zoom, brightness/high-contrast, paper-size — a glimpse of the future hardware.

V1 has **no login, no payments, and no hardware pairing.** Identity is an anonymous device session.

## Tech stack
Expo (managed) · TypeScript (strict) · Expo Router · React Native Reanimated 4 + Moti · Zustand + AsyncStorage · Expo Image Picker / Camera / Image Manipulator · Supabase (Postgres + Storage + Edge Functions) · provider-agnostic AI (`AIProvider`: OpenAI default · Replicate alt · **Mock** fallback). Details: [`docs/03-technical-architecture.md`](docs/03-technical-architecture.md).

### Pinned versions (Milestone 1 setup — Expo SDK 56)
Toolchain at setup: **Node v22.12.0**, npm 10.9.0. (RN 0.85.3 prefers Node ≥ 22.13 — see note in Quick start.)

| Package | Version | | Package | Version |
| --- | --- | --- | --- | --- |
| expo (SDK) | `~56.0.12` | | react-native-reanimated | `4.3.1` |
| react | `19.2.3` | | react-native-worklets | `0.8.3` |
| react-native | `0.85.3` | | react-native-gesture-handler | `~2.31.1` |
| expo-router | `~56.2.11` | | react-native-safe-area-context | `~5.7.0` |
| typescript | `~6.0.3` | | react-native-screens | `4.25.2` |
| zustand | `^5.0.14` | | @react-native-async-storage/async-storage | `2.2.0` |
| @supabase/supabase-js | `^2.108.2` | | moti | `^0.30.0` |
| expo-image-picker | `~56.0.18` | | expo-camera | `~56.0.8` |
| expo-image-manipulator | `~56.0.19` | | expo-image | `~56.0.11` |
| expo-file-system | `~56.0.8` | | expo-font | `~56.0.7` |
| expo-haptics | `~56.0.3` | | expo-crypto | `~56.0.4` |
| expo-linear-gradient | `~56.0.4` | | expo-status-bar | `~56.0.4` |
| @expo/vector-icons | `^15.1.1` | | @expo-google-fonts/baloo-2 · nunito | latest |
| eslint | `^9.0.0` | | eslint-config-expo | `~56.0.4` |

> Full, exact lockfile lives in `package-lock.json`. Versions follow Expo SDK 56's recommended set (installed via `expo install`).

## Quick start
```bash
npm install
cp .env.example .env      # leave AI keys blank; AI_MOCK_MODE=true
npm run start             # then press i (iOS) / a (Android), or scan with Expo Go
```
Today this boots to a placeholder Home screen (Milestone 1). As features land, with no Supabase/AI keys the app will run fully locally with **mock** AI (a "Demo mode" badge). To enable the backend and real AI, follow [`docs/09-deployment-runbook.md`](docs/09-deployment-runbook.md).

> **Node version:** use Node **≥ 22.13** (or 20.19.4+/24.3+) — React Native 0.85 emits an `EBADENGINE` warning on Node 22.12. Setup succeeded on 22.12, but upgrading clears the warning.

## Scripts
| script | does | status |
| --- | --- | --- |
| `npm run start` | Expo dev server | ✅ M1 |
| `npm run ios` / `npm run android` | open on simulator/emulator | ✅ M1 |
| `npm run web` | run on web | ✅ M1 |
| `npm run lint` | ESLint (`eslint .`) | ✅ M1 |
| `npm run typecheck` | `tsc --noEmit` (strict) | ✅ M1 |
| `npx expo-doctor` | Expo health check | ✅ M1 |
| `npm run test` | Jest unit tests (jest-expo) — content + seed + state + services + edge fns + AI + upload (118 tests) | ✅ M3–M8 |
| `npm run seed:gen` | Regenerate `supabase/seed.sql` from `src/content` (source of truth) | ✅ M5 |
| `supabase functions serve` | Serve the 4 Edge Functions locally (mock mode) — needs Deno + Supabase CLI | 📋 M6 (docs/09 §4) |

## Configuration
- App-public config via `EXPO_PUBLIC_*` (Supabase URL + anon key + app env).
- **Secrets (AI keys, service-role key) are server-side only** — set as Supabase function secrets, never in the app bundle. See [`.env.example`](.env.example) and the runbook.

## Repository layout
```
app/         Expo Router routes (root convention)
  _layout.tsx            provider shell + fonts + splash gate
  onboarding.tsx         first-run age picker
  (tabs)/                Home · Explore · Create · Recents · Settings
  create/                ai.tsx · ai-result.tsx (M7) · upload.tsx · variants.tsx (M8)
src/
  theme/                 tokens · theme · fonts · useTheme
  components/            shared UI components incl. AiArtView, Banner, VariantCard (+ index barrel)
  state/                 useAppStore · useFavoritesStore · useRecentsStore (persisted) · useUploadStore (ephemeral)
  hooks/                 useAiGeneration (AI flow state machine)
  lib/                   strings · placeholders · image (isRenderableImage)
  types/                 shared types (Category, DrawingItem, DrawingStep, RecentCreation, …)
  content/               categories + 8 item files + queries + validate + seed (8 cats, 100 items)
  services/              supabase · session · storage · edge · ai · aiMock · upload  (offline-safe)
  types/db.ts            DB row types + enums + Database (separate from app types)
scripts/     generate-seed.ts (npm run seed:gen)
supabase/    migrations/{0001_init,0002_rls,0003_storage,0004_retention}.sql · seed.sql
  functions/  _shared/* (ai-provider, moderation, validation, errors, rate-limit, db, …) + 4 Deno fns (M6)
assets/      icons · splash · placeholder art  (Expo placeholder icons until brand pass)
docs/        product + technical documentation (source of truth)
app.json · tsconfig.json · eslint.config.js · package.json · .env.example · CLAUDE.md
```
> Routes live at the repo-root `app/` (per `docs/03` §3). Non-route code lives under `src/` and is imported via the `@/*` path alias (→ `./src/*`).

## Documentation
Start here, in order:
1. [`docs/00-product-brief.md`](docs/00-product-brief.md) — scope, goals, assumptions, open questions
2. [`docs/01-prd.md`](docs/01-prd.md) — personas, stories, acceptance criteria, states
3. [`docs/02-user-flows.md`](docs/02-user-flows.md) — every flow incl. errors
4. [`docs/03-technical-architecture.md`](docs/03-technical-architecture.md) — stack, structure, AI abstraction
5. [`docs/04-database-schema.md`](docs/04-database-schema.md) — Supabase schema, RLS, seed plan
6. [`docs/05-api-contract.md`](docs/05-api-contract.md) — Edge Function contracts + mock behavior
7. [`docs/06-design-system.md`](docs/06-design-system.md) — colors, type, components, a11y
8. [`docs/07-implementation-plan.md`](docs/07-implementation-plan.md) — milestones
9. [`docs/08-test-plan.md`](docs/08-test-plan.md) — tests + manual flows
10. [`docs/09-deployment-runbook.md`](docs/09-deployment-runbook.md) — setup + deploy
11. [`docs/10-handoff.md`](docs/10-handoff.md) — living handoff
12. [`CLAUDE.md`](CLAUDE.md) — operating rules

## Safety & privacy
Kid-safe by design: server-side prompt moderation before any generation; anonymous, non-PII storage; no login. **No COPPA/GDPR-K compliance or App Store Kids-category approval is claimed** — those require human/legal review before public release.

## License / assets
No copyrighted or competitor assets are used; placeholders are locally generated and hero demo art is original. Fonts via license-clear Google Fonts (pending brand sign-off). Project license: TBD by owner.
