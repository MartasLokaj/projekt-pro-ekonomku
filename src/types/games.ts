import type { IsoDate } from './puzzle';

/** The games on the site, switched from the ☰ menu. */
export type GameId = 'spojeni' | 'slovo';

export const GAME_IDS: readonly GameId[] = ['spojeni', 'slovo'];

export const isGameId = (v: unknown): v is GameId => v === 'spojeni' || v === 'slovo';

/** Modals opened from the toolbar / menu; each game renders its own version. */
export type StageModal = 'help' | 'stats' | 'archive' | 'hint' | null;

/**
 * Where the player stands on the puzzle a stage just loaded — the welcome
 * screen picks its message and main button from it.
 *  - playing: `done` of `total` (Links: groups found of 4, Circular Words: guesses used of 6)
 */
export type PlayerProgress =
  | { kind: 'new' }
  | { kind: 'playing'; done: number; total: number }
  | { kind: 'won' }
  | { kind: 'lost' };

/** What a stage reports once its puzzle and the saved progress are loaded. */
export interface StageLoaded {
  id: string;
  date: IsoDate;
  /** 1-based running number ("Puzzle #7", "Word 2"). */
  number: number;
  progress: PlayerProgress;
  /**
   * Shown instead of the date under the title and on the welcome screen
   * (Circular Words has no dates: "Word 3 of 118").
   */
  label?: string;
}
