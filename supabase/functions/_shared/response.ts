// Response envelopes (docs/05 §1). Success: { ok:true, data }. Error (child-safe):
// { ok:false, error:{ code, userMessage, retryable } }.
//
// Envelope builders are pure (no `Response`) so they are unit-testable; only
// `jsonResponse` touches the web `Response` global (Deno/runtime path).
import { corsHeaders } from './cors.ts';
import { AppError, errorBody, httpStatusFor, type ErrorBody, type ErrorCode } from './errors.ts';

export interface OkEnvelope<T> {
  ok: true;
  data: T;
}

export interface ErrEnvelope {
  ok: false;
  error: ErrorBody;
}

export function okEnvelope<T>(data: T): OkEnvelope<T> {
  return { ok: true, data };
}

export function errEnvelope(code: ErrorCode, overrideMessage?: string): ErrEnvelope {
  return { ok: false, error: errorBody(code, overrideMessage) };
}

/** Map any thrown value to a child-safe error envelope (defaults to `internal`). */
export function envelopeFromError(err: unknown): ErrEnvelope {
  if (err instanceof AppError) {
    return { ok: false, error: { code: err.code, userMessage: err.userMessage, retryable: err.retryable } };
  }
  return errEnvelope('internal');
}

/** HTTP status to use for an error envelope. */
export function statusForEnvelope(env: ErrEnvelope): number {
  return httpStatusFor(env.error.code);
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
