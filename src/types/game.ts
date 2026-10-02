import type { Difficulty, IsoDate, PuzzleMode } from './puzzle';

export type GuessOutcome = 'correct' | 'one-away' | 'wrong';

export interface GuessRecord {
  /** The four submitted words, in the order the player selected them. */
  words: string[];
  outcome: GuessOutcome;
  /** Set when outcome === 'correct'. */
  categoryId?: string;
}

export type GameStatus = 'playing' | 'won' | 'lost';

/**
 * Serializable snapshot of a player's progress on one puzzle.
 *
 * The guess history is enough to rebuild the full game state, which makes it
 * the ideal thing to sync to a backend (one row per user + puzzle).
 */
export interface GameProgress {
  puzzleId: string;
  /** Each guess as the list of submitted words. */
  guesses: string[][];
  status: GameStatus;
  updatedAt: string;
}

/** Final result of a finished game — what stats & `saveResult()` consume. */
export interface GameResult {
  puzzleId: string;
  puzzleDate: IsoDate;
  /** Filled in by the app (the game logic itself is mode-agnostic). */
  mode?: PuzzleMode;
  won: boolean;
  mistakes: number;
  /** Category ids in the order the player solved them. */
  solvedOrder: string[];
  /** One row per guess, one difficulty per word — basis of the emoji grid. */
  guessColors: Difficulty[][];
  completedAt: string;
}
