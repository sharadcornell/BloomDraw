# 05 — API Contract

> Status: Draft for approval · Owner: Engineering · Last updated: 2026-06-15
> All AI runs through Supabase Edge Functions. Secrets are server-side only. Every flow has a **mock fallback** (default in dev). Child-safe messages come from a shared strings module; raw provider/moderation detail is logged server-side and never returned to the child.

## 1. Transport & conventions

- **Base:** `https://<project-ref>.functions.supabase.co/<function-name>` (or `supabase.functions.invoke('<name>', { body })` from the client).
- **Method:** `POST`, `Content-Type: application/json` (uploads may use `multipart/form-data` or a pre-uploaded storage reference — see §6).
- **Auth header:** `Authorization: Bearer <EXPO_PUBLIC_SUPABASE_ANON_KEY>` (anon). Edge Functions use the service role internally.
- **Envelope (success):**
  ```json
  { "ok": true, "data": { /* function-specific */ } }
  ```
- **Envelope (error, child-safe):**
  ```json
  { "ok": false, "error": { "code": "string_code", "userMessage": "child-safe text", "retryable": true } }
  ```
  `userMessage` is always safe to show. Diagnostic detail (provider name, stack, status) is logged server-side, never in the response body.
- **CORS (hygiene only, not the security boundary):** `OPTIONS` is handled and origins are restricted for any web/preview surface, but **native mobile clients do not enforce browser CORS**, so it must not be relied on to protect these functions. Server-side protection comes from input validation, server-side secrets, session/device checks, rate limiting, and safe error handling (see §11 and `03` §10).
- **Headers (common request):** `x-device-id` (links activity to `anonymous_sessions`; required in real AI mode for rate-limit accounting), optional `x-app-env`.

### Shared types (TS)
**DB row types and API response types are kept separate** to avoid enum drift. DB enums include transient states (`pending`, `processing`); the API response statuses are the subset the client actually receives.
```ts
type AgeRange = '3-5' | '6-8' | '9-12';
type TransformStyle = 'line_art' | 'sketch' | 'cartoon' | 'coloring_page';

// --- DB ROW types: mirror the Postgres enums exactly (see 04-database-schema.md §1) ---
type ModerationStatusRow  = 'safe' | 'rewritten' | 'blocked' | 'pending';
type GenerationStatusRow   = 'pending' | 'processing' | 'complete' | 'failed';
type ProcessedStatusRow    = 'pending' | 'processing' | 'complete' | 'failed';

// --- API RESPONSE types: what the client receives in a function reply ---
// moderate-prompt is synchronous & terminal → client never sees 'pending'.
type ModerationStatus = 'safe' | 'rewritten' | 'blocked';
// generate/transform/process: 'complete'|'failed' synchronously today; 'processing'
// is included to support the async/polling real-key path (§12) without a breaking change.
type GenerationStatus = 'processing' | 'complete' | 'failed';
```
**Why the client never sees `pending`:** `pending` is a write-time row state set the instant a row is inserted, before work starts. In V1's synchronous calls, the function only returns *after* the row has advanced to a terminal state, so responses carry `complete`/`failed` (or an error envelope) — never `pending`. The DB row types still include `pending`/`processing` because any code that *reads rows* (e.g., a future history view, the async-polling status endpoint, or admin/debug tooling) will encounter them. `processing` is exposed in the API `GenerationStatus` specifically so the polling upgrade in §12 is type-compatible from day one.

---

## 2. `moderate-prompt`

Classifies a prompt and, when borderline, returns a gentle kid-safe rewrite. **Always called before `generate-image`.**

**Request**
```json
{ "prompt": "dragon fighting monster with blood", "ageRange": "6-8" }
```
| field | type | req | notes |
| --- | --- | --- | --- |
| prompt | string (1–300) | yes | trimmed; validated length |
| ageRange | AgeRange | no | tunes strictness/rewrite tone |

**Response — `data`**
| field | type | notes |
| --- | --- | --- |
| status | `safe`\|`rewritten`\|`blocked` | |
| safePrompt | string | original (safe), rewritten (rewritten), or `""` (blocked) |
| userMessage | string | shown only when rewritten/blocked (see copy below) |
| reasonCode | string | **coarse, category-free** on the wire — only `ok`, `rewrite_softened`, or `blocked`. The raw block category (`violence`, `sexual`, `hate`, `self_harm`, `dangerous`, `scary`) is **server log only** and is NEVER returned to the client (CLAUDE.md AI-safety rule). |

**Examples**
```json
// safe
{ "ok": true, "data": { "status": "safe", "safePrompt": "cute elephant astronaut on the moon", "userMessage": "", "reasonCode": "ok" } }
// rewritten
{ "ok": true, "data": { "status": "rewritten", "safePrompt": "friendly dragon flying in a magical forest", "userMessage": "I made your idea a little more kid-friendly.", "reasonCode": "rewrite_softened" } }
// blocked
{ "ok": true, "data": { "status": "blocked", "safePrompt": "", "userMessage": "Let’s make something fun and safe to draw. Try asking for an animal, space scene, vehicle, flower, or cartoon character.", "reasonCode": "blocked" } }
```
Block categories: violence, sexual/adult, hate, self-harm, dangerous, disturbing/scary-for-children. Borderline (mild aggression/scary) → prefer **rewrite**; clearly unsafe → **block**. Never loops: a rewrite is moderated once; if still unsafe → block.

---

## 3. `generate-image`

Generates a kid-safe image from a **safe** prompt and (optionally) a simplified line-art version. Caller must pass a `safePrompt` that already passed moderation (the function re-checks defensively).

**Request**
```json
{ "safePrompt": "cute elephant astronaut on the moon", "ageRange": "6-8",
  "options": { "lineArt": true, "projectionReady": true, "size": "1024x1024" } }
```
| field | type | req | notes |
| --- | --- | --- | --- |
| safePrompt | string (1–300) | yes | re-moderated server-side |
| ageRange | AgeRange | no | style hint (simpler for younger) |
| options.lineArt | boolean | no | also return a simplified line-art variant (default true) |
| options.projectionReady | boolean | no | high-contrast/outline variant suited to tracing |
| options.size | string | no | provider-dependent |

**Response — `data`**
| field | type | notes |
| --- | --- | --- |
| generationId | uuid | row in `ai_generations` (when device id present + Supabase configured) |
| imageUrl | string | generated image (signed URL or data URL in mock) |
| lineArtUrl | string \| null | when requested |
| provider | string | `openai`\|`replicate`\|`mock` |
| status | GenerationStatus | `complete` on success |
| demo | boolean | true when mock fallback used → app shows Demo mode badge |

```json
{ "ok": true, "data": { "generationId": "…", "imageUrl": "https://…", "lineArtUrl": "https://…", "provider": "mock", "status": "complete", "demo": true } }
```
On failure: error envelope + server logs; row updated to `generation_status='failed'`, `error_message` (server-side).

> **V1 scope:** `generate-image` returns only `imageUrl` + `lineArtUrl`. The `ai_generations.sketch_url` / `cartoon_url` / `coloring_page_url` columns are **future-use** (AI-prompt style variants) and are not populated by this endpoint in V1 — see `04` §2.5. (Those styles *are* produced for uploads via `process-uploaded-image`/`transform-image`.)

---

## 4. `transform-image`

Transforms one image into one style.

**Request**
```json
{ "imageUrl": "https://…/user-uploads/<device>/<uuid>.jpg", "style": "line_art" }
```
or `{ "uploadRef": "user-uploads/<device>/<uuid>.jpg", "style": "cartoon" }` (storage reference instead of URL).
| field | type | req | notes |
| --- | --- | --- | --- |
| imageUrl \| uploadRef | string | yes (one) | source image |
| style | TransformStyle | yes | `line_art`\|`sketch`\|`cartoon`\|`coloring_page` |

**Response — `data`**
```json
{ "ok": true, "data": { "outputImageUrl": "https://…", "style": "line_art", "provider": "mock", "status": "complete", "demo": true } }
```

---

## 5. `process-uploaded-image`

Convenience: produce multiple variants in one call (used by the upload flow).

**Request**
```json
{ "uploadRef": "user-uploads/<device>/<uuid>.jpg",
  "styles": ["line_art", "sketch", "coloring_page", "cartoon"] }
```
| field | type | req | notes |
| --- | --- | --- | --- |
| uploadRef \| imageUrl | string | yes (one) | source |
| styles | TransformStyle[] | no | default = all four |

**Response — `data`**
| field | type | notes |
| --- | --- | --- |
| uploadedImageId | uuid | row in `uploaded_images` |
| originalUrl | string | echoed original |
| lineArtUrl | string \| null | |
| sketchUrl | string \| null | |
| coloringPageUrl | string \| null | |
| cartoonUrl | string \| null | |
| status | `complete`\|`partial`\|`failed` | `partial` if some styles failed |
| demo | boolean | mock fallback indicator |

```json
{ "ok": true, "data": { "uploadedImageId": "…", "originalUrl": "https://…",
  "lineArtUrl": "https://…", "sketchUrl": "https://…", "coloringPageUrl": "https://…",
  "cartoonUrl": "https://…", "status": "complete", "demo": true } }
```
Partial success returns the variants that succeeded plus `status:"partial"`; the app shows what it has and lets the user retry the rest.

---

## 6. Upload mechanics

Two supported paths (implementation picks one; documented for the client):
1. **Client-direct upload** (preferred): client uploads the preprocessed image to `user-uploads/{device_id}/{uuid}.jpg` via the Supabase JS client (anon + storage policy), then passes `uploadRef` to the Edge Function. Keeps functions light.
2. **Function upload**: client posts `multipart/form-data` to the function, which uploads with the service role. Used if direct upload policies are undesirable.

Both yield a private object served to the app via short-TTL signed URLs.

---

## 7. AI provider abstraction (server)

The four functions never call a vendor directly; they call `getProvider()` → an `AIProvider` (see `03` §7). This isolates vendor specifics:
- **OpenAI** (default real): moderation, rewrite (chat completion w/ strict kid-safe system prompt), image generation, and transforms (image edits). **Model IDs are configurable via server-side env** (`OPENAI_MODERATION_MODEL`, `OPENAI_REWRITE_MODEL`, `OPENAI_IMAGE_MODEL`) with documented defaults, and the **exact current IDs are verified at implementation time** (brief open question #1) — not hardcoded as literals throughout the code.
- **Replicate** (alt): hosted models for generation/transform.
- **Mock** (default dev): deterministic local results, `demo:true`.

Swapping providers requires no client or contract change — only env (`AI_PROVIDER`).

---

## 8. Mock fallback behavior

Triggered when `AI_MOCK_MODE=true` (default) **or** the selected provider's key is missing.
- `moderate-prompt`: local blocklist (keyword/category) + gentle-rewrite map. Example: contains "blood/fight/kill/gun…" → block; "scary/monster/dragon-fighting" → rewrite to a gentle version. Deterministic, no network.
- `generate-image`: returns a stable themed placeholder image (e.g., gradient + subject glyph) keyed off the prompt hash; `lineArtUrl` a simplified variant.
- `transform-image` / `process-uploaded-image`: returns deterministic derived variants (e.g., grayscale/threshold/posterize stand-ins) or labeled placeholders.
- Every mock response sets `demo:true`; the app surfaces a **Demo mode** badge so it's never mistaken for a real model.
- **Mock mode is not rate limited** (no external calls/cost) — every flow stays frictionless for dev/demo. Rate limiting applies to real AI mode only (§11).
- DB writes still occur when Supabase is configured (with `provider:"mock"`); if Supabase is also unconfigured, writes are skipped silently and the app keeps results in local recents.

---

## 9. Error codes (server → child-safe map)

| code | when | userMessage (child-safe) | retryable |
| --- | --- | --- | --- |
| `invalid_input` | validation failed | "Hmm, that didn't work. Try a different idea!" | false |
| `blocked_prompt` | moderation block | "Let’s make something fun and safe to draw. Try asking for an animal, space scene, vehicle, flower, or cartoon character." | false |
| `provider_unavailable` | 5xx/timeout/no key & mock off | "Our art helper is taking a quick nap. Let's try again!" | true |
| `rate_limited` | per-device/session AI limit reached (real mode), or provider 429 (§11a) | "Let's take a tiny break and try again in a moment." | true |
| `global_limit_reached` | global daily request/spend cap reached (real mode) (§11b) | "Our art helper is resting for now. Please try again later." | true |
| `storage_error` | upload/signed-url failure | "We couldn't save that image. Let's try again!" | true |
| `internal` | unexpected | "Something went wrong, but it's not your fault. Try again!" | true |

Diagnostics (provider error text, status codes, stack traces, moderation categories) are logged server-side only.

---

## 10. Client service layer (for reference)

`src/services/edge.ts` exposes typed callers mirroring the above:
```ts
moderatePrompt(input): Promise<ModerationData>
generateImage(input): Promise<GenerationData>
transformImage(input): Promise<TransformData>
processUploadedImage(input): Promise<ProcessData>
```
Each returns `data` on `ok:true` or throws a typed `EdgeError { code, userMessage, retryable }` the UI maps to the error states in `01-prd.md` §9.

> **Implementation status:** all four callers are implemented — `moderatePrompt` + `generateImage` in **Milestone 7** (AI prompt flow); `processUploadedImage` + `transformImage` in **Milestone 8** (upload/camera flow). App-side orchestration lives in `src/services/ai.ts` (prompt) and `src/services/upload.ts` (photo); the offline/demo mirror is `src/services/aiMock.ts`. The client never imports server/Deno code and never reads a secret (anon key only; `x-device-id` is sent for rate-limit accounting). When Supabase is configured, the upload flow uploads the original to `user-uploads/{device}/{uuid}.jpg` and passes `uploadRef`; unconfigured/offline → local demo variants.

**Connectivity rules:**
- **Supabase unconfigured** → the layer short-circuits to a local mock equivalent so the app still runs (mirrors server mock); all flows demoable.
- **Configured but offline** → the layer detects no connectivity and **does not attempt the real provider**; it raises an offline error mapped to "You're offline right now. You can still draw from the library!" (or the nap message) + Retry. **Never silently call the real provider when offline.** Library/favorites/recents continue from local data.
- **Optional dev-only override:** a developer flag (e.g., `EXPO_PUBLIC_FORCE_MOCK`) can force the mock path for offline demos even when configured — dev convenience only, off by default in production.
- In all cases the app **must not crash** on connectivity loss.

---

## 11. AI rate limiting & spend caps (V1)

Applies to **`generate-image`, `transform-image`, and `process-uploaded-image`** in **real AI mode** (`AI_MOCK_MODE=false`). `moderate-prompt` is cheap and not separately limited (but is gated behind the same per-device checks). **Mock mode is unlimited (never counted).** Two layers are checked in order: **per-device first, then global.**

### (a) Per-device/session limit (anti-abuse)
- **Limit:** a **configurable per-device/session count** over a rolling window. Defaults (server-side env, tunable):
  - `AI_RATE_LIMIT_ENABLED=true`
  - `AI_RATE_LIMIT_PER_DAY=50` (generations + transformations per `device_id`)
  - `AI_LIMIT_WINDOW_HOURS=24` (window for both layers); optional `AI_RATE_LIMIT_BURST` for short-term burst protection.
- **Identity:** keyed off `x-device-id` → `anonymous_sessions`. Requests missing a valid device id in real mode are rejected with `invalid_input` (the client always sends one).
- **Accounting:** server-side only (count of the caller's `ai_generations` + `uploaded_images` rows in the window, or a dedicated counter).
- **Over-limit response:**
  ```json
  { "ok": false, "error": { "code": "rate_limited", "userMessage": "Let's take a tiny break and try again in a moment.", "retryable": true } }
  ```

### (b) Global daily cap (cost protection)
- **Cap:** total real generations/transformations across **all** devices per window.
  - `AI_GLOBAL_DAILY_LIMIT=500` — request-count cap (always enforceable, provider-independent).
  - `AI_GLOBAL_DAILY_SPEND_CAP_USD` (optional) — dollar ceiling. **Spend tracking is provider-dependent**, so V1 enforces the count cap first and treats the spend cap as a **provider-budget integration to wire up before the real-key pilot** (provider usage/billing API). Unset → count cap only.
- **Accounting:** a small global daily counter (e.g., a `daily_usage` row keyed by date), incremented on each successful real call.
- **Cap-reached response:**
  ```json
  { "ok": false, "error": { "code": "global_limit_reached", "userMessage": "Our art helper is resting for now. Please try again later.", "retryable": true } }
  ```
  Calm, parent-safe and child-safe; **no cost/spend/limit detail exposed.**

### Common
- The app shows the friendly message and offers a later retry; it **never** exposes counts, spend, limits, windows, or technical detail to the child.
- **Provider 429:** an upstream rate limit maps to the `rate_limited` envelope.
- **Out of scope (V1):** per-account quotas, paid tiers, and result caching (future).

---

## 12. AI latency & timeouts (V1)

`generate-image`, `transform-image`, and `process-uploaded-image` are slow and may fail. Behavior contract:

- **Client timeout:** the client service layer aborts after a configurable ceiling (≈30–45s) and raises `provider_unavailable` → child-safe "Our art helper is taking a quick nap. Let's try again." + Retry. No infinite spinners.
- **Edge Function timeout:** each function caps its upstream provider call below the Edge platform wall-clock limit and returns the `provider_unavailable` envelope on timeout (logging the real cause server-side); when Supabase is configured, the row is marked `generation_status='failed'` / `processed_status='failed'`.
- **Synchronous shape (V1 default):** the contracts in §2–§5 are synchronous (request → final `data`). This is fine for mock and an initial real-key smoke. **Documented risk:** a slow provider may hit the timeout; the app degrades to the retry state rather than hanging.
- **Async/polling (preferred real-key path):** when the provider supports async jobs, the recommended real implementation is **submit → `{ generationId, status:'processing' }` → poll a `get-generation-status` endpoint (or webhook) until `complete`/`failed`.** This avoids long-held requests. The response envelope already carries `generationId` and a `status` field to support this without a breaking change. Adopting it is a real-key-pilot task, not a V1 mock requirement.
- **Mock:** returns immediately (optionally a small artificial delay to exercise the loading UI); never times out. **No job queue in V1.**
- **Timeout knob:** the Edge-side ceiling is `AI_PROVIDER_TIMEOUT_MS` (default `25000`, below the platform wall-clock). Implemented via `_shared/timeout.ts`.

---

## 13. Implementation notes (Milestone 6)

The four functions match §2–§5. A few intentional, documented specifics:

- **`generate-image` `original_prompt`:** this endpoint receives only a `safePrompt` (the user's original text lives in `moderate-prompt`), so the `ai_generations.original_prompt` row is set to the incoming `safePrompt`. M7 may thread the true original through later; not a contract change.
- **`generate-image` defensive moderation:** the `safePrompt` is **re-moderated server-side**; a block returns the `blocked_prompt` error envelope (the row is not advanced to `complete`). A defensive rewrite is used as the effective prompt.
- **`transform-image` persistence:** the single-style transform returns no `uploadedImageId` (per §4) and therefore **does not write a row**; rate-limit accounting is driven by `generate-image` + `process-uploaded-image` rows. (Minor, documented under-count for standalone transforms.)
- **Real generated-image URLs (real-key path):** V1 returns the provider's image URL/`b64` directly (mock returns a self-contained SVG **data URL**). **Persisting real outputs to the private `ai-generations` bucket + returning a short-TTL signed URL is a pre-pilot task** (the provider URL may be temporary) — see `10-handoff.md`.
- **`process-uploaded-image` status mapping:** the API `status` is `complete`/`partial`/`failed`; the `uploaded_images.processed_status` enum has no `partial`, so a partial result stores `processed_status='complete'` (some variants present) and the API surfaces `partial`.
- **Rate-limit accounting:** per-device + global counts are derived by counting `ai_generations` + `uploaded_images` rows in the window (no extra table). In **real mode without Supabase configured**, counts can't be read → the function logs a warning and allows (cannot enforce). Mock mode is never counted.
- **Spend cap:** `AI_GLOBAL_DAILY_SPEND_CAP_USD` is carried in config and documented as a **provider-budget integration before the real-key pilot**; V1 enforces the request-count cap only (§11b).
