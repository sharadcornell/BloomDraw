import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/db';

/**
 * Guarded Supabase client (docs/03 §5, §10).
 *
 * - Initializes ONLY when both public env vars are present and FORCE_MOCK is off.
 * - Returns `null` (offline/unconfigured) otherwise — the app must keep running
 *   fully in local/mock mode with no crash.
 * - Client uses the ANON key only. The service-role key is NEVER read here and
 *   must never reach the app bundle.
 */
export type TypedSupabaseClient = SupabaseClient<Database>;

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const forceMock = process.env.EXPO_PUBLIC_FORCE_MOCK === 'true';

export const isSupabaseConfigured: boolean = Boolean(url && anonKey) && !forceMock;

function createSupabaseClient(): TypedSupabaseClient | null {
  // Re-check the raw values so TypeScript narrows them to defined strings.
  if (!url || !anonKey || forceMock) return null;
  return createClient<Database>(url, anonKey, {
    auth: {
      // No auth/login in V1, but provide RN storage + disable URL session detection.
      storage: AsyncStorage,
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export const supabase: TypedSupabaseClient | null = createSupabaseClient();

/** Convenience accessor (same instance as `supabase`). */
export function getSupabase(): TypedSupabaseClient | null {
  return supabase;
}
