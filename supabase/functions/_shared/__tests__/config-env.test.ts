// Env + config parsing (docs/08 §2 model-ID config): model IDs resolve from
// env with documented defaults (never hardcoded literals), limits parse, and the
// mock-fallback decision is correct.
import { getBool, getInt, getNumberOrNull } from '../env.ts';
import { DEFAULT_MODELS, loadAiConfig } from '../ai-provider/config.ts';

const SAVED = { ...process.env };
function resetEnv() {
  for (const k of Object.keys(process.env)) if (!(k in SAVED)) delete process.env[k];
  Object.assign(process.env, SAVED);
}
beforeEach(resetEnv);
afterEach(resetEnv);

describe('env helpers', () => {
  it('parses booleans, ints and optional numbers', () => {
    process.env.T_BOOL = 'true';
    process.env.T_INT = '7';
    process.env.T_NUM = '12.5';
    expect(getBool('T_BOOL', false)).toBe(true);
    expect(getBool('T_MISSING', true)).toBe(true);
    expect(getInt('T_INT', 0)).toBe(7);
    expect(getInt('T_MISSING', 3)).toBe(3);
    expect(getNumberOrNull('T_NUM')).toBe(12.5);
    expect(getNumberOrNull('T_MISSING')).toBeNull();
  });
});

describe('loadAiConfig', () => {
  it('uses documented defaults with no env', () => {
    const cfg = loadAiConfig();
    expect(cfg.provider).toBe('openai');
    expect(cfg.mockMode).toBe(true);
    expect(cfg.useMock).toBe(true);
    expect(cfg.models.moderation).toBe(DEFAULT_MODELS.openaiModeration);
    expect(cfg.models.image).toBe(DEFAULT_MODELS.openaiImage);
    expect(cfg.rateLimit).toEqual({
      enabled: true,
      perDay: 50,
      globalDaily: 500,
      windowHours: 24,
      spendCapUsd: null,
    });
  });

  it('reads model IDs from env (config, not code)', () => {
    process.env.OPENAI_IMAGE_MODEL = 'custom-image-id';
    process.env.OPENAI_MODERATION_MODEL = 'custom-mod-id';
    process.env.REPLICATE_IMAGE_MODEL = 'org/custom-flux';
    const cfg = loadAiConfig();
    expect(cfg.models.image).toBe('custom-image-id');
    expect(cfg.models.moderation).toBe('custom-mod-id');
    expect(cfg.models.replicateImage).toBe('org/custom-flux');
  });

  it('reads rate-limit knobs + spend cap from env', () => {
    process.env.AI_RATE_LIMIT_PER_DAY = '3';
    process.env.AI_GLOBAL_DAILY_LIMIT = '10';
    process.env.AI_LIMIT_WINDOW_HOURS = '6';
    process.env.AI_GLOBAL_DAILY_SPEND_CAP_USD = '25';
    const cfg = loadAiConfig();
    expect(cfg.rateLimit.perDay).toBe(3);
    expect(cfg.rateLimit.globalDaily).toBe(10);
    expect(cfg.rateLimit.windowHours).toBe(6);
    expect(cfg.rateLimit.spendCapUsd).toBe(25);
  });

  it('stays in mock when real mode is on but the key is missing', () => {
    process.env.AI_MOCK_MODE = 'false';
    process.env.AI_PROVIDER = 'openai';
    delete process.env.OPENAI_API_KEY;
    expect(loadAiConfig().useMock).toBe(true);
  });

  it('leaves mock when real mode is on and the key is present', () => {
    process.env.AI_MOCK_MODE = 'false';
    process.env.AI_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'sk-test';
    const cfg = loadAiConfig();
    expect(cfg.useMock).toBe(false);
    expect(cfg.hasOpenAIKey).toBe(true);
  });
});
