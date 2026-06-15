import { CATEGORIES, DRAWING_ITEMS } from './index';

/**
 * Generates `supabase/seed.sql` from `src/content` (the single source of truth).
 *
 * Relationships use slug-keyed subselects so the seed needs no hard-coded UUIDs
 * and is deterministic (same content → identical SQL), which lets a test detect
 * drift between the committed seed and the content. Run via `npm run seed:gen`.
 *
 * Note: the app-side `emoji` is a local placeholder hint, not a DB column
 * (docs/04 §2.2), so it is intentionally not seeded.
 */
function esc(value: string): string {
  return value.replace(/'/g, "''");
}

function sqlBool(value: boolean): string {
  return value ? 'true' : 'false';
}

export function buildSeedSql(): string {
  const lines: string[] = [];
  lines.push('-- AUTO-GENERATED from src/content by scripts/generate-seed.ts.');
  lines.push('-- Do not edit by hand — run `npm run seed:gen` to regenerate.');
  lines.push('');
  lines.push('begin;');
  lines.push('');

  // Categories
  lines.push('insert into drawing_categories (slug, name, description, icon, sort_order) values');
  lines.push(
    CATEGORIES.map(
      (c) =>
        `  ('${esc(c.slug)}', '${esc(c.name)}', '${esc(c.description)}', '${esc(c.emoji)}', ${c.sortOrder})`,
    ).join(',\n'),
  );
  lines.push('on conflict (slug) do nothing;');
  lines.push('');

  // Items (category_id resolved by slug subselect)
  lines.push(
    'insert into drawing_items (slug, category_id, title, description, age_min, age_max, difficulty, is_featured, is_placeholder) values',
  );
  lines.push(
    DRAWING_ITEMS.map(
      (item) =>
        `  ('${esc(item.slug)}', (select id from drawing_categories where slug = '${esc(item.categorySlug)}'), ` +
        `'${esc(item.title)}', '${esc(item.description)}', ${item.ageMin}, ${item.ageMax}, ` +
        `'${item.difficulty}', ${sqlBool(item.isFeatured)}, ${sqlBool(item.isPlaceholder)})`,
    ).join(',\n'),
  );
  lines.push('on conflict (slug) do nothing;');
  lines.push('');

  // Steps (drawing_item_id resolved by slug subselect)
  const stepRows: string[] = [];
  for (const item of DRAWING_ITEMS) {
    for (const step of item.steps) {
      stepRows.push(
        `  ((select id from drawing_items where slug = '${esc(item.slug)}'), ${step.stepNumber}, ` +
          `'${esc(step.title)}', '${esc(step.instruction)}')`,
      );
    }
  }
  lines.push('insert into drawing_steps (drawing_item_id, step_number, title, instruction) values');
  lines.push(stepRows.join(',\n'));
  lines.push('on conflict (drawing_item_id, step_number) do nothing;');
  lines.push('');
  lines.push('commit;');
  lines.push('');

  return lines.join('\n');
}
