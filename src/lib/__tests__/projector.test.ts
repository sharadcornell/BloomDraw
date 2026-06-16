/// <reference types="jest" />

import {
  BRIGHTNESS_LEVELS,
  clampZoom,
  cycleIndex,
  defaultPreview,
  INITIAL_PROJECTOR_STATE,
  PAPER_SIZES,
  previewFromDrawing,
  previewFromRecent,
  previewFromUpload,
  resetProjectorState,
  rotateBy,
  ZOOM_MAX,
  ZOOM_MIN,
} from '@/lib/projector';
import type { UploadResultData } from '@/services/upload';
import type { DrawingItem, RecentCreation } from '@/types';

const drawing: DrawingItem = {
  id: 'd1',
  slug: 'cat',
  title: 'Cute cat',
  categorySlug: 'animals',
  description: 'A cat',
  emoji: '🐱',
  ageMin: 3,
  ageMax: 8,
  difficulty: 'easy',
  isFeatured: true,
  isPlaceholder: true,
  thumbnailUrl: null,
  finalImageUrl: null,
  traceImageUrl: null,
  steps: [],
};

describe('source normalization', () => {
  it('builds a preview from a preloaded drawing (final + trace)', () => {
    const final = previewFromDrawing(drawing);
    expect(final.kind).toBe('drawing');
    expect(final.title).toBe('Cute cat');
    expect(final.emoji).toBe('🐱');
    expect(final.url).toBeNull(); // no asset → placeholder
    expect(final.demo).toBe(false);

    const trace = previewFromDrawing(drawing, { trace: true });
    expect(trace.url).toBeNull(); // traceImageUrl null → placeholder
  });

  it('builds a preview from an AI recent', () => {
    const recent: RecentCreation = {
      id: 'r1',
      type: 'ai_generation',
      title: 'A happy cat',
      createdAt: 1,
      imageUrl: 'https://cdn.test/img.png',
      lineArtUrl: 'https://cdn.test/line.png',
      demo: true,
    };
    const src = previewFromRecent(recent);
    expect(src).not.toBeNull();
    expect(src?.kind).toBe('ai');
    expect(src?.url).toBe('https://cdn.test/img.png');
    expect(src?.outlineUrl).toBe('https://cdn.test/line.png');
    expect(src?.demo).toBe(true);
  });

  it('builds a preview from an uploaded recent', () => {
    const recent: RecentCreation = {
      id: 'r2',
      type: 'uploaded_image',
      title: 'My photo art',
      createdAt: 1,
      style: 'line_art',
      imageUrl: 'https://cdn.test/line.png',
      originalUri: 'file://orig.jpg',
      variants: {
        original: 'file://orig.jpg',
        line_art: 'https://cdn.test/line.png',
        sketch: null,
        cartoon: null,
        coloring_page: null,
      },
      demo: false,
    };
    const src = previewFromRecent(recent);
    expect(src?.kind).toBe('upload');
    expect(src?.url).toBe('https://cdn.test/line.png');
    expect(src?.outlineUrl).toBe('https://cdn.test/line.png');
  });

  it('is null-safe for missing/unknown sources', () => {
    expect(previewFromRecent(null)).toBeNull();
    expect(previewFromRecent(undefined)).toBeNull();
  });

  it('builds a preview from a live upload result', () => {
    const data: UploadResultData = {
      originalUri: 'file://orig.jpg',
      variants: {
        original: 'file://orig.jpg',
        line_art: 'https://cdn.test/line.png',
        sketch: 'https://cdn.test/sketch.png',
        cartoon: null,
        coloring_page: null,
      },
      provider: 'cloud',
      demo: false,
      status: 'complete',
    };
    expect(previewFromUpload(data, 'original').url).toBe('file://orig.jpg');
    expect(previewFromUpload(data, 'sketch').url).toBe('https://cdn.test/sketch.png');
    // A missing variant falls back to the original photo.
    expect(previewFromUpload(data, 'cartoon').url).toBe('file://orig.jpg');
  });

  it('always returns a safe default preview (never crashes)', () => {
    const def = defaultPreview();
    expect(def.title.length).toBeGreaterThan(0);
    expect(def.kind).toBe('drawing');
  });
});

describe('control-state helpers (pure)', () => {
  it('clamps zoom to [MIN, MAX]', () => {
    expect(clampZoom(0.5)).toBe(ZOOM_MIN);
    expect(clampZoom(99)).toBe(ZOOM_MAX);
    expect(clampZoom(2)).toBe(2);
  });

  it('rotates in 90° steps, wrapping at 360', () => {
    expect(rotateBy(0)).toBe(90);
    expect(rotateBy(270)).toBe(0);
    expect(rotateBy(0, -90)).toBe(270);
  });

  it('cycles brightness + paper indices', () => {
    expect(cycleIndex(0, BRIGHTNESS_LEVELS.length)).toBe(1);
    expect(cycleIndex(BRIGHTNESS_LEVELS.length - 1, BRIGHTNESS_LEVELS.length)).toBe(0);
    expect(cycleIndex(PAPER_SIZES.length - 1, PAPER_SIZES.length)).toBe(0);
  });

  it('reset returns the initial state (independent copy)', () => {
    const reset = resetProjectorState();
    expect(reset).toEqual(INITIAL_PROJECTOR_STATE);
    expect(reset).not.toBe(INITIAL_PROJECTOR_STATE);
    expect(reset.rotation).toBe(0);
    expect(reset.zoom).toBe(1);
    expect(reset.highContrast).toBe(false);
  });
});
