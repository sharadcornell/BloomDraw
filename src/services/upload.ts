import { isRenderableImage } from '@/lib/image';
import { strings } from '@/lib/strings';
import type { RecentInput } from '@/state';

import {
  processUploadedImage as edgeProcessUploadedImage,
  toEdgeError,
  type ProcessData,
  type ProcessInput,
  type TransformStyle,
} from './edge';

/**
 * App-side upload orchestration (docs/02 §5): a prepared source image →
 * process-uploaded-image → a set of drawing-style variants → save to recents on
 * selection. The native bits (pick/capture/preprocess/upload-to-bucket) live in
 * the screen; this module owns the Edge call + child-safe shaping and is fully
 * unit-testable via injected deps (no Supabase / camera / network required).
 */

/** Variant keys shown in the grid (Original first, then the four styles). */
export const VARIANT_KEYS = ['original', 'line_art', 'sketch', 'coloring_page', 'cartoon'] as const;
export type VariantKey = (typeof VARIANT_KEYS)[number];

/** The four transform styles requested from the backend (Original is the source). */
export const UPLOAD_STYLES: readonly TransformStyle[] = ['line_art', 'sketch', 'cartoon', 'coloring_page'];

export interface UploadVariants {
  original: string;
  line_art: string | null;
  sketch: string | null;
  cartoon: string | null;
  coloring_page: string | null;
}

export interface UploadResultData {
  /** The local picked/captured uri — always displayable as the Original. */
  originalUri: string;
  variants: UploadVariants;
  provider: string;
  demo: boolean;
  status: 'complete' | 'partial' | 'failed';
}

export type UploadOutcome =
  | { status: 'error'; userMessage: string; retryable: boolean }
  | { status: 'done'; data: UploadResultData };

export type UploadPhase = 'processing';

export interface UploadDeps {
  process: (input: ProcessInput) => Promise<ProcessData>;
  onPhase?: (phase: UploadPhase) => void;
}

const defaultDeps: Pick<UploadDeps, 'process'> = {
  process: edgeProcessUploadedImage,
};

/**
 * Process a prepared image into variants. `uploadRef` (a storage path) is used
 * when the original was uploaded (configured mode); otherwise `originalUri` is
 * passed through (demo/mock). Returns a child-safe outcome.
 */
export async function processUpload(
  input: { originalUri: string; uploadRef?: string; styles?: TransformStyle[] },
  deps?: Partial<UploadDeps>,
): Promise<UploadOutcome> {
  const d: UploadDeps = { ...defaultDeps, ...deps };
  const styles = input.styles ?? [...UPLOAD_STYLES];

  try {
    d.onPhase?.('processing');
    const source: ProcessInput = input.uploadRef
      ? { uploadRef: input.uploadRef, styles }
      : { imageUrl: input.originalUri, styles };
    const res = await d.process(source);

    const variants: UploadVariants = {
      // Prefer the local uri for the Original (always renderable, even offline).
      original: input.originalUri,
      line_art: res.lineArtUrl,
      sketch: res.sketchUrl,
      cartoon: res.cartoonUrl,
      coloring_page: res.coloringPageUrl,
    };

    return {
      status: 'done',
      data: {
        originalUri: input.originalUri,
        variants,
        provider: res.demo ? 'mock' : 'cloud',
        demo: res.demo,
        status: res.status,
      },
    };
  } catch (err) {
    const e = toEdgeError(err);
    return { status: 'error', userMessage: e.userMessage, retryable: e.retryable };
  }
}

/** The variant url for a key (Original falls back to the source uri). */
export function variantUrl(data: UploadResultData, key: VariantKey): string | null {
  return key === 'original' ? data.originalUri : data.variants[key];
}

/** Build the recents entry for a selected variant (saved on selection, docs/02 §5). */
export function buildUploadRecentInput(data: UploadResultData, key: VariantKey): RecentInput {
  const selectedUrl = variantUrl(data, key) ?? data.originalUri;
  const thumb = isRenderableImage(selectedUrl)
    ? selectedUrl
    : isRenderableImage(data.originalUri)
      ? data.originalUri
      : null;
  return {
    type: 'uploaded_image',
    title: strings.upload.recentTitle,
    emoji: '🖼️',
    style: key,
    imageUrl: selectedUrl,
    originalUri: data.originalUri,
    variants: data.variants,
    thumbnailUrl: thumb,
    provider: data.provider,
    demo: data.demo,
  };
}
