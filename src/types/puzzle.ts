/**
 * Puzzle schema — the single source of truth for what a daily puzzle looks like.
 *
 * The same shape is used by:
 *  - the static JSON files in `public/data/puzzles/YYYY-MM-DD.json`
 *  - the build-time validator (`scripts/puzzleManifestPlugin.ts`)
 *  - a future API / database row (e.g. a Supabase `puzzles` table with a
 *    `categories jsonb` column) — keep it backwards compatible.
 */

export type Difficulty = 'yellow' | 'green' | 'blue' | 'purple';

/** Difficulty order, easiest → hardest. Used for sorting & reveal order. */
export const DIFFICULTIES: readonly Difficulty[] = ['yellow', 'green', 'blue', 'purple'];

/**
 * Game modes. Each mode has its own daily puzzle, archive and stats.
 *  - easy: straightforward groups, few decoys
 *  - hard: wordplay, several words that seem to fit two groups
 */
export type PuzzleMode = 'easy' | 'hard';
export const PUZZLE_MODES: readonly PuzzleMode[] = ['easy', 'hard'];
export const isPuzzleMode = (v: unknown): v is PuzzleMode => v === 'easy' || v === 'hard';

/** ISO calendar date, `YYYY-MM-DD` (no time, no timezone). */
export type IsoDate = string;

export interface Category {
  id: string;
  /** Shown on the solved row, e.g. "R STRATEGIES". */
  name: string;
  difficulty: Difficulty;
  /** Exactly 4 words / short phrases. */
  words: string[];
}

export interface Puzzle {
  id: string;
  /** ISO date the puzzle is published for. */
  date: IsoDate;
  /** Exactly 4 categories, one per difficulty. */
  categories: Category[];
  /** Optional metadata — handy for a future admin/editor view. */
  author?: string;
}

/** Lightweight entry used for the archive list and "latest puzzle" fallbacks. */
export interface PuzzleSummary {
  id: string;
  date: IsoDate;
  /** 1-based running number ("Puzzle #5"). */
  number: number;
}
