// Shared server-side types for the BloomDraw Edge Functions (docs/03 §7, docs/05 §1).
//
// These are the API/provider-facing types. They use the NARROW, client-visible
// status subsets (no `pending`) — the DB-row unions that include `pending`/
// `processing` live in src/types/db.ts.

export type AgeRange = '3-5' | '6-8' | '9-12';

export type TransformStyle = 'line_art' | 'sketch' | 'cartoon' | 'coloring_page';
export const TRANSFORM_STYLES: readonly TransformStyle[] = [
  'line_art',
  'sketch',
  'cartoon',
  'coloring_page',
];

/** Terminal moderation result the client receives (never `pending`). */
export type ModerationStatus = 'safe' | 'rewritten' | 'blocked';

/** Generation status the client receives. `processing` is reserved for the
 *  future async/polling path (docs/05 §12); V1 returns `complete`/`failed`. */
export type GenerationStatus = 'processing' | 'complete' | 'failed';

export type ProviderName = 'openai' | 'replicate' | 'mock';

/** Internal style hint for image generation (not the upload TransformStyle). */
export type ImageStyleHint = 'illustration' | 'line_art' | 'projection';

export interface ModerationResult {
  status: ModerationStatus;
  /** Original (safe), rewritten (rewritten), or '' (blocked). */
  safePrompt: string;
  /** Child-safe copy; '' when safe. */
  userMessage: string;
  /** Server-side reason code (e.g. 'ok', 'rewrite_softened', 'violence'). */
  reasonCode: string;
}

export interface ImageResult {
  imageUrl: string;
  provider: ProviderName;
  meta?: Record<string, unknown>;
}

export interface GenerateOptions {
  ageRange?: AgeRange;
  style?: ImageStyleHint;
  size?: string;
}

/**
 * Provider abstraction (docs/03 §7). The four Edge Functions only ever talk to
 * an AIProvider — never a vendor SDK directly — so swapping providers is an env
 * change with no contract impact.
 */
export interface AIProvider {
  readonly name: ProviderName;
  /** true → responses carry `demo:true` and the app shows the Demo-mode badge. */
  readonly isMock: boolean;

  moderatePrompt(prompt: string, ageRange?: AgeRange): Promise<ModerationResult>;
  rewritePromptForKidSafety(prompt: string, ageRange?: AgeRange): Promise<string>;
  generateImage(prompt: string, options?: GenerateOptions): Promise<ImageResult>;
  transformImage(imageUrl: string, style: TransformStyle): Promise<ImageResult>;
  generateLineArt(imageUrl: string): Promise<ImageResult>;
  generateSketch(imageUrl: string): Promise<ImageResult>;
  generateCartoon(imageUrl: string): Promise<ImageResult>;
  generateColoringPage(imageUrl: string): Promise<ImageResult>;
}
