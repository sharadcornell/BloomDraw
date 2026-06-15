# 00 — Product Brief

> Status: Draft for approval · Owner: Product · Last updated: 2026-06-15
> Source of truth: `BloomDraw_Product_Packet`. This brief restates and sharpens the packet for the team.

## Product name

**BloomDraw**

## One-line description

BloomDraw is an AI-powered drawing companion for kids that turns preloaded lessons, photos, and text prompts into traceable art, sketches, cartoons, and projector-ready drawing experiences.

## Target users

| Group | Role | Notes |
| --- | --- | --- |
| Children 3–12 | Primary end user | Three age bands drive difficulty and recommendations: 3–5, 6–8, 9–12. |
| Parents | Primary buyer + co-user | Want trustworthy, educational, hands-on (not passive) screen activity. |
| Grandparents / relatives / gift buyers | Buyer | Gift purchase, low setup tolerance, value "magical" first impression. |
| Teachers / schools / after-school programs | **Future** secondary | Explicitly **out of scope for V1.** Documented as roadmap only. |

Primary MVP lens: **D2C parent + child creative-learning app.** No B2B dashboards in V1.

## Core problem

Kids want to draw but get discouraged because drawing from a reference is hard — they cannot translate what they see into something that looks good, and they give up. Parents want creative activities that are educational and active rather than passive screen time, and that they can trust around young children.

## Value proposition

BloomDraw makes drawing **easier, guided, and confidence-building**. It turns any idea, photo, or learning topic into traceable, step-by-step creative output — and previews how that art will one day be projected onto paper to trace by hand.

It is not "just a projector app." It is creative learning + guided drawing + kid-safe AI imagination + a future hardware companion + a parent-child activity.

## MVP goal

Ship a beautiful, fast, polished iOS/Android (Expo React Native) app that demonstrates the full BloomDraw experience **before** any hardware exists, suitable for investor demos, user pilots, and manufacturer conversations.

The MVP must prove:

1. Users can browse drawing content effortlessly.
2. Kids and parents instantly understand the drawing/tutorial experience.
3. The app feels modern, magical, premium, and child-friendly.
4. Photos can become trace-ready styles (line art, sketch, coloring page, cartoon).
5. AI prompts produce kid-safe drawing images.
6. Generated images produce a simplified line-art version.
7. The Projector Preview concept is obvious without physical hardware.
8. The app is structured for App Store / Play Store release.

## Target age groups

- **3–5 (Sprouts):** largest touch targets, fewest steps (easy = 4 steps), simplest subjects, heaviest adult co-use assumption.
- **6–8 (Bloomers):** medium difficulty default (6 steps), more categories surfaced.
- **9–12 (Creators):** harder subjects allowed (8 steps), AI + upload features featured more prominently.

Age is selected as a lightweight filter on first open and in Settings. **No full child profiles in V1.**

## Business goal

- Validate D2C demand and the "guided drawing + AI + future projector" narrative.
- Produce a demo-ready and pilot-ready artifact that de-risks the hardware fundraise.
- Establish a clean, provider-agnostic technical foundation that can later add auth, sync, payments, and hardware without a rewrite.

## Success criteria

The MVP is successful when all of these are demonstrably true (see `08-test-plan.md` for verification):

1. App opens to a polished, animated experience.
2. Age filter changes recommended content + difficulty.
3. Library categories and ~100 structured items are browsable, with 10–20 detailed hero items.
4. Preloaded drawings show working 4/6/8-step tutorials.
5. Favorites and recents work locally (no login).
6. Photo upload/capture produces selectable style variants.
7. AI prompt flow produces a kid-safe image + line-art version.
8. Prompt moderation blocks unsafe input and safely rewrites borderline input with child-friendly messaging.
9. AI runs through a real, API-ready, server-side architecture with a mock fallback when keys are absent.
10. Projector Preview makes the hardware vision obvious.
11. Supabase stores anonymous generation/upload metadata (or it is clearly documented + gated when unconfigured).
12. No secrets are shipped in the mobile bundle.

## Assumptions

1. **No login in V1.** Identity is an anonymous, device-generated session id.
2. **Keys may be absent during dev/demo.** A mock AI provider must make every flow runnable end-to-end offline; mock mode is the default.
3. **Placeholder content is acceptable** for most of the ~100 items, as long as the data shape supports real assets later. We will not copy competitor or copyrighted assets; placeholders are locally generated or neutral.
4. **AI image generation/transformation is best-effort,** not deterministic. The product value does not depend on pixel-perfect output, only on a believable, safe, selectable result.
5. **True step-by-step generation for AI/uploaded images is not required.** Preloaded tutorials are authored data.
6. Target devices: modern iOS (iPhone + iPad) and Android phones/tablets; layouts must be phone- and tablet-responsive.
7. The default AI provider will be OpenAI-compatible (moderation + image generation), with Replicate as an alternate and a Mock provider always available. The app is not coupled to a vendor. Exact provider model IDs are verified at implementation time and kept configurable (env), not hardcoded.
8. Supabase is the single backend (Postgres + Storage + Edge Functions).
9. **Real AI usage is rate-limited.** Mock mode is unlimited; real mode enforces a configurable per-device/session generation limit, with a child-safe message when reached.
10. **Data retention (V1):** anonymous uploaded images and AI-generated images (and their metadata) are retained for **30 days by default** (configurable), then purged. Chosen as a privacy-protective default for a kids' product with no login; revisit if a product reason emerges (e.g., user-visible history). See `04-database-schema.md`, `09-deployment-runbook.md`, `10-handoff.md`.
11. **Moderation scope (V1):** the mock/demo build requires **prompt (text) moderation before AI generation** only. **Uploaded-image moderation and generated-output-image moderation are not required for the mock build.** Reviewing uploaded photos and generated images for safety (provider image-moderation tools and/or human review) is a **real-key-pilot / App Store / kids-scale release checklist item** (see `10-handoff.md`), not a blocker for V1. Documented as a known limitation, not a silent gap.

## Open questions (for the buyer/founder)

These do **not** block documentation or a mock-mode build. They are flagged for a decision before a real-key pilot:

1. **AI image provider + budget:** Confirm OpenAI vs. Replicate and the per-generation cost ceiling. (Exact model IDs are verified/pinned at implementation and kept in env config — not a doc-time decision.) Confirm the default **per-device rate limit** value (assumed `AI_RATE_LIMIT_PER_DAY=50`).
2. **Data retention & privacy posture for a kids' product:** Retention default is **30 days** for anonymous images/metadata (configurable) — confirm or adjust. Do we need a parent-facing privacy notice now? (COPPA/GDPR-K review is a human/legal task — see risks.)
3. **Image storage exposure:** Are AI/upload images private (signed URLs) or public-read in V1? Default assumption: private buckets + signed URLs.
4. **Fonts/branding:** OK to use Google Fonts (Baloo 2 + Nunito) and a generated wordmark for the MVP, pending a real brand pass?
5. **Moderation strictness:** Confirm the block-vs-rewrite threshold and whether borderline prompts should always rewrite (gentler) or sometimes block.
6. **Telemetry:** Any analytics in V1, or strictly the anonymous metadata tables? Default assumption: no third-party analytics in V1.
7. **Min OS versions** and whether iPad/Android-tablet is a launch requirement or "nice to have."

## Non-goals (V1)

Login/auth, full child profiles, payments/subscriptions, real Bluetooth/Wi-Fi projector pairing, B2B/teacher/school dashboards, marketplace, social sharing, video tutorials, and AI-generated *true* step-by-step tutorials. All captured as roadmap in `01-prd.md` §Non-MVP and `10-handoff.md`.

## Related docs

`01-prd.md` · `02-user-flows.md` · `03-technical-architecture.md` · `04-database-schema.md` · `05-api-contract.md` · `06-design-system.md` · `07-implementation-plan.md` · `08-test-plan.md` · `09-deployment-runbook.md` · `10-handoff.md` · `../CLAUDE.md`
