// Portable env access (docs/03 §10, docs/09 §5).
//
// Works in BOTH the Deno Edge runtime (`Deno.env`) and Node/Jest (`process.env`)
// so the pure shared logic is testable. Secrets are read here, server-side only;
// they must NEVER reach the app bundle.

type DenoLike = { env?: { get(key: string): string | undefined } };
type ProcLike = { env?: Record<string, string | undefined> };

function rawEnv(name: string): string | undefined {
  const g = globalThis as { Deno?: DenoLike; process?: ProcLike };
  if (g.Deno?.env?.get) return g.Deno.env.get(name);
  if (g.process?.env) return g.process.env[name];
  return undefined;
}

/** Returns the env value, or undefined when missing/empty. */
export function getEnv(name: string): string | undefined {
  const v = rawEnv(name);
  return v === undefined || v === '' ? undefined : v;
}

export function getBool(name: string, fallback: boolean): boolean {
  const v = getEnv(name);
  if (v === undefined) return fallback;
  const s = v.toLowerCase();
  if (s === 'true' || s === '1' || s === 'yes') return true;
  if (s === 'false' || s === '0' || s === 'no') return false;
  return fallback;
}

export function getInt(name: string, fallback: number): number {
  const v = getEnv(name);
  if (v === undefined) return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

/** Returns a finite number, or null when missing/blank/invalid. */
export function getNumberOrNull(name: string): number | null {
  const v = getEnv(name);
  if (v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function hasEnv(name: string): boolean {
  return getEnv(name) !== undefined;
}
