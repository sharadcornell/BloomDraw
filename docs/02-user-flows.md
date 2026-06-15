# 02 — User Flows

> Status: Draft for approval · Owner: Product/UX · Last updated: 2026-06-15
> Notation: `→` step, `⎇` branch, `⛔` error/recovery, `💾` persisted state, `☁️` backend write (skipped if Supabase unconfigured).

## Navigation map

```
Splash
  └─► Tabs (bottom)
        ├─ Home
        │    ├─► Drawing Detail ─► Step-by-Step Tutorial ─► (last step) ─► Projector Preview
        │    ├─► Create
        │    └─► Projector Preview (from a recent/favorite)
        ├─ Explore (Library) ─► Drawing Detail ─► …
        ├─ Create
        │    ├─► AI Prompt ─► AI Result ─► Projector Preview
        │    └─► Upload/Capture ─► Variant Selection ─► Projector Preview
        ├─ Recents ─► (AI Result | Variant Selection | Drawing Detail) ─► Projector Preview
        └─ Settings
```
Projector Preview is a stack/modal route reachable from Detail, Tutorial (final), AI Result, Variant Selection, Recents, and Favorites.

---

## 1. First app open flow

→ Cold launch shows animated splash (logo "blooms", ~1–2s while fonts/local seed load).
→ First-run check (`hasOnboarded` in AsyncStorage = false):
  → Show lightweight **age picker** (3–5 / 6–8 / 9–12) as a single delightful screen — no account, no email.
  ⎇ User picks a band → 💾 `selectedAgeRange`, `hasOnboarded=true` → ☁️ upsert `anonymous_sessions` (device_id, selected_age_range).
  ⎇ User skips → default band = 6–8 (flagged "not chosen"); Home shows a gentle "Pick your age" chip.
→ Land on **Home**, pre-filtered to the chosen band.
⛔ Local seed fails to load → still render shell + retry; never block on backend.

## 2. Age filter flow

→ Entry points: first-open picker, Home age chips, Settings.
→ User taps a band → recommendations + featured rows refilter instantly (optimistic, local) → default difficulty hint updates (3–5→easy, 6–8→medium, 9–12→hard).
→ 💾 `selectedAgeRange` updated → ☁️ update `anonymous_sessions.selected_age_range`, `last_seen_at`.
→ Explore inherits the band as its initial age filter (user can still override per-session).

## 3. Content browsing flow

→ Open **Explore** → see category cards + filter chips (age, difficulty, category).
→ Tap a category → grid of `drawing_items` (placeholder items render branded placeholders).
⎇ Apply filters → grid updates; 💾 `lastOpenedCategory`.
⛔ Zero results → empty state + "reset filters" chip.
→ Tap an item → **Drawing Detail** (final image, trace version, age, difficulty, favorite heart, "Start tutorial", "Projector preview").

## 4. Preloaded tutorial flow

→ From Detail → tap **Start tutorial** → **Step-by-Step Tutorial**.
→ Shows step image + instruction + progress (e.g., "Step 2 of 6") + Back/Next; large targets.
→ Advance through 4/6/8 steps (by difficulty).
→ On last step → primary action: **Open trace / Projector preview**; secondary: "Done" → back to Detail.
⎇ Favorite toggled anywhere → 💾 favorites updated.
⛔ Missing step image → render placeholder; instruction text still shows.

## 5. Upload / camera flow

→ From **Create** → choose **Upload from gallery** or **Take a photo**.
⎇ Gallery → Expo Image Picker → user selects → preview.
⎇ Camera → request permission:
   ⎇ granted → capture → preview.
   ⛔ denied → explain once + offer Settings deep link + fall back to gallery.
   ⛔ no camera (simulator) → capture hidden/disabled; gallery only.
→ **Preview** screen: confirm or retake/reselect. On confirm → client-side resize/compress (Image Manipulator).
→ **Friendly long-running loading state** (branded "making your art…" animation, age-appropriate copy — simpler/encouraging for younger users) while requesting variants; transforms can take several seconds:
   → ☁️ insert `uploaded_images` (processed_status=processing) + upload original to `user-uploads`.
   → Call `process-uploaded-image` (or per-style `transform-image`).
   ⎇ keys present → real provider variants.
   ⎇ mock mode → mock/locally-derived variants (e.g., grayscale/threshold previews) + "Demo mode" badge (returns fast).
   ⛔ too slow (client/Edge timeout) or failure → "Our art helper is taking a quick nap. Let's try again." + Retry; partial variants still selectable if any succeeded.
→ **Variant Selection**: Original, Line art, Pencil sketch, Coloring page, Cartoon → user picks one.
→ Picked variant → 💾 add to recents → ☁️ update `uploaded_images` (processed_status=complete, variant urls).
→ Offer **Projector Preview** + **Save/Favorite**.

## 6. AI generation flow

→ From **Create** → **Generate with AI** → **AI Prompt** screen with input + tappable kid-safe example chips ("cute elephant astronaut on the moon", "friendly dragon in a magical forest", "rocket flying past the moon", …).
→ User types/taps → inline validation (non-empty, length cap).
→ Tap **Generate** → **safety step** (calls `moderate-prompt` with prompt + age_range):
   ⎇ **safe** → proceed with original prompt.
   ⎇ **rewritten** → show banner "I made your idea a little more kid-friendly." → proceed with `safe_prompt`.
   ⛔ **blocked** → show "Let's make something fun and safe to draw. Try asking for an animal, space scene, vehicle, flower, or cartoon character." → stay on prompt screen; offer examples. (No raw reason shown to child.)
→ ☁️ insert `ai_generations` (original_prompt, safe_prompt, moderation_status, generation_status=processing, provider).
→ **Friendly long-running loading state** (branded "drawing your idea…" animation, age-appropriate encouraging copy) — generation can take several seconds:
→ Call `generate-image` (safe_prompt, age_range, style options) → returns image; then derive **line-art** version (provider transform or mock).
   ⎇ keys present → real image + line art.
   ⎇ mock mode → deterministic mock image (e.g., themed gradient/illustration) + "Demo mode" badge (returns fast).
→ **AI Result**: kid-safe image + simplified line-art + projection-ready toggle.
→ 💾 add to recents → ☁️ update `ai_generations` (generation_status=complete, output_image_url, line_art_url).
→ Offer **Projector Preview** + **Save/Favorite** + **Try another idea**.
⛔ Too slow (client/Edge timeout) or failure → "Our art helper is taking a quick nap. Let's try again." + Retry; ☁️ update generation_status=failed, error_message (server-side only). (Preferred real-key path is async/polling — see `05-api-contract.md` §12.)

## 7. Projector preview flow

→ Entry: Detail (trace), Tutorial (final), AI Result, Variant Selection, Recents, Favorites.
→ Full-screen canvas with the chosen image centered on a "paper" surface.
→ Controls: **rotate** (90° steps + free), **zoom/resize** (pinch + slider), **brightness**, **high-contrast/outline mode**, **paper-size preview** (A4/Letter frame overlay, if feasible).
→ Persistent **"Connect projector — coming soon"** affordance (disabled, aspirational, with a one-line "BloomDraw projector is on the way").
→ Back returns to origin screen; transient view settings are not persisted in V1.
⛔ Very large image → downscale for preview to keep gestures smooth.

## 8. Favorites / recents flow

→ **Favorites** tab/section lists favorited preloaded drawings → tap to open Detail → heart to remove (optimistic; 💾).
→ **Recents** tab lists AI + upload creations (newest first) with type badge → tap to re-open the relevant result screen → re-open Projector Preview.
→ Recents item → swipe/long-press to delete; header action **Clear recents** (confirm).
→ All favorites/recents are device-local (AsyncStorage). No cloud sync in V1.
⛔ Corrupt stored payload → reset that slice to empty; show empty state, not a crash.

## 9. Settings flow

→ **Settings** shows: current age range (editable → reuses age filter flow), AI safety note (plain-language, parent-facing), "Demo mode" indicator (on when keys absent), app version, and placeholders for future Account/Login and Privacy/Safety (clearly "coming soon", non-functional).
→ Optional: "Clear recents" / "Clear favorites" maintenance actions (confirm dialogs).
→ No destructive action without a confirm.

## 10. Error / recovery flows (cross-cutting)

| Trigger | User sees | Recovery |
| --- | --- | --- |
| Supabase **unconfigured** | Nothing (silent) | App runs in local/mock mode; **all flows remain demoable** (mock AI/upload + Demo badge); metadata writes skipped; dev console note only. |
| Supabase **configured but device offline** | Library/favorites/recents still work (local); AI/upload show "You're offline right now. You can still draw from the library!" | **Never silently calls the real provider when offline** — short-circuits to the offline/nap message + Retry; auto-clears when back online; no crash. |
| Offline at launch | Shell + library from local seed; offline banner | Auto-clears when back online; AI actions show offline note. |
| Edge Function 5xx/timeout | "Our art helper is taking a quick nap. Let's try again!" | Retry button; safe state preserved; server logs raw error. |
| Moderation blocked | Standard kid-safe block message + examples | Edit prompt; never explains category. |
| Camera permission denied | One-time explainer | Settings deep link + gallery fallback. |
| Corrupt local state | Nothing (silent) | Slice reset to default. |
| Asset missing | Branded placeholder | Content still usable. |

All child-facing copy lives in one place (a strings module) so wording stays consistent and reviewable — see `06-design-system.md` and `CLAUDE.md` (AI safety rules).

## 11. Optional audio narration (polish — Milestone 10, not a blocker)

A lightweight, **optional** narration layer using `expo-speech` (text-to-speech), added only if it's easy and stable. It is a Milestone 10 polish item — **Milestones 1–9 do not depend on it**, and it is deferred to future if it adds meaningful risk. **No recorded voice in V1.**

- **Scope:** the **AI creation** and **upload/camera creation** flows only. Not added to every preloaded tutorial in V1 (unless trivial).
- **What it narrates:** a few short, centralized strings (from the strings module), e.g.:
  - "Let's make your drawing."
  - "I made your idea a little more kid-friendly." (on rewrite)
  - "Your art is ready." (on result)
  - "Pick your favorite style." (variant selection)
- **Controls:** a **mute** toggle (persisted) and a **replay** button; narration off does nothing audible.
- **Respect device silent mode** where the platform allows; never force audio over a silenced device.
- ⛔ TTS unavailable/unsupported → silently no-op (UI unaffected).
