// Provider factory (docs/03 §7). The four Edge Functions call getProvider() and
// never a vendor directly. Selection:
//   - AI_MOCK_MODE=true (default) OR AI_PROVIDER=mock OR the selected provider's
//     key is missing → MockProvider (always works, demo:true).
//   - else AI_PROVIDER picks openai (default) | replicate.
import { loadAiConfig } from './config.ts';
import { MockProvider } from './mock.ts';
import { OpenAIProvider } from './openai.ts';
import { ReplicateProvider } from './replicate.ts';
import type { AIProvider } from '../types.ts';

export function getProvider(): AIProvider {
  const cfg = loadAiConfig();
  if (cfg.useMock) {
    if (!cfg.mockMode && cfg.provider !== 'mock') {
      // Real mode requested but the key is missing — fail safe to Mock + warn.
      console.warn(`[ai] provider "${cfg.provider}" selected but its key is missing — falling back to Mock`);
    }
    return new MockProvider();
  }
  if (cfg.provider === 'replicate') return new ReplicateProvider();
  return new OpenAIProvider();
}

export { MockProvider } from './mock.ts';
export { OpenAIProvider } from './openai.ts';
export { ReplicateProvider } from './replicate.ts';
export { loadAiConfig } from './config.ts';
