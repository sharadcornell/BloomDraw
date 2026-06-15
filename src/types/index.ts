/**
 * Shared app types. Expands in later milestones (DrawingItem, Category, etc.).
 * See docs/04-database-schema.md §1 and docs/05-api-contract.md §1 for the
 * DB-row vs API-response split that lands with Supabase (Milestone 5).
 */

export type AgeRangeId = '3-5' | '6-8' | '9-12';

export type Difficulty = 'easy' | 'medium' | 'hard';
