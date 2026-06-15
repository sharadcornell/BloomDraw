# 01 — Product Requirements Document (PRD)

> Status: Draft for approval · Owner: Product · Last updated: 2026-06-15
> Read with `00-product-brief.md` (scope) and `02-user-flows.md` (flows).

## 1. Product overview

BloomDraw is a kid-safe, parent-trustworthy creative-learning app for iOS and Android. Children browse a library of guided, step-by-step drawing lessons; turn their own photos into traceable styles (line art, sketch, coloring page, cartoon); and generate kid-safe images from text prompts. Every output can be opened in a **Projector Preview** that demonstrates the future BloomDraw hardware projector. All AI runs server-side through a provider-agnostic abstraction with a mock fallback so the app is fully demoable without keys.

V1 has **no login, no payments, and no hardware pairing.** Identity is an anonymous device session; favorites/recents live on-device.

## 2. Personas

### P1 — "Maya," age 5 (Sprout)
- Pre-reader, uses the app with a parent nearby. Taps big colorful things, loves animals and "magic."
- Needs: huge touch targets, almost no text, immediate delight, can't get "stuck" or reach anything scary.
- Success: traces a cat with a parent and feels proud.

### P2 — "Arjun," age 9 (Creator)
- Reads well, independent, curious, wants to make "his own" stuff with AI and his camera.
- Needs: AI prompt + photo upload that feel powerful but stay safe; harder 8-step lessons.
- Success: types "cute robot astronaut," gets a friendly image + line art, opens projector preview.

### P3 — "Priya," parent of Maya & Arjun
- Buyer and supervisor. Skeptical of "AI for kids." Wants educational value and safety she can verify.
- Needs: obvious safety, no surprise costs, no data anxiety, premium feel that justifies a future device.
- Success: sees the safety messaging work, trusts it, hands the tablet over.

### P4 — "Robert," grandparent / gift buyer
- Low tech tolerance, buys as a gift. First 60 seconds decide everything.
- Needs: zero setup, instant "wow," clear what it is.
- Success: opens it once, sees the hero + a lesson, "gets it."

## 3. User stories

Format: As a **[persona]**, I want **[capability]** so that **[outcome]**. AC = acceptance criteria (see §6 for global AC).

### Onboarding & navigation
- US-01 As a first-time user, I want a short, magical splash and a one-tap age choice so that the app immediately feels tailored. *(AC: 02 first-open flow)*
- US-02 As any user, I want simple bottom tabs (Home, Explore, Create, Recents, Settings) so that I never get lost.

### Library & tutorials
- US-03 As Maya's parent, I want age-appropriate featured lessons on Home so that I can start in one tap.
- US-04 As any user, I want to browse categories and filter by age/difficulty so that I find a drawing to make.
- US-05 As any user, I want a Drawing Detail screen with final art, a trace version, difficulty, and steps so that I know what I'm making.
- US-06 As Maya, I want a step-by-step tutorial with big Next/Back and progress so that I can follow along.
- US-07 As any user, I want to open Projector Preview from a lesson so that I see how it would project.

### Camera / upload
- US-08 As Arjun, I want to pick a photo from the gallery so that I can turn it into art.
- US-09 As Arjun, I want to capture a photo with the camera (if available) so that I can use something around me.
- US-10 As any user, I want to preview the selected image before processing so that I can confirm/retake.
- US-11 As any user, I want to see Original + Line art + Sketch + Coloring page + Cartoon variants and pick one.

### AI prompt
- US-12 As Arjun, I want to type an idea and see kid-safe helper examples so that I know what to ask for.
- US-13 As any user, I want the app to generate a kid-safe image + a simplified line-art version.
- US-14 As a parent, I want unsafe prompts blocked and borderline prompts gently rewritten, with kind messaging and no scary detail shown to my child.

### Local state
- US-15 As any user, I want to favorite preloaded drawings and see them in Favorites.
- US-16 As any user, I want my AI/upload creations in Recents, and to re-open or clear them.
- US-17 As any user, I want my age choice remembered between launches.

### Projector preview
- US-18 As any user, I want full-screen preview with rotate, zoom, brightness, and high-contrast so that it reads like a real projection tool, plus a "Connect projector — coming soon" state.

### Backend & safety (non-visible)
- US-19 As the business, I want anonymous generation/upload metadata stored in Supabase so that we can learn from usage without collecting PII.
- US-20 As the business, I want all AI keys server-side so that nothing sensitive ships in the app bundle.

## 4. MVP features (in scope)

| # | Feature | Summary | Key screens |
| --- | --- | --- | --- |
| F1 | Polished animated shell | Splash/loader, bottom tabs, transitions, tablet-responsive | Splash, all tabs |
| F2 | Home | Hero, age filter, featured, categories, recents/favorites previews, create + projector entry points | Home |
| F3 | Age filter | 3–5 / 6–8 / 9–12 influences recommendations + difficulty default | Home, Settings |
| F4 | Content library (~100 items, 8 categories) | Structured metadata, placeholders allowed, 10–20 hero items | Explore |
| F5 | Step-by-step tutorials | 4/6/8 steps by difficulty; authored data for preloaded items | Detail, Tutorial |
| F6 | Camera/gallery upload → variants | Original, line art, sketch, coloring page, cartoon | Upload/Capture, Variant Selection |
| F7 | AI prompt → image + line art | Kid-safe generation, simplified line art, projection-ready | AI Prompt, Result |
| F8 | AI safety layer | Moderate → block / rewrite / allow; kid-safe messaging | AI Prompt (states) |
| F9 | Favorites & recents (local) | Favorite preloaded items; recents of creations; remove/clear | Favorites, Recents |
| F10 | Projector Preview | Full-screen, rotate, zoom, brightness, high-contrast, paper-size, "coming soon" | Projector Preview |
| F11 | Anonymous backend storage | Sessions + generation/upload metadata in Supabase | (background) |
| F12 | Real API-ready AI w/ mock fallback | Edge Functions + AIProvider abstraction; mock default | (background) |
| F13 | AI rate limiting | Configurable per-device/session limit in real mode (mock unlimited); child-safe over-limit message | (background) |

## 5. Non-MVP features (documented, not built)

Auth/login · full child profiles · cloud sync of favorites/recents · payments/subscriptions · real Bluetooth/Wi-Fi projector pairing · parent dashboard · teacher/classroom/B2B school dashboards · marketplace/content store · social sharing · video/YouTube tutorials · AI-generated *true* step-by-step tutorials · uploaded-image *true* step-by-step tutorials · print/export mode. (Roadmap: `10-handoff.md` §Next steps.)

## 6. Acceptance criteria (global)

A feature is "done" only when its AC pass on at least one iOS and one Android target (see `08-test-plan.md`).

- **AC-1 Shell:** App boots to splash → tabs without crash; transitions are smooth (no dropped-frame jank on the home scroll). **Cold-start target: < 3s to interactive on a mid-range device in a production/standalone (release) or dev-client build — measured on-device, NOT against the Metro/JS dev server.** Metro/Expo-Go startup time is not representative (it bundles/serves JS on the fly) and **must not block implementation**; record the cold-start measurement from a release/preview build.
- **AC-2 Home:** Renders hero, age filter, ≥1 featured row, category grid, and (if present) recents/favorites previews; all create + projector entry points navigate correctly.
- **AC-3 Age filter:** Selecting a band updates Home recommendations and the default difficulty in Explore; choice persists across relaunch.
- **AC-4 Library:** ≥100 items across the 8 categories load; category + age + difficulty filters work; placeholder items render a branded placeholder (never a broken image).
- **AC-5 Tutorials:** Easy=4, medium=6, hard=8 steps; Next/Back + progress work; last step offers the trace/projector action.
- **AC-6 Upload:** Gallery pick works; camera works where permitted (graceful fallback otherwise); selected image previews; variants render; one variant is selectable and saved to recents.
- **AC-7 AI prompt:** Submitting a safe prompt returns an image + line-art variant; result saves to recents; metadata stored when Supabase is configured.
- **AC-8 Safety:** A known-unsafe prompt is blocked with the exact child-facing message; a borderline prompt is rewritten and labeled "I made your idea a little more kid-friendly."; no raw moderation/provider text is ever shown to the child.
- **AC-9 Favorites/recents:** Add/remove favorite persists; recents list persists; clear recents works.
- **AC-10 Projector:** Full-screen preview with working rotate, zoom, brightness, high-contrast; "Connect projector — coming soon" state present.
- **AC-11 Secrets:** No secret key string appears in the JS bundle or any `EXPO_PUBLIC_*` var; AI calls go through Edge Functions.
- **AC-12 Mock fallback:** With `AI_MOCK_MODE=true` or missing keys, all AI flows complete end-to-end with mock outputs and a visible "Demo mode" indicator; **mock mode is unlimited (not rate limited).**
- **AC-13 AI rate limiting & spend caps:** In real AI mode, a configurable per-device/session limit **and** a configurable global daily cap are enforced server-side. Per-device over-limit returns `rate_limited` → "Let's take a tiny break and try again in a moment."; global cap reached returns `global_limit_reached` → "Our art helper is resting for now. Please try again later." Neither exposes counts/spend/technical detail to the child. (Mock mode is exempt — see AC-12.)

**Moderation scope (V1):** AC-8 covers **prompt (text) moderation before generation** — the only moderation required for the V1 mock build. **Uploaded-image and generated-output-image moderation are explicitly out of scope for V1** and are not an acceptance criterion. Image moderation (provider tools and/or human review of uploads + outputs) is a **pre-real-key-pilot / App Store / kids-release** item, tracked in `10-handoff.md`. This is a documented, accepted limitation — see §7 Edge cases and `08-test-plan.md` §7.

## 7. Edge cases

| Area | Edge case | Required behavior |
| --- | --- | --- |
| Network | Offline / Edge Function unreachable | Friendly retry state; library + favorites still work from local data; no crash. |
| AI | Provider timeout / 5xx | Kid-friendly error ("Our art helper is taking a nap — try again"), log raw error server-side only. |
| AI | Moderation flags after rewrite still unsafe | Block with the standard message; do not loop rewriting. |
| AI | Empty / whitespace / too-long prompt | Inline validation before any call; suggest examples. |
| Camera | Permission denied | Explain once, offer Settings deep link, fall back to gallery. |
| Camera | No camera (simulator) | Hide/disable capture, keep gallery. |
| Upload | Huge image / unsupported type | Resize/convert client-side via Image Manipulator; reject with kind message if still invalid. |
| Storage | Supabase not configured | App runs fully local; metadata writes are skipped silently (logged in dev). |
| Library | Item has missing assets | Render placeholder; tutorial still shows authored steps/text. |
| Local data | Corrupt AsyncStorage payload | Safe-parse; reset that slice to default; never crash. |
| Age | No age chosen yet | Treat as "all ages"/6–8 default until chosen; prompt gently on Home. |
| Projector | Image too large to render | Downscale for preview; keep gestures responsive. |

## 8. Empty states

- **Home recents/favorites empty:** Hide or show a warm prompt: "Your creations will bloom here 🌱 — make your first one!"
- **Explore filtered to zero:** "No drawings match yet — try another age or category." + reset chip.
- **Recents empty:** Illustration + "Nothing here yet. Tap Create to make something!"
- **Favorites empty:** Illustration + "Tap the heart on any drawing to save it here."
- **Upload before selection:** Big friendly camera/gallery choices.

## 9. Error states (child-safe copy)

- **Generic AI failure:** "Our art helper is taking a quick nap. Let's try again!" + Retry.
- **Blocked prompt:** "Let's make something fun and safe to draw. Try asking for an animal, space scene, vehicle, flower, or cartoon character."
- **Rewritten prompt banner:** "I made your idea a little more kid-friendly."
- **Camera/permission:** "We need camera permission to take a photo. You can also pick one from your gallery."
- **Offline:** "You're offline right now. You can still draw from the library!"
- Never surface: stack traces, provider names/error codes, moderation category labels, or HTTP status to the child. (These are logged server-side and may appear in dev console only.)

## 10. Launch criteria (MVP demo-ready)

1. All §6 global AC pass on one iOS + one Android target.
2. Mock mode runs every flow end-to-end with no keys (AC-12).
3. Real-key path verified at least once for moderate-prompt + generate-image (documented in `08-test-plan.md`).
4. No secrets in the bundle (AC-11), verified by a bundle/string scan.
5. `npm run typecheck` and `npm run lint` pass; `npx expo-doctor` clean or deviations documented.
6. Docs current: `10-handoff.md` lists built features, known issues, and key-config steps.
7. Crash-free across the scripted manual test pass.

**Explicit non-claims at launch:** We do **not** claim COPPA/GDPR-K legal compliance or App Store kids-category approval. Those require human/legal review and are listed as gating items before any public release (not before demo/pilot).
