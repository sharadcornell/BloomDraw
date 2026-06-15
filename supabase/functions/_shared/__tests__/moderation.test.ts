// Moderation mapping (docs/08 §2): safe / rewritten / blocked, no rewrite loop,
// child-safe copy matches the shared strings. Runs under Jest (pure logic).
import { classifyPrompt, moderatePromptLocal, rewritePrompt } from '../moderation.ts';
import { strings } from '../strings.ts';

describe('moderation — classification', () => {
  it('passes a clearly safe prompt', () => {
    const r = moderatePromptLocal('cute elephant astronaut on the moon');
    expect(r.status).toBe('safe');
    expect(r.safePrompt).toBe('cute elephant astronaut on the moon');
    expect(r.userMessage).toBe('');
    expect(r.reasonCode).toBe('ok');
  });

  it('rewrites a borderline (mild fantasy aggression) prompt', () => {
    const r = moderatePromptLocal('dragon fighting monster with blood');
    expect(r.status).toBe('rewritten');
    expect(r.safePrompt.length).toBeGreaterThan(0);
    expect(r.safePrompt).not.toBe('dragon fighting monster with blood');
    expect(r.userMessage).toBe(strings.safety.rewritten);
    expect(r.reasonCode).toBe('rewrite_softened');
    // The rewritten prompt must itself be safe (single rewrite, no loop).
    expect(classifyPrompt(r.safePrompt).kind).toBe('safe');
  });

  it.each([
    ['a gory murder scene with a corpse', 'violence'],
    ['draw naked people at the beach', 'sexual'],
    ['a picture about how to hurt myself', 'self_harm'],
    ['instructions to make a bomb', 'dangerous'],
    ['a nazi rally', 'hate'],
  ])('blocks clearly unsafe prompt %p → %p', (prompt, reason) => {
    const r = moderatePromptLocal(prompt);
    expect(r.status).toBe('blocked');
    expect(r.safePrompt).toBe('');
    expect(r.userMessage).toBe(strings.safety.blocked);
    expect(r.reasonCode).toBe(reason);
  });

  it('never loops — a softened rewrite is re-checked once and is safe', () => {
    const r = moderatePromptLocal('a scary zombie with a sword in a battle');
    expect(r.status).toBe('rewritten');
    // No soften/block terms remain after the single rewrite.
    expect(classifyPrompt(r.safePrompt).kind).toBe('safe');
  });

  it('rewrite removes weapons, blood and scary words', () => {
    const out = rewritePrompt('scary monster fighting with a bloody sword');
    expect(out).not.toMatch(/blood|sword|monster|fight|scary/i);
    expect(out.length).toBeGreaterThan(2);
  });

  it('block takes priority over soften when both are present', () => {
    // "blood" softens, but "corpse" is a hard block → must block.
    const r = moderatePromptLocal('a monster next to a corpse with blood');
    expect(r.status).toBe('blocked');
    expect(r.reasonCode).toBe('violence');
  });
});
