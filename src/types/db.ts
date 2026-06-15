/**
 * Supabase DB-row types — mirror the Postgres schema (docs/04-database-schema.md)
 * in snake_case, INCLUDING transient `pending`/`processing` statuses.
 *
 * Kept separate from the app/API types in `index.ts` (which use camelCase + the
 * narrower client-visible status subsets — see docs/05 §1).
 */

// --- Enums (match supabase/migrations/0001_init.sql) ---
export type DbDifficulty = 'easy' | 'medium' | 'hard';
export type DbAgeRange = '3-5' | '6-8' | '9-12';
export type AiInputType = 'prompt';
export type ModerationStatusRow = 'safe' | 'rewritten' | 'blocked' | 'pending';
export type GenerationStatusRow = 'pending' | 'processing' | 'complete' | 'failed';
export type ProcessedStatusRow = 'pending' | 'processing' | 'complete' | 'failed';

// --- Row shapes ---
export type DrawingCategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  created_at: string;
};

export type DrawingItemRow = {
  id: string;
  category_id: string;
  title: string;
  slug: string;
  description: string | null;
  age_min: number;
  age_max: number;
  difficulty: DbDifficulty;
  thumbnail_url: string | null;
  final_image_url: string | null;
  trace_image_url: string | null;
  is_featured: boolean;
  is_placeholder: boolean;
  created_at: string;
};

export type DrawingStepRow = {
  id: string;
  drawing_item_id: string;
  step_number: number;
  title: string | null;
  instruction: string;
  image_url: string | null;
  created_at: string;
};

export type AnonymousSessionRow = {
  id: string;
  device_id: string;
  selected_age_range: DbAgeRange | null;
  created_at: string;
  last_seen_at: string;
};

export type AiGenerationRow = {
  id: string;
  anonymous_session_id: string | null;
  input_type: AiInputType;
  original_prompt: string;
  safe_prompt: string | null;
  moderation_status: ModerationStatusRow;
  generation_status: GenerationStatusRow;
  provider: string | null;
  output_image_url: string | null;
  line_art_url: string | null;
  sketch_url: string | null;
  cartoon_url: string | null;
  coloring_page_url: string | null;
  error_message: string | null;
  created_at: string;
};

export type UploadedImageRow = {
  id: string;
  anonymous_session_id: string | null;
  original_image_url: string;
  processed_status: ProcessedStatusRow;
  line_art_url: string | null;
  sketch_url: string | null;
  cartoon_url: string | null;
  coloring_page_url: string | null;
  created_at: string;
};

/** Minimal `Database` generic for typing the supabase-js client. */
type TableShape<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      drawing_categories: TableShape<DrawingCategoryRow>;
      drawing_items: TableShape<DrawingItemRow>;
      drawing_steps: TableShape<DrawingStepRow>;
      anonymous_sessions: TableShape<AnonymousSessionRow>;
      ai_generations: TableShape<AiGenerationRow>;
      uploaded_images: TableShape<UploadedImageRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      difficulty_level: DbDifficulty;
      age_range: DbAgeRange;
      ai_input_type: AiInputType;
      moderation_status: ModerationStatusRow;
      generation_status: GenerationStatusRow;
      processed_status: ProcessedStatusRow;
    };
  };
};
