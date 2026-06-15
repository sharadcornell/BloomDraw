// Child-safe error model (docs/05 §9).
//
// Every failure maps to ONE of these codes → a fixed, child-safe `userMessage`
// (from the shared strings) + a `retryable` flag. Provider error text, status
// codes, stack traces and moderation categories are logged server-side ONLY and
// never placed in the response body.
import { strings } from './strings.ts';

export const ERROR_CODES = [
  'invalid_input',
  'blocked_prompt',
  'provider_unavailable',
  'rate_limited',
  'global_limit_reached',
  'storage_error',
  'internal',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

const RETRYABLE: Record<ErrorCode, boolean> = {
  invalid_input: false,
  blocked_prompt: false,
  provider_unavailable: true,
  rate_limited: true,
  global_limit_reached: true,
  storage_error: true,
  internal: true,
};

const USER_MESSAGE: Record<ErrorCode, string> = {
  invalid_input: strings.errors.invalidInput,
  blocked_prompt: strings.safety.blocked,
  provider_unavailable: strings.errors.aiNap,
  rate_limited: strings.errors.rateLimit,
  global_limit_reached: strings.errors.aiResting,
  storage_error: strings.errors.storage,
  internal: strings.errors.generic,
};

/** HTTP status for each error code (used by the request handler). */
const HTTP_STATUS: Record<ErrorCode, number> = {
  invalid_input: 400,
  blocked_prompt: 400,
  provider_unavailable: 503,
  rate_limited: 429,
  global_limit_reached: 429,
  storage_error: 500,
  internal: 500,
};

export interface ErrorBody {
  code: ErrorCode;
  userMessage: string;
  retryable: boolean;
}

export function userMessageFor(code: ErrorCode): string {
  return USER_MESSAGE[code];
}

export function isRetryable(code: ErrorCode): boolean {
  return RETRYABLE[code];
}

export function httpStatusFor(code: ErrorCode): number {
  return HTTP_STATUS[code];
}

export function errorBody(code: ErrorCode, overrideMessage?: string): ErrorBody {
  return { code, userMessage: overrideMessage ?? USER_MESSAGE[code], retryable: RETRYABLE[code] };
}

/**
 * Typed error thrown across the Edge Function call. `logDetail` carries the
 * server-only diagnostic (provider text/status) and is NEVER sent to the child.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly userMessage: string;
  readonly retryable: boolean;
  readonly logDetail?: string;

  constructor(code: ErrorCode, logDetail?: string, overrideMessage?: string) {
    super(logDetail ?? code);
    this.name = 'AppError';
    this.code = code;
    this.userMessage = overrideMessage ?? USER_MESSAGE[code];
    this.retryable = RETRYABLE[code];
    this.logDetail = logDetail;
  }
}
