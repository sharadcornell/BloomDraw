/// <reference types="jest" />

// upload.ts imports the recents store (RecentInput) → AsyncStorage native module.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import { mockProcessUpload, mockTransform } from '@/services/aiMock';
import {
  EdgeError,
  isTransformStyle,
  processUploadedImage,
  transformImage,
  TRANSFORM_STYLES,
  type ProcessData,
} from '@/services/edge';
import {
  buildUploadRecentInput,
  processUpload,
  UPLOAD_STYLES,
  variantUrl,
  type UploadResultData,
} from '@/services/upload';
import { strings } from '@/lib/strings';
import { useRecentsStore } from '@/state';

function processData(over: Partial<ProcessData> = {}): ProcessData {
  return {
    uploadedImageId: 'u1',
    originalUrl: 'ref',
    lineArtUrl: 'https://cdn.test/line.png',
    sketchUrl: 'https://cdn.test/sketch.png',
    cartoonUrl: 'https://cdn.test/cartoon.png',
    coloringPageUrl: 'https://cdn.test/coloring.png',
    status: 'complete',
    demo: false,
    ...over,
  };
}

describe('transform style validation', () => {
  it('exposes the four styles and validates them', () => {
    expect([...TRANSFORM_STYLES]).toEqual(['line_art', 'sketch', 'cartoon', 'coloring_page']);
    expect(isTransformStyle('cartoon')).toBe(true);
    expect(isTransformStyle('watercolor')).toBe(false);
    expect(isTransformStyle(5)).toBe(false);
  });
});

describe('mock variants (client demo mirror)', () => {
  it('produces all four styles deterministically with demo:true', () => {
    const a = mockProcessUpload('photo://x');
    const b = mockProcessUpload('photo://x');
    expect(a.demo).toBe(true);
    expect(a.status).toBe('complete');
    expect(a.originalUrl).toBe('photo://x');
    expect(a.lineArtUrl).toBeTruthy();
    expect(a.sketchUrl).toBeTruthy();
    expect(a.cartoonUrl).toBeTruthy();
    expect(a.coloringPageUrl).toBeTruthy();
    expect(a.lineArtUrl).toBe(b.lineArtUrl); // deterministic
    expect(a.lineArtUrl).not.toBe(a.sketchUrl); // distinct per style
  });

  it('honors a requested style subset', () => {
    const r = mockProcessUpload('x', ['line_art']);
    expect(r.lineArtUrl).toBeTruthy();
    expect(r.sketchUrl).toBeNull();
  });

  it('mockTransform returns one styled variant', () => {
    const t = mockTransform('x', 'sketch');
    expect(t.style).toBe('sketch');
    expect(t.demo).toBe(true);
    expect(t.outputImageUrl.startsWith('data:image/svg+xml')).toBe(true);
  });
});

describe('edge fallback (Supabase unconfigured)', () => {
  it('processes locally into demo variants', async () => {
    const r = await processUploadedImage({ imageUrl: 'file://p.jpg' });
    expect(r.demo).toBe(true);
    expect(r.lineArtUrl).toBeTruthy();
  });

  it('transforms locally into a demo variant', async () => {
    const t = await transformImage({ imageUrl: 'file://p.jpg', style: 'cartoon' });
    expect(t.demo).toBe(true);
    expect(t.style).toBe('cartoon');
  });
});

describe('processUpload orchestration', () => {
  it('maps a successful result, keeping the local uri as Original', async () => {
    const process = jest.fn(async () => processData());
    const outcome = await processUpload({ originalUri: 'file://orig' }, { process });

    expect(process).toHaveBeenCalledWith({
      imageUrl: 'file://orig',
      styles: ['line_art', 'sketch', 'cartoon', 'coloring_page'],
    });
    expect(outcome.status).toBe('done');
    if (outcome.status === 'done') {
      expect(outcome.data.originalUri).toBe('file://orig');
      expect(outcome.data.variants.original).toBe('file://orig');
      expect(outcome.data.variants.line_art).toBe('https://cdn.test/line.png');
      expect(outcome.data.provider).toBe('cloud');
      expect(outcome.data.demo).toBe(false);
    }
    expect([...UPLOAD_STYLES]).toEqual(['line_art', 'sketch', 'cartoon', 'coloring_page']);
  });

  it('sends an uploadRef when the original was uploaded', async () => {
    const process = jest.fn(async () => processData({ demo: false }));
    await processUpload({ originalUri: 'file://orig', uploadRef: 'user-uploads/d/u.jpg' }, { process });
    expect(process).toHaveBeenCalledWith(
      expect.objectContaining({ uploadRef: 'user-uploads/d/u.jpg' }),
    );
  });

  it('passes through a partial status', async () => {
    const process = jest.fn(async () => processData({ status: 'partial', sketchUrl: null }));
    const outcome = await processUpload({ originalUri: 'file://orig' }, { process });
    expect(outcome.status).toBe('done');
    if (outcome.status === 'done') expect(outcome.data.status).toBe('partial');
  });

  it('normalizes an EdgeError to its child-safe message', async () => {
    const process = jest.fn(async () => {
      throw new EdgeError('rate_limited', strings.errors.rateLimit, true);
    });
    const outcome = await processUpload({ originalUri: 'file://orig' }, { process });
    expect(outcome.status).toBe('error');
    if (outcome.status === 'error') {
      expect(outcome.userMessage).toBe(strings.errors.rateLimit);
      expect(outcome.retryable).toBe(true);
    }
  });

  it('maps an unknown thrown error to the generic message without leaking detail', async () => {
    const process = jest.fn(async () => {
      throw new Error('raw storage stack trace');
    });
    const outcome = await processUpload({ originalUri: 'file://orig' }, { process });
    expect(outcome.status).toBe('error');
    if (outcome.status === 'error') {
      expect(outcome.userMessage).toBe(strings.errors.generic);
      expect(JSON.stringify(outcome)).not.toMatch(/storage stack/);
    }
  });
});

describe('variant selection → recents', () => {
  const data: UploadResultData = {
    originalUri: 'file://orig.jpg',
    variants: {
      original: 'file://orig.jpg',
      line_art: 'https://cdn.test/line.png',
      sketch: null,
      cartoon: 'https://cdn.test/cartoon.png',
      coloring_page: 'https://cdn.test/coloring.png',
    },
    provider: 'cloud',
    demo: false,
    status: 'complete',
  };

  it('resolves the url for a key (Original falls back to the source)', () => {
    expect(variantUrl(data, 'original')).toBe('file://orig.jpg');
    expect(variantUrl(data, 'line_art')).toBe('https://cdn.test/line.png');
    expect(variantUrl(data, 'sketch')).toBeNull();
  });

  it('builds an uploaded_image recents entry for the selected variant', () => {
    const input = buildUploadRecentInput(data, 'line_art');
    expect(input.type).toBe('uploaded_image');
    expect(input.style).toBe('line_art');
    expect(input.imageUrl).toBe('https://cdn.test/line.png');
    expect(input.originalUri).toBe('file://orig.jpg');
    expect(input.thumbnailUrl).toBe('https://cdn.test/line.png');
    expect(input.demo).toBe(false);
  });

  it('falls back to the original photo for a non-renderable (demo) thumbnail', () => {
    const demoData: UploadResultData = {
      ...data,
      demo: true,
      variants: { ...data.variants, line_art: 'data:image/svg+xml;utf8,<svg/>' },
    };
    const input = buildUploadRecentInput(demoData, 'line_art');
    expect(input.thumbnailUrl).toBe('file://orig.jpg');
  });

  it('adds the entry to the recents store on selection', () => {
    const rec = useRecentsStore.getState().addRecentCreation(buildUploadRecentInput(data, 'cartoon'));
    expect(rec.type).toBe('uploaded_image');
    expect(rec.id).toBeTruthy();
    expect(rec.style).toBe('cartoon');
  });
});
