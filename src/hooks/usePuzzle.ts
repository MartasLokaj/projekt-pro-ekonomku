import { useCallback, useEffect, useState } from 'react';
import { loadPuzzle, PuzzleNotFoundError, type LoadedPuzzle } from '../data/puzzleRepository';
import type { ProgressStore } from '../services/progressStore';
import type { IsoDate, PuzzleMode } from '../types/puzzle';

export type PuzzleLoadState =
  | { status: 'loading' }
  | { status: 'error'; notFound: boolean }
  | { status: 'ready'; loaded: LoadedPuzzle; initialGuesses: string[][] };

type Settled = Exclude<PuzzleLoadState, { status: 'loading' }>;

/** Loads the puzzle for `date` and `mode`, plus the player's saved progress on it. */
export function usePuzzle(date: IsoDate, today: IsoDate, mode: PuzzleMode, progressStore: ProgressStore | null) {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<{ key: string; state: Settled } | null>(null);
  const key = `${mode}|${date}|${today}|${attempt}`;

  useEffect(() => {
    if (!progressStore) return;
    let alive = true;
    (async (): Promise<Settled> => {
      try {
        const loaded = await loadPuzzle(date, today, mode);
        const progress = await progressStore.load(loaded.puzzle.id);
        return { status: 'ready', loaded, initialGuesses: progress?.guesses ?? [] };
      } catch (err) {
        console.error(err);
        return { status: 'error', notFound: err instanceof PuzzleNotFoundError };
      }
    })().then((state) => alive && setSettled({ key, state }));
    return () => {
      alive = false;
    };
  }, [key, date, today, mode, progressStore]);

  // Anything settled for a different request is stale → still loading.
  const state: PuzzleLoadState = settled?.key === key && progressStore ? settled.state : { status: 'loading' };
  const retry = useCallback(() => setAttempt((a) => a + 1), []);
  return { state, retry };
}
