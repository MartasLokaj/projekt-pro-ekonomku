import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { hardModeIssue, keyboardStates, WORD_LENGTH } from './logic';
import { restoreState, slovoReducer } from './reducer';
import { bounceTotal, revealTotal, type SlovoTimings } from './timings';
import type { SlovoProgress, SlovoPuzzle, SlovoResult } from './types';

export interface UseSlovoGameOptions {
  initialGuesses: string[];
  /** Optional Wordle "hard mode" (revealed hints must be reused). Off by default — not used by any mode today. */
  hardMode: boolean;
  timings: SlovoTimings;
  isAllowed: (word: string) => Promise<boolean>;
  onProgress?: (progress: SlovoProgress) => void;
  onComplete?: (result: SlovoResult) => void;
}

/** The single hook the Circular Words UI talks to. */
export function useSlovoGame(puzzle: SlovoPuzzle, options: UseSlovoGameOptions) {
  const { initialGuesses, hardMode, timings, isAllowed } = options;
  const [state, dispatch] = useReducer(slovoReducer, undefined, () => restoreState(puzzle.answer, initialGuesses));

  // Keep the latest callbacks without re-running effects.
  const callbacks = useRef(options);
  useEffect(() => {
    callbacks.current = options;
  });

  // A submit waits for the word list; ignore further Enters meanwhile.
  const [checking, setChecking] = useState(false);

  // ── Phase timers ────────────────────────────────────────────────────────
  useEffect(() => {
    if (state.phase === 'idle') return;
    const wait = state.phase === 'revealing' ? revealTotal(timings) : bounceTotal(timings);
    const t = window.setTimeout(() => dispatch({ type: state.phase === 'revealing' ? 'revealDone' : 'bounceDone' }), wait + 30);
    return () => window.clearTimeout(t);
  }, [state.phase, timings]);

  // ── Persistence ─────────────────────────────────────────────────────────
  const guessCount = state.guesses.length;
  const progressKey = `${guessCount}:${state.status}`;
  const lastSaved = useRef(progressKey);
  useEffect(() => {
    if (lastSaved.current === progressKey) return;
    lastSaved.current = progressKey;
    callbacks.current.onProgress?.({
      puzzleId: puzzle.id,
      guesses: state.guesses,
      status: state.status,
      updatedAt: new Date().toISOString(),
    });
  }, [progressKey, puzzle.id, state.guesses, state.status]);

  const isOver = state.status !== 'playing';
  const isSettled = isOver && state.phase === 'idle';
  const [finishedOnLoad] = useState(isOver);

  const result: SlovoResult | null = useMemo(
    () =>
      isOver
        ? {
            puzzleId: puzzle.id,
            puzzleNumber: puzzle.number,
            won: state.status === 'won',
            guessCount: state.guesses.length,
            evaluations: state.evaluations,
            completedAt: new Date().toISOString(),
          }
        : null,
    [isOver, puzzle, state.status, state.guesses.length, state.evaluations],
  );

  // Report a finished game once, after its animation has settled.
  const reported = useRef(finishedOnLoad);
  useEffect(() => {
    if (!isSettled || !result || reported.current) return;
    reported.current = true;
    callbacks.current.onComplete?.(result);
  }, [isSettled, result]);

  // ── Actions ─────────────────────────────────────────────────────────────
  const type = useCallback((letter: string) => dispatch({ type: 'type', letter }), []);
  const backspace = useCallback(() => dispatch({ type: 'backspace' }), []);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const submit = useCallback(async () => {
    const s = stateRef.current;
    if (checking || s.status !== 'playing' || s.phase !== 'idle') return;
    if (s.current.length < WORD_LENGTH) return dispatch({ type: 'reject', reason: 'short' });
    const word = s.current.join('');
    setChecking(true);
    let allowed = word === s.answer;
    try {
      allowed ||= await isAllowed(word);
    } catch (err) {
      // Word list unavailable (offline) — accept rather than block the player.
      console.error(err);
      allowed = true;
    } finally {
      setChecking(false);
    }
    const now = stateRef.current;
    if (now.current.join('') !== word || now.phase !== 'idle') return; // edited meanwhile
    if (!allowed) return dispatch({ type: 'reject', reason: 'unknown' });
    if (hardMode) {
      const issue = hardModeIssue(word, now.guesses, now.evaluations);
      if (issue) return dispatch({ type: 'reject', reason: 'hard', issue });
    }
    dispatch({ type: 'commit' });
  }, [checking, hardMode, isAllowed]);

  /** Keyboard colours only include rows whose flip has finished. */
  const keyboard = useMemo(
    () => keyboardStates(state.guesses.slice(0, state.revealedCount), state.evaluations, state.answer),
    [state.guesses, state.evaluations, state.revealedCount, state.answer],
  );

  return {
    state,
    keyboard,
    result,
    isOver,
    isSettled,
    finishedOnLoad,
    busy: checking || state.phase !== 'idle',
    type,
    backspace,
    submit,
  };
}
