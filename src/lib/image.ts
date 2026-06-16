/**
 * Whether a URI can be shown by the native image loader (expo-image).
 *
 * Renders http(s) / file / content / raster data URLs. Returns false for SVG
 * data URLs (the mock/demo art) — native loaders don't reliably render those, so
 * the UI falls back to a branded placeholder for demo results (docs/05 §8).
 */
export function isRenderableImage(url?: string | null): url is string {
  if (!url) return false;
  if (url.startsWith('data:image/svg')) return false;
  return /^(https?:|file:|content:|ph:|assets-library:|data:image\/(png|jpe?g|gif|webp))/i.test(url);
}
