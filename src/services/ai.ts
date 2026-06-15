import { strings } from '@/lib/strings';
import { recents, type RecentInput } from '@/state';
import type { RecentCreation } from '@/types';

import {
  generateImage as edgeGenerateImage,
  moderatePrompt as edgeModeratePrompt,
  toEdgeError,
  type AgeRange,
  type GenerationData,
  type ModerationData,
} from './edge';

/**
 * App-side AI orchestration (docs/02 §6): validate → moderate → (block | rewrite |
 * safe) → generate → save to recents. The transport (real vs mock) lives in
 * `edge.ts`; this module owns the flow + child-safe outcome shaping and is fully
 * unit-testable via injected deps (no Supabase / network required).
 */

export const PROMPT_MIN = 1;
export const PROMPT_MAX = 300;

export function isValidPrompt(prompt: string): boolean {
  const t = prompt.trim();
  return t.length >= PROMPT_MIN && t.length <= PROMPT_MAX;
}

/** A short, friendly title for the recents entry. */
export function titleFromPrompt(prompt: string): string {
  const t = prompt.trim().replace(/\s+/g, ' ');
  const short = t.length > 30 ? `${t.slice(0, 30).trim()}…` : t;
  return short.charAt(0).toUpperCase() + short.slice(1);
}

export type AiPhase = 'moderating' | 'generating' | 'saving';

export interface AiResultData {
  prompt: string;
  safePrompt: string;
  rewritten: boolean;
  imageUrl: string;
  lineArtUrl: string | null;
  provider: string;
  demo: boolean;
}

export type AiOutcome =
  | { status: 'blocked'; userMessage: string }
  | { status: 'error'; userMessage: string; retryable: boolean }
  | { status: 'done'; recent: RecentCreation; data: AiResultData };

export interface AiDeps {
  moderate: (input: { prompt: string; ageRange?: AgeRange }) => Promise<ModerationData>;
  generate: (input: {
    safePrompt: string;
    ageRange?: AgeRange;
    options?: { lineArt?: boolean };
  }) => Promise<GenerationData>;
  addRecent: (input: RecentInput) => RecentCreation;
  onPhase?: (phase: AiPhase) => void;
  onRewrite?: () => void;
}

const defaultDeps: Omit<AiDeps, 'onPhase' | 'onRewrite'> = {
  moderate: edgeModeratePrompt,
  generate: edgeGenerateImage,
  addRecent: (input) => recents.add(input),
};

function isHttp(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/**
 * Run the full prompt → safety → image flow. Returns a child-safe outcome:
 *   - `blocked` → moderation blocked; generation is NOT called.
 *   - `error`   → validation/provider/limit error with a child-safe message.
 *   - `done`    → image + line art produced and saved to recents.
 */
export async function createAiArt(
  input: { prompt: string; ageRange?: AgeRange },
  deps?: Partial<AiDeps>,
): Promise<AiOutcome> {
  const d: AiDeps = { ...defaultDeps, ...deps };
  const prompt = input.prompt.trim();

  if (!isValidPrompt(prompt)) {
    return { status: 'error', userMessage: strings.errors.invalidInput, retryable: false };
  }

  try {
    d.onPhase?.('moderating');
    const moderation = await d.moderate({ prompt, ageRange: input.ageRange });

    if (moderation.status === 'blocked') {
      return { status: 'blocked', userMessage: moderation.userMessage || strings.safety.blocked };
    }

    const rewritten = moderation.status === 'rewritten';
    const safePrompt = moderation.safePrompt || prompt;
    if (rewritten) d.onRewrite?.();

    d.onPhase?.('generating');
    const gen = await d.generate({ safePrompt, ageRange: input.ageRange, options: { lineArt: true } });

    d.onPhase?.('saving');
    const recent = d.addRecent({
      type: 'ai_generation',
      title: titleFromPrompt(prompt),
      emoji: '✨',
      prompt,
      safePrompt,
      rewritten,
      imageUrl: gen.imageUrl,
      lineArtUrl: gen.lineArtUrl,
      // Only store an http thumbnail (real mode); demo data URLs aren't list-rendered.
      thumbnailUrl: isHttp(gen.imageUrl) ? gen.imageUrl : null,
      provider: gen.provider,
      demo: gen.demo,
    });

    return {
      status: 'done',
      recent,
      data: {
        prompt,
        safePrompt,
        rewritten,
        imageUrl: gen.imageUrl,
        lineArtUrl: gen.lineArtUrl,
        provider: gen.provider,
        demo: gen.demo,
      },
    };
  } catch (err) {
    const e = toEdgeError(err);
    return { status: 'error', userMessage: e.userMessage, retryable: e.retryable };
  }
}
