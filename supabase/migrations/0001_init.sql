-- BloomDraw — initial schema (docs/04-database-schema.md)
-- Extensions, enums, tables, constraints, indexes. No PII; anonymous identity
-- is device_id only.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type difficulty_level as enum ('easy', 'medium', 'hard');
create type age_range as enum ('3-5', '6-8', '9-12');
create type ai_input_type as enum ('prompt');
create type moderation_status as enum ('safe', 'rewritten', 'blocked', 'pending');
create type generation_status as enum ('pending', 'processing', 'complete', 'failed');
create type processed_status as enum ('pending', 'processing', 'complete', 'failed');

-- ---------------------------------------------------------------------------
-- Content tables
-- ---------------------------------------------------------------------------
create table drawing_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  icon        text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table drawing_items (
  id              uuid primary key default gen_random_uuid(),
  category_id     uuid not null references drawing_categories (id) on delete cascade,
  title           text not null,
  slug            text not null unique,
  description     text,
  age_min         int not null,
  age_max         int not null,
  difficulty      difficulty_level not null,
  thumbnail_url   text,
  final_image_url text,
  trace_image_url text,
  is_featured     boolean not null default false,
  is_placeholder  boolean not null default true,
  created_at      timestamptz not null default now(),
  constraint drawing_items_age_min_chk check (age_min between 3 and 12),
  constraint drawing_items_age_max_chk check (age_max between 3 and 12),
  constraint drawing_items_age_order_chk check (age_max >= age_min)
);

create table drawing_steps (
  id              uuid primary key default gen_random_uuid(),
  drawing_item_id uuid not null references drawing_items (id) on delete cascade,
  step_number     int not null,
  title           text,
  instruction     text not null,
  image_url       text,
  created_at      timestamptz not null default now(),
  constraint drawing_steps_number_chk check (step_number >= 1),
  unique (drawing_item_id, step_number)
);

-- ---------------------------------------------------------------------------
-- Anonymous activity tables (no PII)
-- ---------------------------------------------------------------------------
create table anonymous_sessions (
  id                 uuid primary key default gen_random_uuid(),
  device_id          text not null unique,
  selected_age_range age_range,
  created_at         timestamptz not null default now(),
  last_seen_at       timestamptz not null default now()
);

create table ai_generations (
  id                   uuid primary key default gen_random_uuid(),
  anonymous_session_id uuid references anonymous_sessions (id) on delete set null,
  input_type           ai_input_type not null default 'prompt',
  original_prompt      text not null,
  safe_prompt          text,
  moderation_status    moderation_status not null default 'pending',
  generation_status    generation_status not null default 'pending',
  provider             text,
  output_image_url     text,
  line_art_url         text,
  sketch_url           text,   -- future-use (AI-prompt style variants); see docs/04 §2.5
  cartoon_url          text,   -- future-use
  coloring_page_url    text,   -- future-use
  error_message        text,   -- server-side only; never returned to the child
  created_at           timestamptz not null default now()
);

create table uploaded_images (
  id                   uuid primary key default gen_random_uuid(),
  anonymous_session_id uuid references anonymous_sessions (id) on delete set null,
  original_image_url   text not null,
  processed_status     processed_status not null default 'pending',
  line_art_url         text,
  sketch_url           text,
  cartoon_url          text,
  coloring_page_url    text,
  created_at           timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index drawing_items_category_idx on drawing_items (category_id);
create index drawing_items_featured_idx on drawing_items (is_featured) where is_featured;
create index drawing_items_difficulty_idx on drawing_items (difficulty);
create index drawing_items_age_idx on drawing_items (age_min, age_max);
create index drawing_steps_item_idx on drawing_steps (drawing_item_id, step_number);
create index ai_generations_session_idx on ai_generations (anonymous_session_id, created_at desc);
create index uploaded_images_session_idx on uploaded_images (anonymous_session_id, created_at desc);
