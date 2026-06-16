import { getFeaturedItems } from '@/content';
import type { UploadResultData, VariantKey } from '@/services/upload';
import { getCategoryAccent, theme } from '@/theme/theme';
import type { DrawingItem, RecentCreation } from '@/types';

import { strings } from './strings';

/**
 * Projector Preview model + pure helpers (docs/02 §7, docs/06).
 *
 * A `PreviewSource` is a normalized, transport-agnostic description of whatever
 * the user chose to project — a preloaded drawing, an AI result, or an uploaded
 * variant — built locally (no Supabase). The screen + canvas render it; the
 * control-state helpers below are pure so they're unit-testable.
 */
export type PreviewKind = 'drawing' | 'ai' | 'upload';

export interface PreviewSource {
  title: string;
  kind: PreviewKind;
  /** Main image uri (http/file/raster, an SVG-data demo url, or null → placeholder). */
  url: string | null;
  /** Trace/line-art uri preferred in high-contrast mode (or null). */
  outlineUrl: string | null;
  /** Placeholder glyph when `url` isn't a loadable image. */
  emoji: string;
  /** Placeholder accent color. */
  accent: string;
  /** true → show the Demo badge (mock/AI demo output). */
  demo: boolean;
}

// --- Source builders --------------------------------------------------------

export function previewFromDrawing(item: DrawingItem, opts?: { trace?: boolean }): PreviewSource {
  return {
    title: item.title,
    kind: 'drawing',
    url: (opts?.trace ? item.traceImageUrl : item.finalImageUrl) ?? null,
    outlineUrl: item.traceImageUrl ?? null,
    emoji: item.emoji,
    accent: getCategoryAccent(item.categorySlug),
    demo: false,
  };
}

export function previewFromUpload(
  data: UploadResultData,
  key: VariantKey,
  title: string = strings.upload.recentTitle,
): PreviewSource {
  const url = key === 'original' ? data.originalUri : data.variants[key];
  return {
    title,
    kind: 'upload',
    url: url ?? data.originalUri,
    outlineUrl: data.variants.line_art ?? data.originalUri ?? null,
    emoji: '🖼️',
    accent: theme.color.brand.sky,
    demo: data.demo,
  };
}

/** Build a preview from a recents entry (AI / upload / preloaded). Null-safe. */
export function previewFromRecent(recent: RecentCreation | null | undefined): PreviewSource | null {
  if (!recent) return null;
  if (recent.type === 'ai_generation') {
    return {
      title: recent.title,
      kind: 'ai',
      url: recent.imageUrl ?? null,
      outlineUrl: recent.lineArtUrl ?? null,
      emoji: recent.emoji ?? '✨',
      accent: theme.color.brand.violet,
      demo: !!recent.demo,
    };
  }
  if (recent.type === 'uploaded_image') {
    return {
      title: recent.title,
      kind: 'upload',
      url: recent.imageUrl ?? recent.originalUri ?? recent.variants?.original ?? null,
      outlineUrl: recent.variants?.line_art ?? recent.originalUri ?? null,
      emoji: recent.emoji ?? '🖼️',
      accent: theme.color.brand.sky,
      demo: !!recent.demo,
    };
  }
  // preloaded_drawing recent — emoji preview (no full item is carried here).
  return {
    title: recent.title,
    kind: 'drawing',
    url: recent.thumbnailUrl ?? null,
    outlineUrl: null,
    emoji: recent.emoji ?? '🎨',
    accent: theme.color.brand.mint,
    demo: !!recent.demo,
  };
}

/** Safe default when the screen opens without a source (e.g. Home shortcut). */
export function defaultPreview(): PreviewSource {
  const featured = getFeaturedItems()[0];
  if (featured) return previewFromDrawing(featured);
  return {
    title: 'Your art',
    kind: 'drawing',
    url: null,
    outlineUrl: null,
    emoji: '🎨',
    accent: theme.color.brand.violet,
    demo: false,
  };
}

// --- Control state (pure) ---------------------------------------------------

export const ZOOM_MIN = 1;
export const ZOOM_MAX = 4;
export const ZOOM_STEP = 0.5;

export function clampZoom(zoom: number): number {
  const rounded = Math.round(zoom * 100) / 100;
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, rounded));
}

/** Rotate by `delta` degrees, normalized to [0, 360). */
export function rotateBy(deg: number, delta = 90): number {
  return (((deg + delta) % 360) + 360) % 360;
}

export const BRIGHTNESS_LEVELS = [
  { id: 'dim', label: 'Dim', overlay: 'rgba(20,16,40,0.30)' },
  { id: 'normal', label: 'Normal', overlay: 'transparent' },
  { id: 'bright', label: 'Bright', overlay: 'rgba(255,255,255,0.18)' },
] as const;

export const PAPER_SIZES = [
  { id: 'a4', label: 'A4', ratio: 1 / 1.414 },
  { id: 'letter', label: 'Letter', ratio: 1 / 1.294 },
  { id: 'square', label: 'Square', ratio: 1 },
] as const;

/** Advance a wrapping index (brightness / paper cycles). */
export function cycleIndex(current: number, length: number): number {
  return (current + 1) % length;
}

export interface ProjectorState {
  rotation: number;
  zoom: number;
  brightnessIndex: number;
  paperIndex: number;
  highContrast: boolean;
}

export const INITIAL_PROJECTOR_STATE: ProjectorState = {
  rotation: 0,
  zoom: 1,
  brightnessIndex: 1, // "Normal"
  paperIndex: 0, // A4
  highContrast: false,
};

export function resetProjectorState(): ProjectorState {
  return { ...INITIAL_PROJECTOR_STATE };
}
