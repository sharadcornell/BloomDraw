// Rate-limit + session enforcement glue (DENO-ONLY — imports db.ts).
//
// Resolves the service client + the caller's session, and (in REAL mode only)
// enforces the per-device and global caps via the pure `checkRateLimit`. Throws
// a child-safe AppError when a limit is hit. Mock mode is always unlimited.
import { AppError } from './errors.ts';
import { checkRateLimit } from './rate-limit.ts';
import { countSince, ensureSessionId, getServiceClient, type ServiceClient } from './db.ts';
import { loadAiConfig } from './ai-provider/config.ts';
import { readDeviceId, type HeaderReader } from './validation.ts';

export interface EnforceResult {
  deviceId?: string;
  sessionId: string | null;
  client: ServiceClient | null;
}

/**
 * Always resolves the client + session (used for DB writes, even in mock mode
 * when Supabase is configured). Applies rate limits only in real mode. Throws
 * AppError('rate_limited' | 'global_limit_reached' | 'invalid_input') on a hit.
 */
export async function enforceLimits(headers: HeaderReader): Promise<EnforceResult> {
  const cfg = loadAiConfig();
  const client = getServiceClient();
  const deviceId = readDeviceId(headers);
  const sessionId = client && deviceId ? await ensureSessionId(client, deviceId) : null;

  // Mock mode → never limited. Real mode → enforce per-device then global.
  if (!cfg.useMock && cfg.rateLimit.enabled) {
    const sinceIso = new Date(Date.now() - cfg.rateLimit.windowHours * 3_600_000).toISOString();
    const decision = await checkRateLimit({
      cfg,
      hasDeviceId: Boolean(deviceId),
      countsAvailable: Boolean(client),
      getPerDeviceCount: () => (client && sessionId ? countSince(client, sinceIso, sessionId) : Promise.resolve(0)),
      getGlobalCount: () => (client ? countSince(client, sinceIso) : Promise.resolve(0)),
    });
    if (!decision.allowed) throw new AppError(decision.code);
  }

  return { deviceId, sessionId, client };
}
