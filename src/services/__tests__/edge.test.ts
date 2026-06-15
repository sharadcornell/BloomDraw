/// <reference types="jest" />

// edge.ts imports the session service → AsyncStorage native module is null in Jest.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import { EdgeError, generateImage, moderatePrompt, toEdgeError } from '@/services/edge';
import { strings } from '@/lib/strings';

// With no EXPO_PUBLIC_SUPABASE_URL in the test env, the Supabase client is null,
// so the edge service short-circuits to the local demo mock (docs/05 §10).
describe('edge service fallback (Supabase unconfigured)', () => {
  it('moderates locally and returns a safe result', async () => {
    const r = await moderatePrompt({ prompt: 'cute cat', ageRange: '6-8' });
    expect(r.status).toBe('safe');
    expect(r.safePrompt).toBe('cute cat');
  });

  it('blocks a clearly-unsafe prompt locally', async () => {
    const r = await moderatePrompt({ prompt: 'naked people' });
    expect(r.status).toBe('blocked');
    expect(r.userMessage).toBe(strings.safety.blocked);
  });

  it('generates a demo image + line art with no keys', async () => {
    const g = await generateImage({ safePrompt: 'cute cat' });
    expect(g.demo).toBe(true);
    expect(g.provider).toBe('mock');
    expect(g.imageUrl.startsWith('data:image/svg+xml')).toBe(true);
    expect(g.lineArtUrl).toBeTruthy();
  });
});

describe('EdgeError normalization', () => {
  it('passes an EdgeError through and wraps unknown values as generic', () => {
    const e = new EdgeError('rate_limited', strings.errors.rateLimit, true);
    expect(toEdgeError(e)).toBe(e);
    const wrapped = toEdgeError(new Error('raw provider detail'));
    expect(wrapped.code).toBe('internal');
    expect(wrapped.userMessage).toBe(strings.errors.generic);
  });
});
