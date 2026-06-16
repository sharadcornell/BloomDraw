// Prompt moderation — the kid-safety core (CLAUDE.md AI safety rules, docs/05 §2).
//
// This is the deterministic LOCAL classifier used by the Mock provider AND as a
// fallback. Real providers (OpenAI) use their moderation model first, then reuse
// the soften/rewrite path here. Flow: classify → safe | rewrite | block.
//
//   - Clearly unsafe (sexual/adult, hate, self-harm, dangerous, graphic violence)
//     → BLOCK with the fixed child message.
//   - Borderline (mild fantasy aggression / scary) → REWRITE to a gentle version.
//   - Otherwise → SAFE.
//
// Never loops: a rewrite is re-checked exactly ONCE; if still unsafe → block.
// Raw categories are returned only as a server-side `reasonCode`, never shown.
import { strings } from './strings.ts';
import type { AgeRange, ModerationResult, ModerationStatus } from './types.ts';

export type Classification =
  | { kind: 'safe' }
  | { kind: 'block'; category: string }
  | { kind: 'soften' };

/**
 * Coarse, category-free reason code that is SAFE to return to the client.
 *
 * The raw block category (e.g. 'violence', 'self_harm', 'sexual') is a
 * server-side diagnostic ONLY (CLAUDE.md AI-safety rules: never expose raw
 * moderation categories to the child) and must stay in server logs. The wire
 * carries only this coarse status mirror, matching the client mock
 * (`src/services/aiMock.ts`).
 */
export function publicReasonCode(status: ModerationStatus): string {
  return status === 'blocked' ? 'blocked' : status === 'rewritten' ? 'rewrite_softened' : 'ok';
}

// Clearly-unsafe terms → BLOCK. `category` becomes the server-side reasonCode.
const BLOCK_GROUPS: { category: string; terms: string[] }[] = [
  {
    category: 'self_harm',
    terms: [
      'suicide', 'kill myself', 'kill yourself', 'hurt myself', 'hurt yourself',
      'cut myself', 'self-harm', 'self harm', 'end my life', 'take my life',
    ],
  },
  {
    category: 'sexual',
    terms: [
      'sex', 'sexual', 'nude', 'naked', 'porn', 'pornography', 'sexy', 'erotic',
      'genital', 'genitals', 'penis', 'vagina', 'boobs', 'breast', 'breasts', 'xxx', 'nsfw',
    ],
  },
  {
    category: 'hate',
    terms: ['nazi', 'kkk', 'heil hitler', 'white power', 'racist', 'racism', 'ethnic cleansing'],
  },
  {
    category: 'dangerous',
    terms: [
      'bomb', 'explosive', 'grenade', 'molotov', 'make a gun', 'build a gun',
      'how to make a weapon', 'meth', 'cocaine', 'heroin', 'poison', 'overdose', 'illegal drugs',
    ],
  },
  {
    category: 'violence',
    terms: [
      'gore', 'gory', 'behead', 'beheading', 'decapitate', 'decapitation', 'torture',
      'massacre', 'dead body', 'dead bodies', 'corpse', 'murder', 'murdering', 'slaughter',
      'shoot someone', 'shoot people', 'shooting people', 'stab someone', 'stabbing people',
      'kill people', 'killing people', 'kill everyone',
    ],
  },
];

// Borderline terms → REWRITE (soften to a gentle, kid-friendly scene).
const SOFTEN_TERMS = [
  'fight', 'fighting', 'fights', 'battle', 'battling', 'blood', 'bloody', 'monster',
  'monsters', 'scary', 'spooky', 'creepy', 'ghost', 'ghosts', 'zombie', 'zombies',
  'skeleton', 'skeletons', 'demon', 'demons', 'vampire', 'witch', 'sword', 'swords',
  'gun', 'guns', 'weapon', 'weapons', 'knife', 'knives', 'war', 'dead', 'kill', 'killing',
  'explosion', 'angry', 'shark attack', 'fire breathing',
];

// Ordered soften → gentle replacements applied during a rewrite.
const SOFTEN_REPLACEMENTS: [RegExp, string][] = [
  [/monsters?/g, 'friendly creature'],
  [/zombies?/g, 'friendly robot'],
  [/ghosts?/g, 'friendly ghost'],
  [/demons?/g, 'friendly creature'],
  [/skeletons?/g, 'friendly skeleton'],
  [/vampire/g, 'friendly bat'],
  [/witch/g, 'friendly wizard'],
  [/shark attack/g, 'friendly shark'],
  [/fire breathing/g, 'glowing'],
  [/scary|spooky|creepy|angry/g, 'friendly'],
  [/fighting|fights|fight|battling|battle|war/g, 'playing'],
  [/swords?|guns?|weapons?|knives|knife/g, 'magic wand'],
  [/bloody|blood/g, ''],
  [/explosion/g, 'sparkles'],
  [/killing|kill|dead/g, ''],
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Match `term` in normalized text. Multiword/hyphenated → substring; single
 *  token → letter-boundary match (so "sex" does not fire inside "essex"). */
function hasTerm(text: string, term: string): boolean {
  if (term.includes(' ') || term.includes('-')) return text.includes(term);
  return new RegExp(`(?:^|[^a-z])${escapeRegExp(term)}(?:$|[^a-z])`).test(text);
}

export function classifyPrompt(prompt: string): Classification {
  const text = normalize(prompt);
  for (const group of BLOCK_GROUPS) {
    for (const term of group.terms) {
      if (hasTerm(text, term)) return { kind: 'block', category: group.category };
    }
  }
  for (const term of SOFTEN_TERMS) {
    if (hasTerm(text, term)) return { kind: 'soften' };
  }
  return { kind: 'safe' };
}

/** Deterministic gentle rewrite of a borderline prompt. */
export function rewritePrompt(prompt: string): string {
  let out = normalize(prompt);
  for (const [pattern, replacement] of SOFTEN_REPLACEMENTS) out = out.replace(pattern, replacement);
  out = out.replace(/\s+/g, ' ').trim();
  // Drop stopwords left dangling by removals.
  out = out.replace(/\b(with|and|a|the|of|in|on|to)\b\s*$/g, '').trim();
  out = out.replace(/^\s*(with|and|a|the|of|to)\b\s*/g, '').trim();
  if (out.length < 3) return 'a friendly, magical scene';
  return out;
}

/**
 * Full local moderation: classify → (rewrite once) → terminal result.
 * `ageRange` is accepted for parity with the provider interface (could tune
 * strictness later); V1 uses one kid-safe bar for all bands.
 */
export function moderatePromptLocal(prompt: string, _ageRange?: AgeRange): ModerationResult {
  const first = classifyPrompt(prompt);
  if (first.kind === 'safe') {
    return { status: 'safe', safePrompt: prompt.trim(), userMessage: '', reasonCode: 'ok' };
  }
  if (first.kind === 'block') {
    return { status: 'blocked', safePrompt: '', userMessage: strings.safety.blocked, reasonCode: first.category };
  }
  // soften → rewrite once, then re-check exactly once (no loop).
  const rewritten = rewritePrompt(prompt);
  const second = classifyPrompt(rewritten);
  if (second.kind === 'safe') {
    return {
      status: 'rewritten',
      safePrompt: rewritten,
      userMessage: strings.safety.rewritten,
      reasonCode: 'rewrite_softened',
    };
  }
  // Still unsafe after one rewrite → block rather than loop.
  return {
    status: 'blocked',
    safePrompt: '',
    userMessage: strings.safety.blocked,
    reasonCode: second.kind === 'block' ? second.category : 'scary',
  };
}
