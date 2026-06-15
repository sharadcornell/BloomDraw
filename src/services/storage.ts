import { supabase } from './supabase';

/**
 * Storage foundation (docs/04 §5, docs/05 §6). Typed, guarded helpers that the
 * upload (M8) and AI (M7) flows will build on. Nothing here implements the
 * upload/camera UI or calls AI, and none of it requires real buckets to exist
 * for a local app run.
 */
export const BUCKETS = {
  drawingAssets: 'drawing-assets', // public-read (non-sensitive preloaded art)
  userUploads: 'user-uploads', // private — signed URLs only
  aiGenerations: 'ai-generations', // private — signed URLs only
} as const;

export type BucketId = (typeof BUCKETS)[keyof typeof BUCKETS];

export type StorageResult =
  | { ok: true; url: string }
  | { ok: false; reason: 'unconfigured' | 'error' };

/** Public URL for a non-sensitive asset in the public `drawing-assets` bucket. */
export function getPublicUrl(bucket: BucketId, path: string): string | null {
  if (!supabase) return null;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/** Short-TTL signed URL for a private object (user-uploads / ai-generations). */
export async function getSignedUrl(
  bucket: BucketId,
  path: string,
  expiresInSeconds = 3600,
): Promise<StorageResult> {
  if (!supabase) return { ok: false, reason: 'unconfigured' };
  try {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
    if (error || !data?.signedUrl) return { ok: false, reason: 'error' };
    return { ok: true, url: data.signedUrl };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

/**
 * Upload bytes to a bucket. Foundation only — the upload/camera flow that calls
 * this arrives in Milestone 8. Returns an `unconfigured` result when offline.
 */
export async function uploadToBucket(
  bucket: BucketId,
  path: string,
  body: ArrayBuffer | Blob | Uint8Array,
  contentType?: string,
): Promise<StorageResult> {
  if (!supabase) return { ok: false, reason: 'unconfigured' };
  try {
    const { error } = await supabase.storage.from(bucket).upload(path, body, {
      contentType,
      upsert: false,
    });
    if (error) return { ok: false, reason: 'error' };
    // Private buckets: caller should request a signed URL; public: derive directly.
    if (bucket === BUCKETS.drawingAssets) {
      const url = getPublicUrl(bucket, path);
      return url ? { ok: true, url } : { ok: false, reason: 'error' };
    }
    return getSignedUrl(bucket, path);
  } catch {
    return { ok: false, reason: 'error' };
  }
}
