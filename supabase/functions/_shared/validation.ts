// Input validation (docs/05 §2–§5). A PRIMARY server-side control (docs/03 §10).
// Every validator throws AppError('invalid_input') with a server-only detail;
// the child only ever sees the mapped child-safe message.
import { AppError } from './errors.ts';
import { TRANSFORM_STYLES, type AgeRange, type TransformStyle } from './types.ts';

const AGE_RANGES: readonly AgeRange[] = ['3-5', '6-8', '9-12'];
const MAX_PROMPT_LEN = 300;

/** Minimal header accessor — structurally satisfied by the web `Headers` type
 *  (Deno) and by a test fake, without depending on a DOM/global type. */
export interface HeaderReader {
  get(name: string): string | null;
}

/** Minimal request body parser — structurally satisfied by the web `Request`. */
export interface JsonReadable {
  json(): Promise<unknown>;
}

export async function parseJsonBody(req: JsonReadable): Promise<Record<string, unknown>> {
  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    throw new AppError('invalid_input', 'request body is not valid JSON');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new AppError('invalid_input', 'request body must be a JSON object');
  }
  return parsed as Record<string, unknown>;
}

export function validatePrompt(value: unknown, field = 'prompt'): string {
  if (typeof value !== 'string') throw new AppError('invalid_input', `${field} must be a string`);
  const trimmed = value.trim();
  if (trimmed.length < 1) throw new AppError('invalid_input', `${field} is empty`);
  if (trimmed.length > MAX_PROMPT_LEN) {
    throw new AppError('invalid_input', `${field} exceeds ${MAX_PROMPT_LEN} chars`);
  }
  return trimmed;
}

export function validateAgeRange(value: unknown): AgeRange | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string' && (AGE_RANGES as readonly string[]).includes(value)) {
    return value as AgeRange;
  }
  throw new AppError('invalid_input', 'invalid ageRange');
}

export function validateStyle(value: unknown): TransformStyle {
  if (typeof value === 'string' && (TRANSFORM_STYLES as readonly string[]).includes(value)) {
    return value as TransformStyle;
  }
  throw new AppError('invalid_input', 'invalid transform style');
}

/** Optional styles[] for process-uploaded-image; defaults to all four, deduped. */
export function validateStyles(value: unknown): TransformStyle[] {
  if (value === undefined || value === null) return [...TRANSFORM_STYLES];
  if (!Array.isArray(value) || value.length === 0) {
    throw new AppError('invalid_input', 'styles must be a non-empty array');
  }
  const seen = new Set<TransformStyle>();
  for (const s of value) seen.add(validateStyle(s));
  return [...seen];
}

export interface ImageSource {
  imageUrl?: string;
  uploadRef?: string;
  /** Stable key for deterministic mock hashing (the url or ref). */
  key: string;
}

/** Exactly one of `imageUrl` | `uploadRef` (docs/05 §4–§5). */
export function validateImageSource(body: { imageUrl?: unknown; uploadRef?: unknown }): ImageSource {
  const hasUrl = typeof body.imageUrl === 'string' && body.imageUrl.trim().length > 0;
  const hasRef = typeof body.uploadRef === 'string' && body.uploadRef.trim().length > 0;
  if (hasUrl === hasRef) {
    throw new AppError('invalid_input', 'provide exactly one of imageUrl | uploadRef');
  }
  if (hasUrl) {
    const url = (body.imageUrl as string).trim();
    return { imageUrl: url, key: url };
  }
  const ref = (body.uploadRef as string).trim();
  return { uploadRef: ref, key: ref };
}

/** Read x-device-id (links rate-limit accounting to anonymous_sessions). */
export function readDeviceId(headers: HeaderReader): string | undefined {
  const v = headers.get('x-device-id');
  if (!v) return undefined;
  const trimmed = v.trim();
  // Basic sanity only (UUIDs are 36 chars). NOT a trust boundary — no auth in V1.
  return trimmed.length >= 8 ? trimmed : undefined;
}
