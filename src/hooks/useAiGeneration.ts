import { useCallback, useRef, useState } from 'react';

import { createAiArt, type AiOutcome } from '@/services/ai';
import type { AgeRange } from '@/services/edge';

/**
 * UI state machine for the AI prompt flow (docs/02 §6). Wraps `createAiArt` and
 * surfaces friendly phase + error/block state for the screen to render. The
 * orchestration logic itself lives in `src/services/ai.ts` (unit-tested).
 */
export type AiStatus = 'idle' | 'moderating' | 'generating' | 'blocked' | 'error';

/** ms before the "Still adding a little magic…" copy kicks in. */
const LONG_RUNNING_MS = 6000;

export interface AiGenerationState {
  status: AiStatus;
  longRunning: boolean;
  rewritten: boolean;
  blockedMessage: string | null;
  errorMessage: string | null;
  retryable: boolean;
  run: (prompt: string, ageRange?: AgeRange) => Promise<AiOutcome>;
  reset: () => void;
}

export function useAiGeneration(): AiGenerationState {
  const [status, setStatus] = useState<AiStatus>('idle');
  const [longRunning, setLongRunning] = useState(false);
  const [rewritten, setRewritten] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryable, setRetryable] = useState(true);
  const longTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLongTimer = useCallback(() => {
    if (longTimer.current) {
      clearTimeout(longTimer.current);
      longTimer.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearLongTimer();
    setStatus('idle');
    setLongRunning(false);
    setRewritten(false);
    setBlockedMessage(null);
    setErrorMessage(null);
    setRetryable(true);
  }, [clearLongTimer]);

  const run = useCallback(
    async (prompt: string, ageRange?: AgeRange): Promise<AiOutcome> => {
      setLongRunning(false);
      setRewritten(false);
      setBlockedMessage(null);
      setErrorMessage(null);

      const outcome = await createAiArt(
        { prompt, ageRange },
        {
          onPhase: (phase) => {
            if (phase === 'moderating') setStatus('moderating');
            if (phase === 'generating') {
              setStatus('generating');
              clearLongTimer();
              longTimer.current = setTimeout(() => setLongRunning(true), LONG_RUNNING_MS);
            }
          },
          onRewrite: () => setRewritten(true),
        },
      );

      clearLongTimer();
      setLongRunning(false);

      if (outcome.status === 'blocked') {
        setStatus('blocked');
        setBlockedMessage(outcome.userMessage);
      } else if (outcome.status === 'error') {
        setStatus('error');
        setErrorMessage(outcome.userMessage);
        setRetryable(outcome.retryable);
      } else {
        setStatus('idle'); // screen navigates to the result
      }
      return outcome;
    },
    [clearLongTimer],
  );

  return {
    status,
    longRunning,
    rewritten,
    blockedMessage,
    errorMessage,
    retryable,
    run,
    reset,
  };
}
