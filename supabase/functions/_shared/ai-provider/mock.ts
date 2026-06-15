// Mock provider (docs/03 §7, docs/05 §8) — the DEFAULT in dev and the fail-safe
// fallback. Always works with NO keys and NO network. Deterministic: the same
// input always yields the same output (so the app/demos are stable), and every
// image is a self-contained SVG data URL. Responses carry `demo:true` via
// `isMock` so the app shows the Demo-mode badge.
import { escapeXml, firstWord, hashString, pick } from '../util.ts';
import { moderatePromptLocal, rewritePrompt } from '../moderation.ts';
import type {
  AIProvider,
  GenerateOptions,
  ImageResult,
  ModerationResult,
  TransformStyle,
  AgeRange,
} from '../types.ts';

const PALETTES: readonly [string, string][] = [
  ['#7C5CFC', '#B79CFF'], // brand violet
  ['#FF8FA3', '#FFD1DC'], // coral
  ['#FFC65C', '#FFE3A3'], // sun
  ['#5CD6B3', '#BDF3E6'], // mint
  ['#5CB8FF', '#BFE4FF'], // sky
];

const STYLE_LABEL: Record<TransformStyle, string> = {
  line_art: 'Line art',
  sketch: 'Sketch',
  cartoon: 'Cartoon',
  coloring_page: 'Coloring page',
};

function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** Themed gradient "illustration" placeholder keyed off the prompt. */
function illustration(subject: string, seed: number): string {
  const [a, b] = pick(PALETTES, seed);
  const safe = escapeXml(subject).slice(0, 40);
  return svgDataUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>` +
      `<rect width="512" height="512" fill="url(#g)"/>` +
      `<text x="256" y="250" font-family="sans-serif" font-size="180" text-anchor="middle">★</text>` +
      `<text x="256" y="420" font-family="sans-serif" font-size="34" fill="#ffffff" text-anchor="middle">${safe}</text>` +
      `<text x="256" y="468" font-family="sans-serif" font-size="20" fill="#ffffff" text-anchor="middle" opacity="0.85">Demo</text>` +
      `</svg>`,
  );
}

/** High-contrast outline placeholder (line art / projection-ready). */
function lineArt(subject: string): string {
  const safe = escapeXml(subject).slice(0, 40);
  return svgDataUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">` +
      `<rect width="512" height="512" fill="#ffffff"/>` +
      `<circle cx="256" cy="220" r="120" fill="none" stroke="#111111" stroke-width="6"/>` +
      `<rect x="176" y="320" width="160" height="90" rx="16" fill="none" stroke="#111111" stroke-width="6"/>` +
      `<text x="256" y="468" font-family="sans-serif" font-size="28" fill="#111111" text-anchor="middle">${safe}</text>` +
      `</svg>`,
  );
}

/** Deterministic per-style transform placeholder keyed off (source, style). */
function styleVariant(style: TransformStyle, sourceKey: string): string {
  const seed = hashString(`${sourceKey}|${style}`);
  const tone = 40 + (seed % 60); // greyscale-ish band
  const fill = `rgb(${tone},${tone},${tone})`;
  return svgDataUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">` +
      `<rect width="512" height="512" fill="#ffffff"/>` +
      `<rect x="56" y="56" width="400" height="400" rx="24" fill="none" stroke="${fill}" stroke-width="8"/>` +
      `<circle cx="256" cy="230" r="110" fill="none" stroke="${fill}" stroke-width="8"/>` +
      `<text x="256" y="430" font-family="sans-serif" font-size="30" fill="${fill}" text-anchor="middle">${STYLE_LABEL[style]} · Demo</text>` +
      `</svg>`,
  );
}

export class MockProvider implements AIProvider {
  readonly name = 'mock' as const;
  readonly isMock = true;

  moderatePrompt(prompt: string, ageRange?: AgeRange): Promise<ModerationResult> {
    return Promise.resolve(moderatePromptLocal(prompt, ageRange));
  }

  rewritePromptForKidSafety(prompt: string): Promise<string> {
    return Promise.resolve(rewritePrompt(prompt));
  }

  generateImage(prompt: string, options?: GenerateOptions): Promise<ImageResult> {
    const subject = firstWord(prompt);
    const wantsOutline = options?.style === 'line_art' || options?.style === 'projection';
    const imageUrl = wantsOutline ? lineArt(subject) : illustration(subject, hashString(prompt));
    return Promise.resolve({ imageUrl, provider: this.name, meta: { demo: true } });
  }

  transformImage(imageUrl: string, style: TransformStyle): Promise<ImageResult> {
    return Promise.resolve({
      imageUrl: styleVariant(style, imageUrl),
      provider: this.name,
      meta: { demo: true, style },
    });
  }

  generateLineArt(imageUrl: string): Promise<ImageResult> {
    return this.transformImage(imageUrl, 'line_art');
  }

  generateSketch(imageUrl: string): Promise<ImageResult> {
    return this.transformImage(imageUrl, 'sketch');
  }

  generateCartoon(imageUrl: string): Promise<ImageResult> {
    return this.transformImage(imageUrl, 'cartoon');
  }

  generateColoringPage(imageUrl: string): Promise<ImageResult> {
    return this.transformImage(imageUrl, 'coloring_page');
  }
}
