import type { GuessOutcome } from '../types/game';
import type { Category, Difficulty, Puzzle } from '../types/puzzle';
import { normalizeWord } from '../data/validatePuzzle';
import { createRng, hashString, shuffle } from './random';

/** Pure, UI-free game rules. Shared by the reducer, tests and (later) a server. */

export const GROUP_SIZE = 4;
export const MAX_MISTAKES = 4;

export interface GuessEvaluation {
  outcome: GuessOutcome;
  /** The matched category when `outcome === 'correct'`. */
  category?: Category;
}

export function categoryOfWord(puzzle: Puzzle, word: string): Category | undefined {
  return puzzle.categories.find((c) => c.words.includes(word));
}

export function difficultyOfWord(puzzle: Puzzle, word: string): Difficulty {
  return categoryOfWord(puzzle, word)?.difficulty ?? 'yellow';
}

/** Correct = all 4 from one category; one-away = exactly 3 from one category. */
export function evaluateGuess(puzzle: Puzzle, words: readonly string[]): GuessEvaluation {
  let best: { category: Category; count: number } | null = null;
  for (const category of puzzle.categories) {
    const count = words.filter((w) => category.words.includes(w)).length;
    if (!best || count > best.count) best = { category, count };
  }
  if (best && best.count === GROUP_SIZE && words.length === GROUP_SIZE) {
    return { outcome: 'correct', category: best.category };
  }
  if (best && best.count === GROUP_SIZE - 1) return { outcome: 'one-away' };
  return { outcome: 'wrong' };
}

const guessKey = (words: readonly string[]) => words.map(normalizeWord).sort().join('|');

export function isSameGuess(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && guessKey(a) === guessKey(b);
}

/**
 * Moves `words` into the first four board slots by swapping them with the
 * tiles currently there (like the original game), so only 8 tiles travel.
 */
export function moveToFront(board: readonly string[], words: readonly string[]): string[] {
  const result = [...board];
  const target = new Set(words);
  const outgoing = result.slice(0, GROUP_SIZE).filter((w) => !target.has(w));
  const incoming = result.slice(GROUP_SIZE).filter((w) => target.has(w));
  outgoing.forEach((out, k) => {
    const a = result.indexOf(out);
    const b = result.indexOf(incoming[k]);
    [result[a], result[b]] = [result[b], result[a]];
  });
  return result;
}

/** True if any board row happens to contain a complete category. */
function hasGiveawayRow(board: readonly string[], puzzle: Puzzle): boolean {
  for (let row = 0; row < board.length; row += GROUP_SIZE) {
    const slice = board.slice(row, row + GROUP_SIZE);
    if (evaluateGuess(puzzle, slice).outcome === 'correct') return true;
  }
  return false;
}

/**
 * Initial tile order: shuffled deterministically from the puzzle id, so every
 * player (and every reload) sees the same starting grid — never with a whole
 * category sitting in one row.
 */
export function initialBoard(puzzle: Puzzle): string[] {
  const words = puzzle.categories.flatMap((c) => c.words);
  const rng = createRng(hashString(puzzle.id));
  let board = shuffle(words, rng);
  for (let i = 0; i < 20 && hasGiveawayRow(board, puzzle); i++) board = shuffle(words, rng);
  return board;
}
