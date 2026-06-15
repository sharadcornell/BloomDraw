// Provider + model configuration (docs/03 §7, docs/09 §5).
//
// Model IDs are CONFIG, NOT CODE: they come from env with documented defaults in
// ONE place — never scattered as string literals. Verify the exact current IDs
// at real-key setup time (brief open question #1); the defaults below are
// reasonable starting points and must be confirmed before the real-key pilot.
import { getBool, getEnv, getInt, getNumberOrNull } from '../env.ts';
import type { ProviderName } from '../types.ts';

/** Documented default model IDs (overridable via env). Verify before pilot. */
export const DEFAULT_MODELS = {
  openaiModeration: 'omni-moderation-latest',
  openaiRewrite: 'gpt-4o-mini',
  openaiImage: 'gpt-image-1',
  replicateImage: 'black-forest-labs/flux-schnell',
} as const;

/** Default upstream-call timeout (below the Edge platform wall-clock limit). */
const DEFAULT_PROVIDER_TIMEOUT_MS = 25_000;

export interface RateLimitConfig {
  enabled: boolean;
  perDay: number;
  globalDaily: number;
  windowHours: number;
  /** Optional dollar ceiling — provider-budget integration (count cap first). */
  spendCapUsd: number | null;
}

export interface AiConfig {
  provider: ProviderName;
  /** AI_MOCK_MODE — master switch (default true). */
  mockMode: boolean;
  /** Effective decision: use Mock if mockMode OR the selected provider key is missing. */
  useMock: boolean;
  hasOpenAIKey: boolean;
  hasReplicateKey: boolean;
  models: {
    moderation: string;
    rewrite: string;
    image: string;
    replicateImage: string;
  };
  rateLimit: RateLimitConfig;
  providerTimeoutMs: number;
}

function resolveProvider(): ProviderName {
  const raw = (getEnv('AI_PROVIDER') ?? 'openai').toLowerCase();
  if (raw === 'replicate') return 'replicate';
  if (raw === 'mock') return 'mock';
  return 'openai';
}

/** Read the AI configuration from env (lazy — evaluated per call so tests and
 *  per-request env changes are reflected). */
export function loadAiConfig(): AiConfig {
  const provider = resolveProvider();
  const mockMode = getBool('AI_MOCK_MODE', true);
  const hasOpenAIKey = Boolean(getEnv('OPENAI_API_KEY'));
  const hasReplicateKey = Boolean(getEnv('REPLICATE_API_TOKEN'));

  const selectedKeyPresent =
    provider === 'openai' ? hasOpenAIKey : provider === 'replicate' ? hasReplicateKey : false;

  // Mock when explicitly forced, when provider === 'mock', or when the selected
  // real provider has no key (fail-safe — never call a vendor without a key).
  const useMock = mockMode || provider === 'mock' || !selectedKeyPresent;

  return {
    provider,
    mockMode,
    useMock,
    hasOpenAIKey,
    hasReplicateKey,
    models: {
      moderation: getEnv('OPENAI_MODERATION_MODEL') ?? DEFAULT_MODELS.openaiModeration,
      rewrite: getEnv('OPENAI_REWRITE_MODEL') ?? DEFAULT_MODELS.openaiRewrite,
      image: getEnv('OPENAI_IMAGE_MODEL') ?? DEFAULT_MODELS.openaiImage,
      replicateImage: getEnv('REPLICATE_IMAGE_MODEL') ?? DEFAULT_MODELS.replicateImage,
    },
    rateLimit: {
      enabled: getBool('AI_RATE_LIMIT_ENABLED', true),
      perDay: getInt('AI_RATE_LIMIT_PER_DAY', 50),
      globalDaily: getInt('AI_GLOBAL_DAILY_LIMIT', 500),
      windowHours: getInt('AI_LIMIT_WINDOW_HOURS', 24),
      spendCapUsd: getNumberOrNull('AI_GLOBAL_DAILY_SPEND_CAP_USD'),
    },
    providerTimeoutMs: getInt('AI_PROVIDER_TIMEOUT_MS', DEFAULT_PROVIDER_TIMEOUT_MS),
  };
}
