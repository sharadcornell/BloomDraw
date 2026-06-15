# 04 — Database Schema

> Status: Draft for approval · Owner: Engineering · Last updated: 2026-06-15
> Backend: Supabase Postgres + Storage. Field names match the packet exactly. SQL below is the **planned** migration content (written at Milestone 5; not yet applied).

## 1. Conventions

- Primary keys: `uuid` default `gen_random_uuid()` (via `pgcrypto`).
- Timestamps: `timestamptz default now()`.
- Enums modeled as Postgres `enum` types for safety. The app mirrors them as **DB-row TS unions that include the transient `pending`/`processing` states**, kept **separate from the narrower API-response unions** the client receives. This avoids enum drift — see `05-api-contract.md` §1 (Shared types) for the row-vs-response split and why the client never sees `pending` in V1's synchronous calls.
- No PII. "Identity" = a client-generated `device_id` (random UUID) stored in `anonymous_sessions`.
- Content tables are world-readable (anon select). Activity tables are restricted by `device_id` via RLS.

### Enum types
```sql
create type difficulty_level as enum ('easy','medium','hard');
create type age_range as enum ('3-5','6-8','9-12');
create type ai_input_type as enum ('prompt');           -- room to grow (e.g. 'image' later)
create type moderation_status as enum ('safe','rewritten','blocked','pending');
create type generation_status as enum ('pending','processing','complete','failed');
create type processed_status as enum ('pending','processing','complete','failed');
```

## 2. Tables

### 2.1 `drawing_categories`
| field | type | notes |
| --- | --- | --- |
| id | uuid PK | |
| name | text not null | display name |
| slug | text not null unique | url/key, e.g. `animals` |
| description | text | |
| icon | text | icon key/emoji or asset name |
| sort_order | int not null default 0 | ordering in UI |
| created_at | timestamptz default now() | |

### 2.2 `drawing_items`
| field | type | notes |
| --- | --- | --- |
| id | uuid PK | |
| category_id | uuid not null → `drawing_categories(id)` on delete cascade | |
| title | text not null | |
| slug | text not null unique | route key |
| description | text | |
| age_min | int not null | 3–12 |
| age_max | int not null | 3–12, `>= age_min` (check) |
| difficulty | difficulty_level not null | drives step count (4/6/8) |
| thumbnail_url | text | nullable → placeholder rendered |
| final_image_url | text | nullable → placeholder |
| trace_image_url | text | nullable → placeholder |
| is_featured | boolean not null default false | Home featured rows |
| is_placeholder | boolean not null default true | true for stub items |
| created_at | timestamptz default now() | |

Checks: `age_min between 3 and 12`, `age_max between 3 and 12`, `age_max >= age_min`.

### 2.3 `drawing_steps`
| field | type | notes |
| --- | --- | --- |
| id | uuid PK | |
| drawing_item_id | uuid not null → `drawing_items(id)` on delete cascade | |
| step_number | int not null | 1..N |
| title | text | short label |
| instruction | text not null | child-friendly text |
| image_url | text | nullable → placeholder |
| created_at | timestamptz default now() | |

Constraints: `unique (drawing_item_id, step_number)`; `step_number >= 1`. Expected N matches difficulty (4/6/8) but not DB-enforced (authoring flexibility).

### 2.4 `anonymous_sessions`
| field | type | notes |
| --- | --- | --- |
| id | uuid PK | |
| device_id | text not null unique | client-generated UUID |
| selected_age_range | age_range | nullable until chosen |
| created_at | timestamptz default now() | |
| last_seen_at | timestamptz default now() | updated on activity |

### 2.5 `ai_generations`
| field | type | notes |
| --- | --- | --- |
| id | uuid PK | |
| anonymous_session_id | uuid → `anonymous_sessions(id)` on delete set null | |
| input_type | ai_input_type not null default 'prompt' | |
| original_prompt | text not null | as typed by user |
| safe_prompt | text | rewritten/safe version; null if blocked |
| moderation_status | moderation_status not null default 'pending' | |
| generation_status | generation_status not null default 'pending' | |
| provider | text | 'openai' / 'replicate' / 'mock' |
| output_image_url | text | **V1 (required for AI prompt flow)** — generated image; nullable until complete |
| line_art_url | text | **V1 (required for AI prompt flow)** — simplified line art; nullable until complete |
| sketch_url | text | **future-use, nullable** — AI-prompt sketch variant (not produced in V1) |
| cartoon_url | text | **future-use, nullable** — AI-prompt cartoon variant (not produced in V1) |
| coloring_page_url | text | **future-use, nullable** — AI-prompt coloring-page variant (not produced in V1) |
| error_message | text | **server-side only**, never shown to child |
| created_at | timestamptz default now() | |

> **Decision (column cleanup):** `output_image_url` + `line_art_url` are the only AI-prompt outputs produced in V1. `sketch_url` / `cartoon_url` / `coloring_page_url` are **kept but explicitly marked future-use and nullable** (AI-prompt style variants are a future enhancement) rather than dropped, so adding them later needs no migration. They are **distinct from `uploaded_images`**, where line_art/sketch/cartoon/coloring_page **are** all V1 outputs (the photo-transform flow) and must not change. The `generate-image` API response only returns `imageUrl` + `lineArtUrl` in V1 (see `05` §3).

### 2.6 `uploaded_images`
| field | type | notes |
| --- | --- | --- |
| id | uuid PK | |
| anonymous_session_id | uuid → `anonymous_sessions(id)` on delete set null | |
| original_image_url | text not null | in `user-uploads` |
| processed_status | processed_status not null default 'pending' | |
| line_art_url | text | |
| sketch_url | text | |
| cartoon_url | text | |
| coloring_page_url | text | |
| created_at | timestamptz default now() | |

## 3. Relationships

```
drawing_categories 1───∞ drawing_items 1───∞ drawing_steps
anonymous_sessions 1───∞ ai_generations
anonymous_sessions 1───∞ uploaded_images
```
On session delete, activity rows keep data but null the FK (`set null`) — anonymized retention. On category/item delete, children cascade.

## 4. Indexes

```sql
create index on drawing_items (category_id);
create index on drawing_items (is_featured) where is_featured;
create index on drawing_items (difficulty);
create index on drawing_items (age_min, age_max);
create index on drawing_steps (drawing_item_id, step_number);
create unique index on anonymous_sessions (device_id);
create index on ai_generations (anonymous_session_id, created_at desc);
create index on uploaded_images (anonymous_session_id, created_at desc);
```

## 5. Storage buckets

| bucket | visibility | contents | access |
| --- | --- | --- | --- |
| `drawing-assets` | public read | preloaded thumbnails, final, trace, step images | public URLs (non-sensitive) |
| `user-uploads` | private | anonymous uploaded/captured originals | signed URLs (short TTL); written by Edge Function (service role) / client with RLS |
| `ai-generations` | private | AI generated + transformed outputs | signed URLs (short TTL) |

Path convention: `user-uploads/{device_id}/{uuid}.jpg`, `ai-generations/{device_id}/{generation_id}-{variant}.png`, `drawing-assets/{category_slug}/{item_slug}/{thumb|final|trace|step-N}.png`.

## 6. Row-Level Security (RLS) notes

- Enable RLS on **all** tables.
- **Content tables** (`drawing_categories`, `drawing_items`, `drawing_steps`): policy `select` for `anon` = true (read-only). No client insert/update/delete.
- **`anonymous_sessions`:** client may `insert` its own row and `select`/`update` the row matching its `device_id`. Practical V1 approach: the client passes `device_id`; an `upsert` is allowed, and `select/update` is gated by a `device_id`-matching policy. (If we later add JWTs, switch to `auth.uid()`.)
- **`ai_generations` / `uploaded_images`:** the **Edge Functions** (service role) perform inserts/updates, bypassing RLS. Direct client writes are disabled; client reads are limited to rows whose `anonymous_session_id` belongs to its `device_id` (via a view/policy join), or simply re-fetched through an Edge Function. V1 default: **writes via Edge Function only**, client keeps its own copy in recents, so client-side reads of these tables are optional.
- Service-role key is **never** in the client (see `03` §10).

> Note: because V1 has no auth/JWT, `device_id`-based RLS is "best-effort" (a client could spoof another device_id). This is acceptable for anonymous, non-PII V1 data and is hardened when auth lands. Documented as a known limitation in `10-handoff.md`.

## 7. Seed data plan

**`src/content/*` (bundled TS) is the single source of truth.** The app reads it directly for offline/demo, and **`supabase/seed.sql` is generated from it** — to prevent drift, prefer a small generator script (`scripts/generate-seed.ts`, run via an npm script) that emits `seed.sql` from `src/content`; if that's not in place yet, ship an explicit `TODO` + a checklist step so the two never diverge silently. Never hand-edit `seed.sql` as a second source.

### Categories (8)
`alphabets`, `numbers`, `animals`, `vehicles`, `space`, `nature`, `curriculum` (School/curriculum), `cards` (Cards/gifting).

### ~100 items distribution
| category | count | examples |
| --- | --- | --- |
| Alphabets | 26 | A–Z, hero: "Letter A with apple" |
| Numbers | 10 | 0–9, hero: "Number 1 with rocket" |
| Animals | 18 | elephant, cat face, dog, butterfly, fish, dinosaur, lion, rabbit… |
| Vehicles | 10 | car, school bus, rocket, train, plane, boat… |
| Space | 8 | rocket, moon and stars, planet, astronaut, sun, **cute robot** (friendly space robot)… |
| Nature | 12 | tree, flower, mountain landscape, sun and clouds, leaf, cloud… |
| Curriculum | 8 | simple house, shapes, clock, map, leaf cell (simple)… |
| Cards | 8 | Mother's Day card, Birthday card, Thank-you card, Get-well card… |
| **Total** | **100** | |

### Hero items (10–20, richer detail: real-ish description + full step text)
Letter A with apple (Alphabets) · Number 1 with rocket (Numbers) · Cute elephant (Animals) · Cat face (Animals) · Dog (Animals) · Butterfly (Animals) · Car (Vehicles) · Rocket (Space) · Tree (Nature) · Flower (Nature) · Mountain landscape (Nature) · Sun and clouds (Nature) · Mother's Day card (Cards) · Birthday card (Cards) · School bus (Vehicles) · Dinosaur (Animals) · Fish (Animals) · Moon and stars (Space) · Simple house (Curriculum) · **Cute robot (Space)**. *(20 heroes — every hero is assigned to one of the 8 categories; no orphan items.)*

### Difficulty → steps mapping (authoring rule)
`easy → 4 steps`, `medium → 6 steps`, `hard → 8 steps`. Hero items get fully authored step instructions; non-hero placeholders get generic but on-theme step text ("Step 1: Draw the big shape", …) so every tutorial is navigable.

### Age mapping (defaults; tunable)
Alphabets/Numbers skew 3–5/6–8; Animals/Vehicles/Nature span 3–12 by difficulty; Space/Curriculum/Cards skew 6–8/9–12. Each item sets explicit `age_min`/`age_max`.

### Assets
Placeholders are **locally generated/neutral** (branded placeholder component or simple shapes) — **no copyrighted or competitor assets**. `is_placeholder=true` until a real asset exists. Hero items may ship simple original demo art.

## 8. Migration & file plan
- `supabase/migrations/0001_init.sql` — extensions (`pgcrypto`), enums, tables, constraints, indexes.
- `supabase/migrations/0002_rls.sql` — enable RLS + policies.
- `supabase/migrations/0003_storage.sql` — buckets + storage policies (or via dashboard/CLI, documented in `09`).
- `supabase/migrations/0004_retention.sql` — retention purge function + schedule (see §9).
- `supabase/seed.sql` — categories, items, steps, **generated from `src/content` (source of truth)** via `scripts/generate-seed.ts` (or a documented TODO until the script exists). Do not hand-edit.
- TS types in `src/types` mirror tables/enums and are the client contract.

## 9. Data retention (V1)

Anonymous user data is **not kept indefinitely.** Default retention is **30 days** (configurable), chosen as a privacy-protective default for a kids' product with no login.

**What is purged after the retention window** (based on `created_at`):
- `uploaded_images` rows **and** their objects in the `user-uploads` bucket.
- `ai_generations` rows **and** their objects in the `ai-generations` bucket (including `output_image_url`, `line_art_url`, `sketch_url`, `cartoon_url`, `coloring_page_url`).
- Original prompts / safe prompts stored on those `ai_generations` rows are removed with the row.

**What is retained:** `drawing_categories` / `drawing_items` / `drawing_steps` (content, not user data). `anonymous_sessions` may be kept (or trimmed by `last_seen_at`) since it holds no PII; `error_message` is server-side only and purged with its row.

**Mechanism:** a scheduled purge (Postgres `pg_cron` job, or a scheduled Edge Function) deletes expired rows and their storage objects. The window is configurable via the `DATA_RETENTION_DAYS` env (default `30`); a value of `0`/unset can disable purging in dev. Documented operationally in `09-deployment-runbook.md`; surfaced to stakeholders in `10-handoff.md`.

> No deletion is destructive to content; only anonymous user uploads/generations age out. If a product reason later requires longer history (e.g., user-visible creation history that should persist), adjust `DATA_RETENTION_DAYS` and update this section + the brief.
