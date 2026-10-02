import { evaluateGuess, isSolved, MAX_GUESSES, WORD_LENGTH, type HardModeIssue } from './logic';
import type { LetterState, SlovoStatus } from './types';

/**
 * Animation phases. The reducer stays pure: the hook advances phases on a
 * timer and components only render the current one.
 *  - revealing: the last submitted row flips tile by tile
 *  - bouncing:  the winning row jumps
 */
export type SlovoPhase = 'idle' | 'revealing' | 'bouncing';

export type RejectReason = 'short' | 'unknown' | 'hard';

export interface SlovoFeedback {
  /** Increments on every rejection so repeated shakes re-trigger. */
  id: number;
  reason: RejectReason;
  issue?: HardModeIssue;
}

export interface SlovoState {
  answer: string;
  guesses: string[];
  evaluations: LetterState[][];
  /** Letters typed into the active row. */
  current: string[];
  status: SlovoStatus;
  phase: SlovoPhase;
  /** Rows whose colours are fully revealed (the keyboard only colours these). */
  revealedCount: number;
  feedback: SlovoFeedback | null;
}

export type SlovoAction =
  | { type: 'type'; letter: string }
  | { type: 'backspace' }
  | { type: 'reject'; reason: RejectReason; issue?: HardModeIssue }
  | { type: 'commit' }
  | { type: 'revealDone' }
  | { type: 'bounceDone' };

function statusAfter(evaluations: LetterState[][]): SlovoStatus {
  if (evaluations.some(isSolved)) return 'won';
  return evaluations.length >= MAX_GUESSES ? 'lost' : 'playing';
}

/** Rebuilds a game instantly (no animations) from the saved list of guesses. */
export function restoreState(answer: string, guesses: string[]): SlovoState {
  const kept: string[] = [];
  const evaluations: LetterState[][] = [];
  for (const g of guesses) {
    if (statusAfter(evaluations) !== 'playing') break;
    kept.push(g);
    evaluations.push(evaluateGuess(g, answer));
  }
  return {
    answer,
    guesses: kept,
    evaluations,
    current: [],
    status: statusAfter(evaluations),
    phase: 'idle',
    revealedCount: kept.length,
    feedback: null,
  };
}

const canEdit = (s: SlovoState) => s.status === 'playing' && s.phase === 'idle';

export function slovoReducer(state: SlovoState, action: SlovoAction): SlovoState {
  switch (action.type) {
    case 'type':
      if (!canEdit(state) || state.current.length >= WORD_LENGTH) return state;
      return { ...state, current: [...state.current, action.letter] };

    case 'backspace':
      if (!canEdit(state) || state.current.length === 0) return state;
      return { ...state, current: state.current.slice(0, -1) };

    case 'reject':
      if (!canEdit(state)) return state;
      return {
        ...state,
        feedback: { id: (state.feedback?.id ?? 0) + 1, reason: action.reason, issue: action.issue },
      };

    case 'commit': {
      if (!canEdit(state) || state.current.length !== WORD_LENGTH) return state;
      const guess = state.current.join('');
      const evaluations = [...state.evaluations, evaluateGuess(guess, state.answer)];
      return {
        ...state,
        guesses: [...state.guesses, guess],
        evaluations,
        current: [],
        status: statusAfter(evaluations),
        phase: 'revealing',
      };
    }

    case 'revealDone':
      if (state.phase !== 'revealing') return state;
      return {
        ...state,
        revealedCount: state.guesses.length,
        phase: state.status === 'won' ? 'bouncing' : 'idle',
      };

    case 'bounceDone':
      return state.phase === 'bouncing' ? { ...state, phase: 'idle' } : state;

    default:
      return state;
  }
}
