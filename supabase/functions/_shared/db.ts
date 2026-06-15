// Service-role DB + storage access (docs/04, docs/05 §8). DENO-ONLY: this is the
// only shared module that imports the supabase-js npm package, so it is never
// imported by the Node/Jest tests (which exercise the pure logic instead).
//
// Rules (CLAUDE.md Supabase rules):
//   - Service-role key is read ONLY here, server-side; it bypasses RLS for the
//     activity-table writes the client is not allowed to do.
//   - Everything is best-effort: if Supabase is unconfigured OR a call fails, we
//     return null/0/false and the function still completes in mock mode. Never
//     crash, never throw to the handler from these helpers.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { getEnv } from './env.ts';
import type { ModerationStatus, ProviderName, TransformStyle } from './types.ts';

export type ServiceClient = SupabaseClient;

/** Service-role client, or null when Supabase is not configured for the function. */
export function getServiceClient(): ServiceClient | null {
  const url = getEnv('SUPABASE_URL') ?? getEnv('EXPO_PUBLIC_SUPABASE_URL');
  const serviceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Look up (or create) the anonymous_sessions row id for a device. */
export async function ensureSessionId(client: ServiceClient, deviceId: string): Promise<string | null> {
  try {
    const existing = await client
      .from('anonymous_sessions')
      .select('id')
      .eq('device_id', deviceId)
      .maybeSingle();
    if (existing.data?.id) {
      await client
        .from('anonymous_sessions')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', existing.data.id);
      return existing.data.id as string;
    }
    const inserted = await client
      .from('anonymous_sessions')
      .insert({ device_id: deviceId })
      .select('id')
      .single();
    return (inserted.data?.id as string | undefined) ?? null;
  } catch (e) {
    console.error('[db] ensureSessionId failed', String(e));
    return null;
  }
}

/** Count ai_generations + uploaded_images rows in the window (rate-limit accounting).
 *  Pass `sessionId` for the per-device count; omit it for the global count. */
export async function countSince(
  client: ServiceClient,
  sinceIso: string,
  sessionId?: string | null,
): Promise<number> {
  try {
    const counts = await Promise.all(
      ['ai_generations', 'uploaded_images'].map(async (table) => {
        let q = client.from(table).select('id', { count: 'exact', head: true }).gte('created_at', sinceIso);
        if (sessionId) q = q.eq('anonymous_session_id', sessionId);
        const { count } = await q;
        return count ?? 0;
      }),
    );
    return counts.reduce((a, b) => a + b, 0);
  } catch (e) {
    console.error('[db] countSince failed', String(e));
    return 0;
  }
}

export interface NewGeneration {
  sessionId: string | null;
  originalPrompt: string;
  safePrompt: string;
  moderationStatus: ModerationStatus;
  provider: ProviderName;
}

export async function insertGeneration(client: ServiceClient, g: NewGeneration): Promise<string | null> {
  try {
    const { data } = await client
      .from('ai_generations')
      .insert({
        anonymous_session_id: g.sessionId,
        input_type: 'prompt',
        original_prompt: g.originalPrompt,
        safe_prompt: g.safePrompt,
        moderation_status: g.moderationStatus,
        generation_status: 'processing',
        provider: g.provider,
      })
      .select('id')
      .single();
    return (data?.id as string | undefined) ?? null;
  } catch (e) {
    console.error('[db] insertGeneration failed', String(e));
    return null;
  }
}

export async function updateGeneration(
  client: ServiceClient,
  id: string,
  patch: Record<string, unknown>,
): Promise<void> {
  try {
    await client.from('ai_generations').update(patch).eq('id', id);
  } catch (e) {
    console.error('[db] updateGeneration failed', String(e));
  }
}

export interface NewUpload {
  sessionId: string | null;
  originalImageUrl: string;
}

export async function insertUploaded(client: ServiceClient, u: NewUpload): Promise<string | null> {
  try {
    const { data } = await client
      .from('uploaded_images')
      .insert({
        anonymous_session_id: u.sessionId,
        original_image_url: u.originalImageUrl,
        processed_status: 'processing',
      })
      .select('id')
      .single();
    return (data?.id as string | undefined) ?? null;
  } catch (e) {
    console.error('[db] insertUploaded failed', String(e));
    return null;
  }
}

export async function updateUploaded(
  client: ServiceClient,
  id: string,
  patch: Record<string, unknown>,
): Promise<void> {
  try {
    await client.from('uploaded_images').update(patch).eq('id', id);
  } catch (e) {
    console.error('[db] updateUploaded failed', String(e));
  }
}

/** Short-TTL signed URL for a private storage object referenced as
 *  "bucket/path/to/object" (e.g. "user-uploads/<device>/<uuid>.jpg"). */
export async function signedUrlForRef(
  client: ServiceClient,
  uploadRef: string,
  expiresInSeconds = 3600,
): Promise<string | null> {
  try {
    const slash = uploadRef.indexOf('/');
    if (slash <= 0) return null;
    const bucket = uploadRef.slice(0, slash);
    const path = uploadRef.slice(slash + 1);
    const { data } = await client.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
    return data?.signedUrl ?? null;
  } catch (e) {
    console.error('[db] signedUrlForRef failed', String(e));
    return null;
  }
}

/** Map a TransformStyle to its uploaded_images column. */
export const STYLE_COLUMN: Record<TransformStyle, string> = {
  line_art: 'line_art_url',
  sketch: 'sketch_url',
  cartoon: 'cartoon_url',
  coloring_page: 'coloring_page_url',
};
