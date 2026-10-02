import type { GameStatus, GuessRecord } from '../types/game';
import { DIFFICULTIES, type Category, type Puzzle } from '../types/puzzle';
import {
  evaluateGuess,
  GROUP_SIZE,
  initialBoard,
  isSameGuess,
  MAX_MISTAKES,
  moveToFront,
} from './gameLogic';
import { createRng, shuffle } from './random';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  GAME STATE MACHINE
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure reducer — no timers, no DOM, no storage. Animations are modelled as
 * explicit `phase`s; the `useConnectionsGame` hook advances them on a timer
 * and the UI simply renders whatever phase it is in.
 *
 *   idle ─SUBMIT→ jumping ─RESOLVE_GUESS→ solving ─FINISH_SOLVE→ idle
 *                                    └──→ shaking ─FINISH_SHAKE→ idle
 *                                                            └─(no lives)→ revealing ⟲ → idle
 */

export type Phase =
  | { name: 'idle' }
  /** Selected tiles bounce one after another before the guess is judged. */
  | { name: 'jumping' }
  /** Correct guess: tiles glide into the top free row. */
  | { name: 'solving'; categoryId: string }
  /** Wrong guess: selected tiles shake. */
  | { name: 'shaking'; outcome: 'one-away' | 'wrong' }
  /** Game lost: remaining categories are revealed one by one. */
  | { name: 'revealing'; categoryId: string | null };

export interface Feedback {
  /** Increments on every message so identical toasts re-trigger. */
  id: number;
  kind: 'one-away' | 'already-guessed';
}

export interface GameState {
  puzzle: Puzzle;
  /** Words still on the board, in display order. */
  board: string[];
  /** Currently selected words, in selection order (max 4). */
  selected: string[];
  /** Category ids solved by the player, in order. */
  solved: string[];
  /** Category ids auto-revealed after a loss, in order. */
  revealed: string[];
  guesses: GuessRecord[];
  mistakesRemaining: number;
  status: GameStatus;
  phase: Phase;
  feedback: Feedback | null;
}

export type GameAction =
  | { type: 'TOGGLE_WORD'; word: string }
  | { type: 'DESELECT_ALL' }
  | { type: 'SHUFFLE'; seed: number }
  | { type: 'SUBMIT' }
  | { type: 'RESOLVE_GUESS' }
  | { type: 'FINISH_SOLVE' }
  | { type: 'FINISH_SHAKE' }
  | { type: 'REVEAL_NEXT' }
  | { type: 'FINISH_REVEAL' }
  | { type: 'DISMISS_FEEDBACK' };

const IDLE: Phase = { name: 'idle' };

export function createInitialState(puzzle: Puzzle): GameState {
  return {
    puzzle,
    board: initialBoard(puzzle),
    selected: [],
    solved: [],
    revealed: [],
    guesses: [],
    mistakesRemaining: MAX_MISTAKES,
    status: 'playing',
    phase: IDLE,
    feedback: null,
  };
}

const findCategory = (state: GameState, id: string): Category =>
  state.puzzle.categories.find((c) => c.id === id)!;

const removeWords = (board: string[], words: readonly string[]) =>
  board.filter((w) => !words.includes(w));

/** Next category to reveal after a loss (easiest first). */
function nextUnsolved(state: GameState): Category | undefined {
  const done = new Set([...state.solved, ...state.revealed]);
  return [...state.puzzle.categories]
    .sort((a, b) => DIFFICULTIES.indexOf(a.difficulty) - DIFFICULTIES.indexOf(b.difficulty))
    .find((c) => !done.has(c.id));
}

const canInteract = (state: GameState) => state.status === 'playing' && state.phase.name === 'idle';

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'TOGGLE_WORD': {
      if (!canInteract(state) || !state.board.includes(action.word)) return state;
      if (state.selected.includes(action.word)) {
        return { ...state, selected: state.selected.filter((w) => w !== action.word) };
      }
      if (state.selected.length >= GROUP_SIZE) return state;
      return { ...state, selected: [...state.selected, action.word] };
    }

    case 'DESELECT_ALL':
      if (!canInteract(state) || state.selected.length === 0) return state;
      return { ...state, selected: [] };

    case 'SHUFFLE':
      if (!canInteract(state)) return state;
      return { ...state, board: shuffle(state.board, createRng(action.seed)) };

    case 'SUBMIT': {
      if (!canInteract(state) || state.selected.length !== GROUP_SIZE) return state;
      if (state.guesses.some((g) => isSameGuess(g.words, state.selected))) {
        return { ...state, feedback: { id: (state.feedback?.id ?? 0) + 1, kind: 'already-guessed' } };
      }
      return { ...state, phase: { name: 'jumping' }, feedback: null };
    }

    case 'RESOLVE_GUESS': {
      if (state.phase.name !== 'jumping') return state;
      const words = state.selected;
      const { outcome, category } = evaluateGuess(state.puzzle, words);
      const guesses = [...state.guesses, { words, outcome, categoryId: category?.id }];

      if (outcome === 'correct' && category) {
        return {
          ...state,
          guesses,
          board: moveToFront(state.board, category.words),
          phase: { name: 'solving', categoryId: category.id },
        };
      }

      const mistakesRemaining = state.mistakesRemaining - 1;
      return {
        ...state,
        guesses,
        mistakesRemaining,
        status: mistakesRemaining <= 0 ? 'lost' : state.status,
        phase: { name: 'shaking', outcome: outcome === 'one-away' ? 'one-away' : 'wrong' },
        feedback:
          outcome === 'one-away'
            ? { id: (state.feedback?.id ?? 0) + 1, kind: 'one-away' }
            : state.feedback,
      };
    }

    case 'FINISH_SOLVE': {
      if (state.phase.name !== 'solving') return state;
      const category = findCategory(state, state.phase.categoryId);
      const solved = [...state.solved, category.id];
      return {
        ...state,
        solved,
        board: removeWords(state.board, category.words),
        selected: [],
        status: solved.length === state.puzzle.categories.length ? 'won' : state.status,
        phase: IDLE,
      };
    }

    case 'FINISH_SHAKE': {
      if (state.phase.name !== 'shaking') return state;
      if (state.status === 'lost') {
        return { ...state, selected: [], phase: { name: 'revealing', categoryId: null } };
      }
      // A plain miss clears the selection; "one away" keeps it so the player
      // can swap a single tile.
      const keep = state.phase.outcome === 'one-away';
      return { ...state, selected: keep ? state.selected : [], phase: IDLE };
    }

    case 'REVEAL_NEXT': {
      if (state.phase.name !== 'revealing' || state.phase.categoryId !== null) return state;
      const next = nextUnsolved(state);
      if (!next) return { ...state, phase: IDLE };
      return {
        ...state,
        board: moveToFront(state.board, next.words),
        phase: { name: 'revealing', categoryId: next.id },
      };
    }

    case 'FINISH_REVEAL': {
      if (state.phase.name !== 'revealing' || state.phase.categoryId === null) return state;
      const category = findCategory(state, state.phase.categoryId);
      const after: GameState = {
        ...state,
        revealed: [...state.revealed, category.id],
        board: removeWords(state.board, category.words),
      };
      return { ...after, phase: nextUnsolved(after) ? { name: 'revealing', categoryId: null } : IDLE };
    }

    case 'DISMISS_FEEDBACK':
      return state.feedback ? { ...state, feedback: null } : state;

    default:
      return state;
  }
}

/**
 * Rebuilds a game instantly (no animations) from a saved guess history —
 * used to resume progress from localStorage today, or a database tomorrow.
 */
export function restoreState(puzzle: Puzzle, savedGuesses: readonly string[][]): GameState {
  let state = createInitialState(puzzle);

  for (const words of savedGuesses) {
    if (state.status !== 'playing') break;
    const valid =
      words.length === GROUP_SIZE &&
      new Set(words).size === GROUP_SIZE &&
      words.every((w) => state.board.includes(w));
    if (!valid || state.guesses.some((g) => isSameGuess(g.words, words))) continue;

    state = { ...state, selected: [...words], phase: { name: 'jumping' } };
    state = gameReducer(state, { type: 'RESOLVE_GUESS' });
    state = gameReducer(state, { type: state.phase.name === 'solving' ? 'FINISH_SOLVE' : 'FINISH_SHAKE' });
  }

  // A lost game is shown with every category revealed.
  while (state.phase.name === 'revealing') {
    state = gameReducer(state, { type: state.phase.categoryId === null ? 'REVEAL_NEXT' : 'FINISH_REVEAL' });
  }

  return { ...state, selected: [], feedback: null, phase: IDLE };
}
