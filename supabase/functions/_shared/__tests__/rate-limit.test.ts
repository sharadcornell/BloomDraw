// Rate limiting + global cap (docs/08 §2): mock unlimited, per-device before
// global, child-safe codes. Pure evaluator + injected-counter wiring.
import { checkRateLimit, evaluateRateLimit, type CheckDeps } from '../rate-limit.ts';
import type { AiConfig } from '../ai-provider/config.ts';

function cfg(over: Partial<AiConfig> = {}): AiConfig {
  return {
    provider: 'openai',
    mockMode: false,
    useMock: false,
    hasOpenAIKey: true,
    hasReplicateKey: false,
    models: { moderation: 'm', rewrite: 'r', image: 'i', replicateImage: 'ri' },
    rateLimit: { enabled: true, perDay: 5, globalDaily: 10, windowHours: 24, spendCapUsd: null },
    providerTimeoutMs: 25000,
    ...over,
  } as AiConfig;
}

describe('evaluateRateLimit (pure)', () => {
  const base = {
    enabled: true,
    mockMode: false,
    hasDeviceId: true,
    perDeviceCount: 0,
    perDeviceLimit: 5,
    globalCount: 0,
    globalLimit: 10,
  };

  it('mock mode is always unlimited', () => {
    expect(evaluateRateLimit({ ...base, mockMode: true, perDeviceCount: 999, globalCount: 999 })).toEqual({
      allowed: true,
    });
  });

  it('disabled limiter allows everything', () => {
    expect(evaluateRateLimit({ ...base, enabled: false, perDeviceCount: 999 })).toEqual({ allowed: true });
  });

  it('requires a device id in real mode', () => {
    expect(evaluateRateLimit({ ...base, hasDeviceId: false })).toEqual({
      allowed: false,
      code: 'invalid_input',
    });
  });

  it('blocks on the per-device cap', () => {
    expect(evaluateRateLimit({ ...base, perDeviceCount: 5 })).toEqual({ allowed: false, code: 'rate_limited' });
  });

  it('blocks on the global cap when per-device is under', () => {
    expect(evaluateRateLimit({ ...base, perDeviceCount: 1, globalCount: 10 })).toEqual({
      allowed: false,
      code: 'global_limit_reached',
    });
  });

  it('checks per-device BEFORE global', () => {
    expect(evaluateRateLimit({ ...base, perDeviceCount: 5, globalCount: 10 })).toEqual({
      allowed: false,
      code: 'rate_limited',
    });
  });

  it('allows when both are under their caps', () => {
    expect(evaluateRateLimit({ ...base, perDeviceCount: 4, globalCount: 9 })).toEqual({ allowed: true });
  });
});

describe('checkRateLimit (wired to counters)', () => {
  const deps = (over: Partial<CheckDeps>): CheckDeps => ({
    cfg: cfg(),
    hasDeviceId: true,
    countsAvailable: true,
    getPerDeviceCount: async () => 0,
    getGlobalCount: async () => 0,
    ...over,
  });

  it('is unlimited in mock mode (counters not consulted)', async () => {
    let called = false;
    const d = deps({
      cfg: cfg({ useMock: true }),
      getPerDeviceCount: async () => {
        called = true;
        return 999;
      },
    });
    await expect(checkRateLimit(d)).resolves.toEqual({ allowed: true });
    expect(called).toBe(false);
  });

  it('rejects when no device id in real mode', async () => {
    await expect(checkRateLimit(deps({ hasDeviceId: false }))).resolves.toEqual({
      allowed: false,
      code: 'invalid_input',
    });
  });

  it('allows (cannot enforce) when counts are unavailable', async () => {
    await expect(checkRateLimit(deps({ countsAvailable: false }))).resolves.toEqual({ allowed: true });
  });

  it('returns rate_limited and does NOT fetch the global count', async () => {
    let globalCalled = false;
    const d = deps({
      getPerDeviceCount: async () => 5,
      getGlobalCount: async () => {
        globalCalled = true;
        return 0;
      },
    });
    await expect(checkRateLimit(d)).resolves.toEqual({ allowed: false, code: 'rate_limited' });
    expect(globalCalled).toBe(false);
  });

  it('returns global_limit_reached when per-device passes but global is hit', async () => {
    const d = deps({ getPerDeviceCount: async () => 1, getGlobalCount: async () => 10 });
    await expect(checkRateLimit(d)).resolves.toEqual({ allowed: false, code: 'global_limit_reached' });
  });
});
