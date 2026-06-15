/// <reference types="jest" />

import { CATEGORIES, DRAWING_ITEMS } from '@/content';
import { buildSeedSql } from '@/content/seed';

// Read fs via Jest's own loader (typed by @types/jest) — no node-types pollution.
const fs = jest.requireActual('fs') as { readFileSync: (p: string, e: string) => string };

const sql = buildSeedSql();
const totalSteps = DRAWING_ITEMS.reduce((n, item) => n + item.steps.length, 0);

describe('generated seed SQL', () => {
  it('is a transaction with the auto-generated header', () => {
    expect(sql.startsWith('-- AUTO-GENERATED')).toBe(true);
    expect(sql).toContain('begin;');
    expect(sql).toContain('commit;');
  });

  it('inserts all 8 categories', () => {
    expect(sql).toContain('insert into drawing_categories');
    for (const c of CATEGORIES) expect(sql).toContain(`'${c.slug}'`);
  });

  it('inserts one row per drawing item (via category subselect)', () => {
    expect(sql).toContain('insert into drawing_items');
    const matches = sql.match(/\(select id from drawing_categories where slug = /g) ?? [];
    expect(matches.length).toBe(DRAWING_ITEMS.length);
    expect(DRAWING_ITEMS.length).toBe(100);
  });

  it('inserts a step row for every authored step', () => {
    expect(sql).toContain('insert into drawing_steps');
    const matches = sql.match(/\(select id from drawing_items where slug = /g) ?? [];
    expect(matches.length).toBe(totalSteps);
  });

  it('escapes single quotes in text', () => {
    expect(sql).toContain("Mother''s Day Card");
  });

  it('committed supabase/seed.sql matches the generator (no drift)', () => {
    const onDisk = fs.readFileSync('supabase/seed.sql', 'utf8');
    expect(onDisk.trim()).toBe(sql.trim());
  });
});
