import { strings } from '@/lib/strings';

import { mockGenerate, mockModerate, mockProcessUpload, mockTransform } from './aiMock';
import { getDeviceId } from './session';
import { supabase } from './supabase';

/**
 * Typed client for the BloomDraw Edge Functions (docs/05 §10).
 *
 * - When Supabase is configured (and FORCE_MOCK is off) → invokes the real
 *   Edge Functions via the anon Supabase client, sending `x-device-id` for
 *   rate-limit accounting. NEVER imports server/Deno code; NEVER touches secrets.
 * - When unconfigured / FORCE_MOCK (`supabase === null`) → returns the local
 *   demo equivalent so every flow stays demoable offline (mirrors server mock).
 * - All failures surface as a typed `EdgeError` carrying ONLY the child-safe
 *   `userMessage` (raw provider/stack/moderation detail never reaches the app).
 */

export type AgeRange = '3-5' | '6-8' | '9-12';
export type ModerationStatus = 'safe' | 'rewritten' | 'blocked';

export interface ModerationData {
  status: ModerationStatus;
  safePrompt: string;
  userMessage: string;
  reasonCode: string;
}

export interface GenerationData {
  generationId?: string | null;
  imageUrl: string;
  lineArtUrl: string | null;
  provider: string;
  status: string;
  demo: boolean;
}

/** Photo-transform styles (docs/05 §4–§5). */
export type TransformStyle = 'line_art' | 'sketch' | 'cartoon' | 'coloring_page';
export const TRANSFORM_STYLES: readonly TransformStyle[] = [
  'line_art',
  'sketch',
  'cartoon',
  'coloring_page',
];

export function isTransformStyle(value: unknown): value is TransformStyle {
  return typeof value === 'string' && (TRANSFORM_STYLES as readonly string[]).includes(value);
}

/** process-uploaded-image response (docs/05 §5). */
export interface ProcessData {
  uploadedImageId?: string | null;
  originalUrl: string;
  lineArtUrl: string | null;
  sketchUrl: string | null;
  cartoonUrl: string | null;
  coloringPageUrl: string | null;
  status: 'complete' | 'partial' | 'failed';
  demo: boolean;
}

/** transform-image response (docs/05 §4). */
export interface TransformData {
  outputImageUrl: string;
  style: TransformStyle;
  provider: string;
  status: string;
  demo: boolean;
}

type Envelope<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; userMessage: string; retryable: boolean } };

/** Child-safe error the UI maps to a friendly state. Holds no diagnostic detail. */
export class EdgeError extends Error {
  readonly code: string;
  readonly userMessage: string;
  readonly retryable: boolean;

  constructor(code: string, userMessage: string, retryable: boolean) {
    super(userMessage);
    this.name = 'EdgeError';
    this.code = code;
    this.userMessage = userMessage;
    this.retryable = retryable;
  }
}

/** Normalize any thrown value to a child-safe EdgeError. */
export function toEdgeError(err: unknown): EdgeError {
  if (err instanceof EdgeError) return err;
  return new EdgeError('internal', strings.errors.generic, true);
}

async function invokeEnvelope<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const client = supabase;
  // Callers branch on `supabase` before reaching here; this is a safety net.
  if (!client) throw new EdgeError('provider_unavailable', strings.errors.aiNap, true);

  const deviceId = await getDeviceId();
  const { data, error } = await client.functions.invoke(name, {
    body,
    headers: { 'x-device-id': deviceId },
  });

  if (error) {
    // Non-2xx → our functions return a child-safe envelope in the response body.
    const ctx = (error as { context?: { json?: () => Promise<unknown> } }).context;
    if (ctx?.json) {
      try {
        const env = (await ctx.json()) as Envelope<T>;
        if (env && env.ok === false && env.error) {
          throw new EdgeError(env.error.code, env.error.userMessage, env.error.retryable);
        }
      } catch (parseErr) {
        if (parseErr instanceof EdgeError) throw parseErr;
        // fall through to the transport mapping below
      }
    }
    // No parseable envelope → transport/network failure (offline, relay, timeout).
    throw new EdgeError('provider_unavailable', strings.errors.aiNap, true);
  }

  const env = data as Envelope<T> | null;
  if (!env || env.ok !== true) {
    if (env && env.ok === false && env.error) {
      throw new EdgeError(env.error.code, env.error.userMessage, env.error.retryable);
    }
    throw new EdgeError('internal', strings.errors.generic, true);
  }
  return env.data;
}

export interface ModerateInput {
  prompt: string;
  ageRange?: AgeRange;
}

export async function moderatePrompt(input: ModerateInput): Promise<ModerationData> {
  if (!supabase) return mockModerate(input.prompt, input.ageRange);
  return invokeEnvelope<ModerationData>('moderate-prompt', {
    prompt: input.prompt,
    ageRange: input.ageRange,
  });
}

export interface GenerateInput {
  safePrompt: string;
  ageRange?: AgeRange;
  options?: { lineArt?: boolean; projectionReady?: boolean; size?: string };
}

export async function generateImage(input: GenerateInput): Promise<GenerationData> {
  if (!supabase) return mockGenerate(input.safePrompt, { lineArt: input.options?.lineArt });
  return invokeEnvelope<GenerationData>('generate-image', {
    safePrompt: input.safePrompt,
    ageRange: input.ageRange,
    options: input.options ?? { lineArt: true },
  });
}

/** Source image: exactly one of `uploadRef` (storage path) or `imageUrl`. */
export interface ImageSourceInput {
  uploadRef?: string;
  imageUrl?: string;
}

export interface ProcessInput extends ImageSourceInput {
  styles?: TransformStyle[];
}

export async function processUploadedImage(input: ProcessInput): Promise<ProcessData> {
  const source = input.uploadRef ?? input.imageUrl ?? '';
  if (!supabase) return mockProcessUpload(source, input.styles);
  return invokeEnvelope<ProcessData>('process-uploaded-image', {
    uploadRef: input.uploadRef,
    imageUrl: input.imageUrl,
    styles: input.styles,
  });
}

export interface TransformInput extends ImageSourceInput {
  style: TransformStyle;
}

export async function transformImage(input: TransformInput): Promise<TransformData> {
  const source = input.uploadRef ?? input.imageUrl ?? '';
  if (!supabase) return mockTransform(source, input.style);
  return invokeEnvelope<TransformData>('transform-image', {
    uploadRef: input.uploadRef,
    imageUrl: input.imageUrl,
    style: input.style,
  });
}
