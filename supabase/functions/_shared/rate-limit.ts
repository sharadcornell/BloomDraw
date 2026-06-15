// AI rate limiting & global cap (docs/03 §11, docs/05 §11).
//
// Two layers, REAL MODE ONLY (mock is always unlimited — no external calls/cost):
//   (a) per-device/session count over a rolling window  → `rate_limited`
//   (b) global daily request-count cap across all devices → `global_limit_reached`
// Order: per-device FIRST, then global. The pure `evaluateRateLimit` holds the
// decision logic (fully unit-testable); `checkRateLimit` wires it to injected
// async counters so the DB layer stays separate (and Deno-only).
//
// Spend cap: `AI_GLOBAL_DAILY_SPEND_CAP_USD` is a provider-budget integration to
// wire up before the real-key pilot — V1 enforces the request-count cap first
// (docs/05 §11b). It is carried in config and documented, not enforced here.
import type { AiConfig } from './ai-provider/config.ts';

export type LimitCode = 'rate_limited' | 'global_limit_reached' | 'invalid_input';
export type LimitDecision = { allowed: true } | { allowed: false; code: LimitCode };

export interface EvaluateInput {
  enabled: boolean;
  mockMode: boolean;
  hasDeviceId: boolean;
  perDeviceCount: number;
  perDeviceLimit: number;
  globalCount: number;
  globalLimit: number;
}

/** Pure decision: which (if any) limit blocks this request. */
export function evaluateRateLimit(i: EvaluateInput): LimitDecision {
  if (i.mockMode) return { allowed: true }; // mock is never limited
  if (!i.enabled) return { allowed: true };
  if (!i.hasDeviceId) return { allowed: false, code: 'invalid_input' };
  if (i.perDeviceLimit > 0 && i.perDeviceCount >= i.perDeviceLimit) {
    return { allowed: false, code: 'rate_limited' };
  }
  if (i.globalLimit > 0 && i.globalCount >= i.globalLimit) {
    return { allowed: false, code: 'global_limit_reached' };
  }
  return { allowed: true };
}

export interface CheckDeps {
  cfg: AiConfig;
  hasDeviceId: boolean;
  /** Whether per-device/global counts can actually be read (Supabase configured). */
  countsAvailable: boolean;
  getPerDeviceCount: () => Promise<number>;
  getGlobalCount: () => Promise<number>;
}

/**
 * Enforce both layers. Fetches the global count only if the per-device check
 * passes (per-device first). In real mode without Supabase configured, counts
 * can't be read → allow but warn (cannot enforce; documented limitation).
 */
export async function checkRateLimit(d: CheckDeps): Promise<LimitDecision> {
  const { cfg } = d;
  if (cfg.useMock) return { allowed: true };
  if (!cfg.rateLimit.enabled) return { allowed: true };
  if (!d.hasDeviceId) return { allowed: false, code: 'invalid_input' };
  if (!d.countsAvailable) {
    console.warn('[ai] rate-limit accounting unavailable (Supabase not configured) — cannot enforce; allowing');
    return { allowed: true };
  }

  const perDeviceCount = await d.getPerDeviceCount();
  const perDevice = evaluateRateLimit({
    enabled: true,
    mockMode: false,
    hasDeviceId: true,
    perDeviceCount,
    perDeviceLimit: cfg.rateLimit.perDay,
    globalCount: 0,
    globalLimit: 0,
  });
  if (!perDevice.allowed) return perDevice;

  const globalCount = await d.getGlobalCount();
  return evaluateRateLimit({
    enabled: true,
    mockMode: false,
    hasDeviceId: true,
    perDeviceCount: 0,
    perDeviceLimit: 0,
    globalCount,
    globalLimit: cfg.rateLimit.globalDaily,
  });
}
