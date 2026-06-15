/**
 * Generates supabase/seed.sql from src/content (source of truth).
 * Run: `npm run seed:gen`
 *
 * Uses relative imports so it runs under tsx without tsconfig path-alias
 * resolution (the content module graph only imports `@/types` as type-only,
 * which is erased at runtime). This file is excluded from `tsc` (dev tool).
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { buildSeedSql } from '../src/content/seed';

// npm scripts run from the package root.
const outPath = resolve(process.cwd(), 'supabase/seed.sql');

writeFileSync(outPath, buildSeedSql(), 'utf8');
console.log(`Wrote ${outPath}`);
