// Small pure helpers shared by the mock provider and elsewhere. No I/O, no
// crypto globals — fully deterministic so mock outputs are stable (docs/05 §8).

/** Stable 32-bit FNV-1a hash → used to key deterministic mock images. */
export function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Deterministic pick from a non-empty array using a numeric seed. */
export function pick<T>(arr: readonly T[], seed: number): T {
  return arr[seed % arr.length];
}

/** First word-ish token of a string (for labelling mock art); defaults safe. */
export function firstWord(input: string): string {
  const m = input.trim().match(/[A-Za-z0-9]+/);
  return m ? m[0] : 'art';
}

/** Escape text for safe inclusion in an SVG/XML string. */
export function escapeXml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
