// Provider abstraction (docs/08 §2): mock determinism + demo flag, missing keys
// → mock fallback, provider selection. No real keys / network are used.
import { getProvider } from '../ai-provider/index.ts';
import { MockProvider } from '../ai-provider/mock.ts';

const SAVED = { ...process.env };
function resetEnv() {
  for (const k of Object.keys(process.env)) if (!(k in SAVED)) delete process.env[k];
  Object.assign(process.env, SAVED);
}
afterEach(resetEnv);

describe('mock provider', () => {
  const mock = new MockProvider();

  it('is the default provider with no env (mock mode default true)', () => {
    const p = getProvider();
    expect(p.name).toBe('mock');
    expect(p.isMock).toBe(true);
  });

  it('generates deterministic images keyed off the prompt', async () => {
    const a = await mock.generateImage('a happy cat');
    const b = await mock.generateImage('a happy cat');
    const c = await mock.generateImage('a rocket ship');
    expect(a.imageUrl).toBe(b.imageUrl);
    expect(a.imageUrl).not.toBe(c.imageUrl);
    expect(a.provider).toBe('mock');
    expect(a.imageUrl.startsWith('data:image/svg+xml')).toBe(true);
  });

  it('produces a distinct line-art variant', async () => {
    const illo = await mock.generateImage('a tree', { style: 'illustration' });
    const line = await mock.generateImage('a tree', { style: 'line_art' });
    expect(illo.imageUrl).not.toBe(line.imageUrl);
  });

  it('produces deterministic per-style transforms', async () => {
    const s1 = await mock.transformImage('ref://photo', 'sketch');
    const s2 = await mock.transformImage('ref://photo', 'sketch');
    const c1 = await mock.transformImage('ref://photo', 'cartoon');
    expect(s1.imageUrl).toBe(s2.imageUrl);
    expect(s1.imageUrl).not.toBe(c1.imageUrl);
  });

  it('exposes the four upload transform helpers', async () => {
    for (const r of [
      await mock.generateLineArt('x'),
      await mock.generateSketch('x'),
      await mock.generateCartoon('x'),
      await mock.generateColoringPage('x'),
    ]) {
      expect(r.imageUrl.startsWith('data:image/svg+xml')).toBe(true);
      expect(r.provider).toBe('mock');
    }
  });

  it('moderates through the provider interface', async () => {
    const r = await mock.moderatePrompt('cute puppy');
    expect(r.status).toBe('safe');
  });
});

describe('provider selection / fallback', () => {
  it('falls back to mock when real mode is on but the key is missing', () => {
    process.env.AI_MOCK_MODE = 'false';
    process.env.AI_PROVIDER = 'openai';
    delete process.env.OPENAI_API_KEY;
    const p = getProvider();
    expect(p.name).toBe('mock');
    expect(p.isMock).toBe(true);
  });

  it('selects OpenAI when mock is off and a key is present', () => {
    process.env.AI_MOCK_MODE = 'false';
    process.env.AI_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'sk-test-not-real';
    const p = getProvider();
    expect(p.name).toBe('openai');
    expect(p.isMock).toBe(false);
  });

  it('selects Replicate when configured with a token', () => {
    process.env.AI_MOCK_MODE = 'false';
    process.env.AI_PROVIDER = 'replicate';
    process.env.REPLICATE_API_TOKEN = 'r8-test-not-real';
    const p = getProvider();
    expect(p.name).toBe('replicate');
    expect(p.isMock).toBe(false);
  });
});
