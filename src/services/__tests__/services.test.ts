/// <reference types="jest" />

// AsyncStorage native module is null under Jest — use the official mock so the
// session + client modules import cleanly. (global `jest.mock` is hoisted.)
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import { ensureSession, getDeviceId } from '@/services/session';
import { getSupabase, isSupabaseConfigured, supabase } from '@/services/supabase';

// Read fs via Jest's own loader (typed by @types/jest) — no node-types pollution
// and no `require` binding that would clash with the hoisted jest.mock above.
// cwd === project root under Jest.
const fs = jest.requireActual('fs') as {
  readdirSync: (p: string, o: { withFileTypes: true }) => { name: string; isDirectory: () => boolean }[];
  readFileSync: (p: string, e: string) => string;
};

describe('supabase client (unconfigured / offline)', () => {
  it('is null and reports unconfigured when env vars are absent', () => {
    expect(isSupabaseConfigured).toBe(false);
    expect(supabase).toBeNull();
    expect(getSupabase()).toBeNull();
  });
});

describe('anonymous session (works locally without Supabase)', () => {
  it('returns a stable local session and never throws', async () => {
    const session = await ensureSession('6-8');
    expect(typeof session.deviceId).toBe('string');
    expect(session.deviceId.length).toBeGreaterThan(0);
    expect(session.configured).toBe(false);
    expect(session.syncedRemote).toBe(false);
  });

  it('reuses the same device id across calls', async () => {
    const a = await getDeviceId();
    const b = await getDeviceId();
    expect(a).toBe(b);
  });
});

describe('no secret env in client code', () => {
  const FORBIDDEN = ['SUPABASE_SERVICE_ROLE_KEY', 'OPENAI_API_KEY', 'REPLICATE_API_TOKEN'];

  const listSources = (dir: string): string[] => {
    const out: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }) as {
      name: string;
      isDirectory: () => boolean;
    }[]) {
      if (entry.name === '__tests__') continue; // tests legitimately mention the names
      const full = `${dir}/${entry.name}`;
      if (entry.isDirectory()) out.push(...listSources(full));
      else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
    }
    return out;
  };

  it('never references server-only secret env vars from src/ or app/', () => {
    const files = [...listSources('src'), ...listSources('app')];
    const offenders: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8') as string;
      for (const secret of FORBIDDEN) {
        if (content.includes(secret)) offenders.push(`${file} → ${secret}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
