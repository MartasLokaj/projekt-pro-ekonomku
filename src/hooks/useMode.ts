import { useCallback, useState } from 'react';
import { localStore } from '../services/storage';
import { isPuzzleMode, type PuzzleMode } from '../types/puzzle';

/** Mode shown to first-time players. */
export const DEFAULT_MODE: PuzzleMode = 'easy';

/** Easy / hard mode, remembered per browser. */
export function useMode() {
  const [mode, setModeState] = useState<PuzzleMode>(() => {
    const saved = localStore.get<unknown>('mode', null);
    return isPuzzleMode(saved) ? saved : DEFAULT_MODE;
  });

  const setMode = useCallback((next: PuzzleMode) => {
    setModeState(next);
    localStore.set('mode', next);
  }, []);

  return { mode, setMode };
}
