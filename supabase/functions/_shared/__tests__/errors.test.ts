// Error map + envelopes (docs/08 §2 edge error map + API envelope shape).
import {
  AppError,
  ERROR_CODES,
  errorBody,
  httpStatusFor,
  isRetryable,
  userMessageFor,
} from '../errors.ts';
import { envelopeFromError, errEnvelope, okEnvelope, statusForEnvelope } from '../response.ts';
import { strings } from '../strings.ts';

const EXPECTED: Record<string, { message: string; retryable: boolean; status: number }> = {
  invalid_input: { message: strings.errors.invalidInput, retryable: false, status: 400 },
  blocked_prompt: { message: strings.safety.blocked, retryable: false, status: 400 },
  provider_unavailable: { message: strings.errors.aiNap, retryable: true, status: 503 },
  rate_limited: { message: strings.errors.rateLimit, retryable: true, status: 429 },
  global_limit_reached: { message: strings.errors.aiResting, retryable: true, status: 429 },
  storage_error: { message: strings.errors.storage, retryable: true, status: 500 },
  internal: { message: strings.errors.generic, retryable: true, status: 500 },
};

describe('error code → child-safe message map', () => {
  it('covers every code with the right message, retryable + status', () => {
    for (const code of ERROR_CODES) {
      const exp = EXPECTED[code];
      expect(userMessageFor(code)).toBe(exp.message);
      expect(isRetryable(code)).toBe(exp.retryable);
      expect(httpStatusFor(code)).toBe(exp.status);
      expect(errorBody(code)).toEqual({ code, userMessage: exp.message, retryable: exp.retryable });
    }
  });

  it('never leaks raw moderation/provider detail into the body', () => {
    const env = envelopeFromError(new AppError('blocked_prompt', 'reason=violence category=gore'));
    expect(JSON.stringify(env)).not.toMatch(/violence|gore|reason=/);
  });
});

describe('envelopes', () => {
  it('builds the success envelope shape', () => {
    expect(okEnvelope({ imageUrl: 'x' })).toEqual({ ok: true, data: { imageUrl: 'x' } });
  });

  it('builds child-safe error envelopes from codes and thrown AppErrors', () => {
    expect(errEnvelope('rate_limited')).toEqual({
      ok: false,
      error: { code: 'rate_limited', userMessage: strings.errors.rateLimit, retryable: true },
    });
    const fromApp = envelopeFromError(new AppError('global_limit_reached'));
    expect(fromApp).toEqual({
      ok: false,
      error: { code: 'global_limit_reached', userMessage: strings.errors.aiResting, retryable: true },
    });
  });

  it('maps an unknown thrown value to internal', () => {
    const env = envelopeFromError(new Error('kaboom'));
    expect(env.error.code).toBe('internal');
    expect(statusForEnvelope(env)).toBe(500);
  });
});
