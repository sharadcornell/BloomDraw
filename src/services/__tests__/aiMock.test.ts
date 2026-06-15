/// <reference types="jest" />

import { mockGenerate, mockModerate } from '@/services/aiMock';
import { strings } from '@/lib/strings';

describe('mockModerate (client demo mirror)', () => {
  it('passes a safe prompt through unchanged', () => {
    const r = mockModerate('cute elephant astronaut on the moon');
    expect(r.status).toBe('safe');
    expect(r.safePrompt).toBe('cute elephant astronaut on the moon');
    expect(r.userMessage).toBe('');
  });

  it('rewrites a borderline prompt with the kid-friendly banner', () => {
    const r = mockModerate('dragon fighting monster with blood');
    expect(r.status).toBe('rewritten');
    expect(r.userMessage).toBe(strings.safety.rewritten);
    expect(r.safePrompt).not.toMatch(/blood|monster|fighting/i);
    expect(r.safePrompt.length).toBeGreaterThan(0);
  });

  it('blocks a clearly-unsafe prompt with the fixed block copy', () => {
    const r = mockModerate('a bloody murder with a corpse');
    expect(r.status).toBe('blocked');
    expect(r.safePrompt).toBe('');
    expect(r.userMessage).toBe(strings.safety.blocked);
  });
});

describe('mockGenerate (client demo mirror)', () => {
  it('is deterministic and always flagged demo', () => {
    const a = mockGenerate('a happy cat');
    const b = mockGenerate('a happy cat');
    const c = mockGenerate('a rocket');
    expect(a.imageUrl).toBe(b.imageUrl);
    expect(a.imageUrl).not.toBe(c.imageUrl);
    expect(a.provider).toBe('mock');
    expect(a.demo).toBe(true);
    expect(a.status).toBe('complete');
    expect(a.imageUrl.startsWith('data:image/svg+xml')).toBe(true);
    expect(a.lineArtUrl).toBeTruthy();
  });

  it('omits line art when not requested', () => {
    expect(mockGenerate('a cat', { lineArt: false }).lineArtUrl).toBeNull();
  });
});
