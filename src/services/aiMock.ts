import { strings } from '@/lib/strings';

import type {
  AgeRange,
  GenerationData,
  ModerationData,
  ProcessData,
  TransformData,
  TransformStyle,
} from './edge';

const ALL_STYLES: readonly TransformStyle[] = ['line_art', 'sketch', 'cartoon', 'coloring_page'];

/**
 * CLIENT-side demo fallback for the AI flow (docs/03 §5, docs/05 §8, §10).
 *
 * Used ONLY when the app is unconfigured / FORCE_MOCK so every flow stays
 * demoable with zero backend — it mirrors the SERVER mock
 * (`supabase/functions/_shared/...`) in shape and child-safe behavior.
 *
 * The AUTHORITATIVE moderation + generation is the Edge Function; this is a
 * deliberately lightweight mirror for offline demos, so it carries a small,
 * intentionally-simple keyword classifier (the server holds the full ruleset).
 * Child-facing copy is the single source in `src/lib/strings.ts`.
 */

// Clearly-unsafe → blocked (compact mirror of the server BLOCK groups).
const BLOCK_TERMS = [
  'gore', 'gory', 'behead', 'decapitate', 'torture', 'massacre', 'corpse', 'murder',
  'slaughter', 'naked', 'nude', 'porn', 'sexual', 'sex', 'xxx', 'nsfw',
  'nazi', 'kkk', 'racist', 'suicide', 'kill myself', 'kill yourself', 'hurt myself',
  'self-harm', 'self harm', 'bomb', 'explosive', 'grenade', 'meth', 'cocaine', 'heroin',
  'kill people', 'killing people', 'shoot someone', 'stab someone',
];

// Borderline (mild fantasy aggression / scary) → rewritten.
const SOFTEN_TERMS = [
  'fight', 'fighting', 'battle', 'blood', 'bloody', 'monster', 'scary', 'spooky',
  'creepy', 'ghost', 'zombie', 'skeleton', 'demon', 'vampire', 'witch', 'sword',
  'gun', 'weapon', 'knife', 'war', 'dead', 'kill', 'killing', 'explosion', 'angry',
];

const SOFTEN_REPLACEMENTS: [RegExp, string][] = [
  [/monsters?/g, 'friendly creature'],
  [/zombies?/g, 'friendly robot'],
  [/ghosts?/g, 'friendly ghost'],
  [/demons?/g, 'friendly creature'],
  [/skeletons?/g, 'friendly skeleton'],
  [/vampire/g, 'friendly bat'],
  [/witch/g, 'friendly wizard'],
  [/scary|spooky|creepy|angry/g, 'friendly'],
  [/fighting|fights|fight|battle|war/g, 'playing'],
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

function hasTerm(text: string, term: string): boolean {
  if (term.includes(' ') || term.includes('-')) return text.includes(term);
  return new RegExp(`(?:^|[^a-z])${escapeRegExp(term)}(?:$|[^a-z])`).test(text);
}

function rewrite(prompt: string): string {
  let out = normalize(prompt);
  for (const [pattern, replacement] of SOFTEN_REPLACEMENTS) out = out.replace(pattern, replacement);
  out = out.replace(/\s+/g, ' ').trim();
  out = out.replace(/\b(with|and|a|the|of|in|on|to)\b\s*$/g, '').trim();
  out = out.replace(/^\s*(with|and|a|the|of|to)\b\s*/g, '').trim();
  return out.length < 3 ? 'a friendly, magical scene' : out;
}

/** Local moderation mirror → safe | rewritten | blocked. */
export function mockModerate(prompt: string, _ageRange?: AgeRange): ModerationData {
  const text = normalize(prompt);
  if (BLOCK_TERMS.some((t) => hasTerm(text, t))) {
    return { status: 'blocked', safePrompt: '', userMessage: strings.safety.blocked, reasonCode: 'blocked' };
  }
  if (SOFTEN_TERMS.some((t) => hasTerm(text, t))) {
    const safePrompt = rewrite(prompt);
    return { status: 'rewritten', safePrompt, userMessage: strings.safety.rewritten, reasonCode: 'rewrite_softened' };
  }
  return { status: 'safe', safePrompt: prompt.trim(), userMessage: '', reasonCode: 'ok' };
}

// ---------------------------------------------------------------------------
// Deterministic demo art (self-contained SVG data URLs — no keys/network).
// The result UI renders a branded placeholder for demo results; these URLs
// exist for shape parity + recents storage.
// ---------------------------------------------------------------------------
const PALETTES: readonly [string, string][] = [
  ['#7C5CFC', '#B79CFF'],
  ['#FF7E6B', '#FFD1DC'],
  ['#FFC93C', '#FFE3A3'],
  ['#3FD6B0', '#BDF3E6'],
  ['#5FC9F3', '#BFE4FF'],
];

function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function firstWord(s: string): string {
  const m = s.trim().match(/[A-Za-z0-9]+/);
  return m ? m[0] : 'art';
}

function illustration(prompt: string): string {
  const [a, b] = PALETTES[hash(prompt) % PALETTES.length];
  const subject = escapeXml(firstWord(prompt)).slice(0, 24);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>` +
    `<rect width="512" height="512" fill="url(#g)"/>` +
    `<text x="256" y="250" font-size="180" text-anchor="middle">★</text>` +
    `<text x="256" y="430" font-size="34" fill="#fff" text-anchor="middle">${subject}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function lineArt(prompt: string): string {
  const subject = escapeXml(firstWord(prompt)).slice(0, 24);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">` +
    `<rect width="512" height="512" fill="#fff"/>` +
    `<circle cx="256" cy="220" r="120" fill="none" stroke="#111" stroke-width="6"/>` +
    `<text x="256" y="430" font-size="28" fill="#111" text-anchor="middle">${subject}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** Local demo generation mirror → deterministic image + line art, demo:true. */
export function mockGenerate(safePrompt: string, options?: { lineArt?: boolean }): GenerationData {
  return {
    generationId: null,
    imageUrl: illustration(safePrompt),
    lineArtUrl: options?.lineArt === false ? null : lineArt(safePrompt),
    provider: 'mock',
    status: 'complete',
    demo: true,
  };
}

// ---------------------------------------------------------------------------
// Photo-transform demo variants (docs/05 §4–§5). Deterministic, keyed off the
// source + style so the same photo always yields the same demo variants.
// ---------------------------------------------------------------------------
const STYLE_LABEL: Record<TransformStyle, string> = {
  line_art: 'Line art',
  sketch: 'Pencil sketch',
  cartoon: 'Cartoon',
  coloring_page: 'Coloring page',
};

function styleVariant(source: string, style: TransformStyle): string {
  const seed = hash(`${source}|${style}`);
  const tone = 40 + (seed % 60);
  const stroke = `rgb(${tone},${tone},${tone})`;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">` +
    `<rect width="512" height="512" fill="#fff"/>` +
    `<rect x="56" y="56" width="400" height="400" rx="24" fill="none" stroke="${stroke}" stroke-width="8"/>` +
    `<circle cx="256" cy="230" r="110" fill="none" stroke="${stroke}" stroke-width="8"/>` +
    `<text x="256" y="430" font-size="28" fill="${stroke}" text-anchor="middle">${STYLE_LABEL[style]}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** Local demo mirror of process-uploaded-image → all requested style variants. */
export function mockProcessUpload(source: string, styles?: TransformStyle[]): ProcessData {
  const requested = styles && styles.length > 0 ? styles : ALL_STYLES;
  const url = (style: TransformStyle): string | null =>
    requested.includes(style) ? styleVariant(source, style) : null;
  return {
    uploadedImageId: null,
    originalUrl: source,
    lineArtUrl: url('line_art'),
    sketchUrl: url('sketch'),
    cartoonUrl: url('cartoon'),
    coloringPageUrl: url('coloring_page'),
    status: 'complete',
    demo: true,
  };
}

/** Local demo mirror of transform-image → one styled variant. */
export function mockTransform(source: string, style: TransformStyle): TransformData {
  return {
    outputImageUrl: styleVariant(source, style),
    style,
    provider: 'mock',
    status: 'complete',
    demo: true,
  };
}
