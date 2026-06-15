// Shared request handler wrapper (docs/05 §1). Each function does:
//   Deno.serve(makeHandler(core))
// and `core` returns the success envelope/body. This wrapper centralizes:
//   - CORS preflight (OPTIONS) + method guard,
//   - try/catch → child-safe error envelope with the right HTTP status,
//   - server-side-only diagnostic logging (never leaked to the child).
import { preflightResponse } from './cors.ts';
import { AppError } from './errors.ts';
import { envelopeFromError, jsonResponse, statusForEnvelope } from './response.ts';

export interface CoreResult {
  status?: number;
  body: unknown;
}

export type Core = (req: Request) => Promise<CoreResult>;

export function makeHandler(core: Core): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return preflightResponse();
    if (req.method !== 'POST') {
      const env = envelopeFromError(new AppError('invalid_input', `method ${req.method} not allowed`));
      return jsonResponse(env, 405);
    }
    try {
      const { status, body } = await core(req);
      return jsonResponse(body, status ?? 200);
    } catch (err) {
      const env = envelopeFromError(err);
      // Server-side diagnostics ONLY — provider text / detail never reaches the child.
      const detail = err instanceof AppError ? err.logDetail : err instanceof Error ? err.message : String(err);
      console.error(`[ai] error code=${env.error.code} detail=${detail ?? ''}`);
      return jsonResponse(env, statusForEnvelope(env));
    }
  };
}
