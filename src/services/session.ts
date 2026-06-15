import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

import type { AgeRangeId } from '@/types';

import { isSupabaseConfigured, supabase } from './supabase';

/**
 * Anonymous session handling (docs/03 §5, docs/04 §2.4).
 *
 * Identity is a device-local random UUID — NOT a secure identity (see RLS note
 * in 0002_rls.sql). When Supabase is configured we upsert `anonymous_sessions`;
 * otherwise we return a purely local session. Never blocks startup, never throws.
 */
const DEVICE_ID_KEY = 'bloomdraw-device-id';

export type LocalSession = {
  deviceId: string;
  configured: boolean;
  /** true only if the row was upserted to Supabase this call. */
  syncedRemote: boolean;
};

/** JS UUID fallback if expo-crypto is unavailable (e.g. in a test env). */
function fallbackUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Retrieve the stable device id, generating + persisting one on first run. */
export async function getDeviceId(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
  } catch {
    /* storage read failed — fall through and mint a fresh id */
  }
  let id: string | undefined;
  try {
    id = Crypto.randomUUID();
  } catch {
    /* expo-crypto unavailable — use the JS fallback below */
  }
  if (!id) id = fallbackUuid();
  try {
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  } catch {
    /* storage write failed — id is still usable for this run */
  }
  return id;
}

/**
 * Ensure an anonymous session exists. Upserts to Supabase when configured;
 * always resolves to a local session object (fail-soft when offline/unconfigured).
 */
export async function ensureSession(ageRange?: AgeRangeId | null): Promise<LocalSession> {
  const deviceId = await getDeviceId();
  const local: LocalSession = { deviceId, configured: isSupabaseConfigured, syncedRemote: false };
  if (!supabase) return local;

  try {
    const { error } = await supabase
      .from('anonymous_sessions')
      .upsert(
        {
          device_id: deviceId,
          selected_age_range: ageRange ?? null,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'device_id' },
      );
    if (error) return local;
    return { ...local, syncedRemote: true };
  } catch {
    return local;
  }
}

/** Best-effort update of the session's age band + last-seen (no-op when offline). */
export async function updateSessionAge(ageRange: AgeRangeId): Promise<void> {
  if (!supabase) return;
  try {
    const deviceId = await getDeviceId();
    await supabase
      .from('anonymous_sessions')
      .update({ selected_age_range: ageRange, last_seen_at: new Date().toISOString() })
      .eq('device_id', deviceId);
  } catch {
    /* offline / unconfigured — ignore */
  }
}
