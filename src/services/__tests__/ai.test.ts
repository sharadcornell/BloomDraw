/// <reference types="jest" />

// The orchestration imports the recents store (via default deps) → AsyncStorage.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import { createAiArt, isValidPrompt, titleFromPrompt, type AiDeps } from '@/services/ai';
import { EdgeError } from '@/services/edge';
import { strings } from '@/lib/strings';

type DepOverrides = Partial<AiDeps>;

function makeDeps(over: DepOverrides = {}) {
  const moderate = jest.fn(async (input: { prompt: string }) => ({
    status: 'safe' as const,
    safePrompt: input.prompt,
    userMessage: '',
    reasonCode: 'ok',
  }));
  const generate = jest.fn(async () => ({
    generationId: 'g1',
    imageUrl: 'https://cdn.test/img.png',
    lineArtUrl: 'https://cdn.test/line.png',
    provider: 'openai',
    status: 'complete',
    demo: false,
  }));
  const added: unknown[] = [];
  const addRecent = jest.fn((input) => {
    const rec = { ...input, id: 'r1', createdAt: 1 };
    added.push(rec);
    return rec;
  });
  const phases: string[] = [];
  const onPhase = jest.fn((p: string) => phases.push(p));
  const onRewrite = jest.fn();
  const deps: AiDeps = { moderate, generate, addRecent, onPhase, onRewrite, ...over };
  return { deps, moderate, generate, addRecent, added, phases, onPhase, onRewrite };
}

describe('prompt validation', () => {
  it('accepts a normal prompt, rejects empty / oversized', () => {
    expect(isValidPrompt('a cat')).toBe(true);
    expect(isValidPrompt('   ')).toBe(false);
    expect(isValidPrompt('x'.repeat(301))).toBe(false);
  });

  it('builds a short friendly title', () => {
    expect(titleFromPrompt('a cute cat')).toBe('A cute cat');
    expect(titleFromPrompt('x'.repeat(50)).endsWith('…')).toBe(true);
  });
});

describe('createAiArt — safe path', () => {
  it('moderates, generates with the safe prompt, and saves a recent', async () => {
    const h = makeDeps();
    const outcome = await createAiArt({ prompt: 'a happy cat', ageRange: '6-8' }, h.deps);

    expect(h.moderate).toHaveBeenCalledWith({ prompt: 'a happy cat', ageRange: '6-8' });
    expect(h.generate).toHaveBeenCalledWith({
      safePrompt: 'a happy cat',
      ageRange: '6-8',
      options: { lineArt: true },
    });
    expect(outcome.status).toBe('done');
    if (outcome.status === 'done') {
      expect(outcome.data.imageUrl).toBe('https://cdn.test/img.png');
      expect(outcome.data.lineArtUrl).toBe('https://cdn.test/line.png');
      expect(outcome.data.rewritten).toBe(false);
      expect(outcome.recent.type).toBe('ai_generation');
      expect(outcome.recent.prompt).toBe('a happy cat');
      // Real (http) result → thumbnail stored for the recents list.
      expect(outcome.recent.thumbnailUrl).toBe('https://cdn.test/img.png');
    }
    expect(h.addRecent).toHaveBeenCalledTimes(1);
    expect(h.phases).toEqual(['moderating', 'generating', 'saving']);
    expect(h.onRewrite).not.toHaveBeenCalled();
  });
});

describe('createAiArt — rewritten path', () => {
  it('uses the safe prompt, flags rewritten, and signals the banner', async () => {
    const h = makeDeps({
      moderate: jest.fn(async () => ({
        status: 'rewritten' as const,
        safePrompt: 'friendly dragon in a magical forest',
        userMessage: strings.safety.rewritten,
        reasonCode: 'rewrite_softened',
      })),
    });
    const outcome = await createAiArt({ prompt: 'dragon fighting with blood' }, h.deps);

    expect(h.onRewrite).toHaveBeenCalledTimes(1);
    expect(h.generate).toHaveBeenCalledWith(
      expect.objectContaining({ safePrompt: 'friendly dragon in a magical forest' }),
    );
    expect(outcome.status).toBe('done');
    if (outcome.status === 'done') {
      expect(outcome.data.rewritten).toBe(true);
      expect(outcome.recent.rewritten).toBe(true);
      expect(outcome.recent.safePrompt).toBe('friendly dragon in a magical forest');
    }
  });
});

describe('createAiArt — blocked path', () => {
  it('returns blocked and does NOT call generate or save', async () => {
    const h = makeDeps({
      moderate: jest.fn(async () => ({
        status: 'blocked' as const,
        safePrompt: '',
        userMessage: strings.safety.blocked,
        reasonCode: 'violence',
      })),
    });
    const outcome = await createAiArt({ prompt: 'something scary and unsafe' }, h.deps);

    expect(outcome.status).toBe('blocked');
    if (outcome.status === 'blocked') expect(outcome.userMessage).toBe(strings.safety.blocked);
    expect(h.generate).not.toHaveBeenCalled();
    expect(h.addRecent).not.toHaveBeenCalled();
  });
});

describe('createAiArt — validation + error normalization', () => {
  it('rejects an empty prompt before moderating', async () => {
    const h = makeDeps();
    const outcome = await createAiArt({ prompt: '   ' }, h.deps);
    expect(outcome.status).toBe('error');
    if (outcome.status === 'error') {
      expect(outcome.userMessage).toBe(strings.errors.invalidInput);
      expect(outcome.retryable).toBe(false);
    }
    expect(h.moderate).not.toHaveBeenCalled();
  });

  it('maps an EdgeError (rate limit) to its child-safe message', async () => {
    const h = makeDeps({
      generate: jest.fn(async () => {
        throw new EdgeError('rate_limited', strings.errors.rateLimit, true);
      }),
    });
    const outcome = await createAiArt({ prompt: 'a cat' }, h.deps);
    expect(outcome.status).toBe('error');
    if (outcome.status === 'error') {
      expect(outcome.userMessage).toBe(strings.errors.rateLimit);
      expect(outcome.retryable).toBe(true);
    }
  });

  it('maps an unknown thrown error to the generic child-safe message', async () => {
    const h = makeDeps({
      moderate: jest.fn(async () => {
        throw new Error('boom: provider stack trace');
      }),
    });
    const outcome = await createAiArt({ prompt: 'a cat' }, h.deps);
    expect(outcome.status).toBe('error');
    if (outcome.status === 'error') {
      expect(outcome.userMessage).toBe(strings.errors.generic);
      // Never leak the raw error detail.
      expect(JSON.stringify(outcome)).not.toMatch(/boom|stack/);
    }
  });
});
