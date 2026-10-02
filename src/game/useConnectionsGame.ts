import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import type { GameProgress, GameResult } from '../types/game';
import type { Puzzle } from '../types/puzzle';
import { createInitialState, gameReducer, restoreState, type GameState } from './gameReducer';
import { randomSeed } from './random';
import * as select from './selectors';
import { DEFAULT_TIMINGS, jumpTotal, type GameTimings } from './timings';

export interface UseConnectionsGameOptions {
  /** Saved guess history to resume from (localStorage today, a database later). */
  initialGuesses?: string[][];
  /** Animation timings — pass `REDUCED_TIMINGS` for reduced motion. */
  timings?: GameTimings;
  /**
   * Called after every submitted guess with a serializable snapshot.
   * EXTENSION POINT: sync this to your backend for cross-device progress.
   */
  onProgress?: (progress: GameProgress) => void;
  /** Called once when the game is decided (won or lost). */
  onComplete?: (result: GameResult) => void;
}

/**
 * The whole game in one hook: state, rules, and the animation-phase clock.
 * Components get plain data + action callbacks and never touch the reducer.
 */
export function useConnectionsGame(puzzle: Puzzle, options: UseConnectionsGameOptions = {}) {
  const { initialGuesses, timings = DEFAULT_TIMINGS } = options;

  const [state, dispatch] = useReducer(gameReducer, puzzle, (p): GameState =>
    initialGuesses?.length ? restoreState(p, initialGuesses) : createInitialState(p),
  );

  // Keep the latest callbacks without re-running effects.
  const callbacks = useRef(options);
  useEffect(() => {
    callbacks.current = options;
  });

  // ── Phase clock: advances animation phases after their visual duration ──
  const { phase } = state;
  useEffect(() => {
    let action: Parameters<typeof dispatch>[0] | null = null;
    let delay = 0;
    switch (phase.name) {
      case 'jumping':
        action = { type: 'RESOLVE_GUESS' };
        delay = jumpTotal(timings);
        break;
      case 'solving':
        action = { type: 'FINISH_SOLVE' };
        delay = timings.move;
        break;
      case 'shaking':
        action = { type: 'FINISH_SHAKE' };
        delay = timings.shake;
        break;
      case 'revealing':
        action = phase.categoryId === null ? { type: 'REVEAL_NEXT' } : { type: 'FINISH_REVEAL' };
        delay = phase.categoryId === null ? timings.revealGap : timings.move;
        break;
    }
    if (!action) return;
    const next = action;
    const timer = window.setTimeout(() => dispatch(next), delay);
    return () => window.clearTimeout(timer);
  }, [phase, timings]);

  // ── Persistence hooks ──
  // Report after every guess *and* when the game is decided (the final
  // status lands a moment after the last guess, once its animation ends).
  const progressKey = `${state.guesses.length}:${state.status}`;
  const reportedKey = useRef(progressKey);
  useEffect(() => {
    if (progressKey === reportedKey.current) return;
    reportedKey.current = progressKey;
    callbacks.current.onProgress?.({
      puzzleId: state.puzzle.id,
      guesses: state.guesses.map((g) => g.words),
      status: state.status,
      updatedAt: new Date().toISOString(),
    });
  }, [progressKey, state.guesses, state.puzzle.id, state.status]);

  const completionReported = useRef(state.status !== 'playing');
  useEffect(() => {
    if (state.status === 'playing' || completionReported.current) return;
    completionReported.current = true;
    const result = select.buildResult(state);
    if (result) callbacks.current.onComplete?.(result);
  }, [state]);

  // ── Actions ──
  const toggle = useCallback((word: string) => dispatch({ type: 'TOGGLE_WORD', word }), []);
  const deselectAll = useCallback(() => dispatch({ type: 'DESELECT_ALL' }), []);
  const shuffle = useCallback(() => dispatch({ type: 'SHUFFLE', seed: randomSeed() }), []);
  const submit = useCallback(() => dispatch({ type: 'SUBMIT' }), []);
  const dismissFeedback = useCallback(() => dispatch({ type: 'DISMISS_FEEDBACK' }), []);

  const derived = useMemo(
    () => ({
      rows: select.completedRows(state),
      mistakesMade: select.mistakesMade(state),
      canSubmit: select.canSubmit(state),
      isOver: select.isGameOver(state),
      isAnimating: select.isAnimating(state),
      /** Game decided *and* all end-of-game animations have finished. */
      isSettled: select.isGameOver(state) && !select.isAnimating(state),
      result: select.buildResult(state),
    }),
    [state],
  );

  return { state, ...derived, toggle, deselectAll, shuffle, submit, dismissFeedback };
}

export type ConnectionsGame = ReturnType<typeof useConnectionsGame>;
