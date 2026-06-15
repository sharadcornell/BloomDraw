// Server-side re-export of the SINGLE source of child-facing copy.
//
// All child-/parent-facing wording lives in src/lib/strings.ts (CLAUDE.md AI
// safety rules). The Edge Functions reuse the exact same strings so the block /
// rewrite / error copy can never drift between client and server. That file has
// no imports (pure data), so it loads cleanly under both Deno and Node/Jest.
export { strings } from '../../../src/lib/strings.ts';
