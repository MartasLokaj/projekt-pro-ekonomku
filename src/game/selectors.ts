import type { GameResult } from '../types/game';
import type { Category, Difficulty } from '../types/puzzle';
import { difficultyOfWord, MAX_MISTAKES } from './gameLogic';
import type { GameState } from './gameReducer';

/** Derived, read-only views of `GameState`. */

export const mistakesMade = (s: GameState) => MAX_MISTAKES - s.mistakesRemaining;

export const isGameOver = (s: GameState) => s.status !== 'playing';

export const isAnimating = (s: GameState) => s.phase.name !== 'idle';

export const canSubmit = (s: GameState) =>
  s.status === 'playing' && s.phase.name === 'idle' && s.selected.length === 4;

const byId = (s: GameState, ids: string[]): Category[] =>
  ids.map((id) => s.puzzle.categories.find((c) => c.id === id)!).filter(Boolean);

/** Rows shown above the tiles: solved first, then revealed-after-loss. */
export const completedRows = (s: GameState) => [
  ...byId(s, s.solved).map((category) => ({ category, revealed: false })),
  ...byId(s, s.revealed).map((category) => ({ category, revealed: true })),
];

export const guessColors = (s: GameState): Difficulty[][] =>
  s.guesses.map((g) => g.words.map((w) => difficultyOfWord(s.puzzle, w)));

export function buildResult(s: GameState, completedAt = new Date().toISOString()): GameResult | null {
  if (s.status === 'playing') return null;
  return {
    puzzleId: s.puzzle.id,
    puzzleDate: s.puzzle.date,
    won: s.status === 'won',
    mistakes: mistakesMade(s),
    solvedOrder: [...s.solved],
    guessColors: guessColors(s),
    completedAt,
  };
}
