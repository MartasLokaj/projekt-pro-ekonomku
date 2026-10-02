/**
 * Colour of one letter after a guess:
 *  - correct: green — right letter, right place
 *  - present: yellow — right letter, wrong place
 *  - accent:  turquoise — the word has this letter with a different diacritic
 *             (E typed, Ě or É in the word); the position is not revealed
 *  - absent:  grey
 */
export type LetterState = 'correct' | 'present' | 'accent' | 'absent';

/** The English explanation shown after a game. */
export interface WordInfo {
  /** Part of speech, e.g. "noun", "verb", "noun (plural)". */
  type: string;
  /** What the word means, in simple English. */
  meaning: string;
  /** Where the word is used in the circular economy (from the ET CASE handbooks). */
  circular: string;
}

/** One task: the N-th word of the list. */
export interface SlovoPuzzle {
  /** e.g. `slovo-reuse` — keyed by the word, so saved progress survives a reorder. */
  id: string;
  /** 1-based position in the list ("Word 3 of 118"). */
  number: number;
  /** How many words there are in total. */
  total: number;
  /** Lower-case, NFC-normalised, exactly 5 letters. */
  answer: string;
  info: WordInfo;
}

/** A word in the list (for "All words" and for finding the next unfinished one). */
export interface SlovoSummary {
  id: string;
  number: number;
  answer: string;
}

export type SlovoStatus = 'playing' | 'won' | 'lost';

/** Saved progress — the list of submitted words is enough to rebuild the game. */
export interface SlovoProgress {
  puzzleId: string;
  guesses: string[];
  status: SlovoStatus;
  updatedAt: string;
}

/** A finished game — what stats and a future `saveSlovoResult()` consume. */
export interface SlovoResult {
  puzzleId: string;
  puzzleNumber: number;
  won: boolean;
  /** Number of guesses used (1–6). */
  guessCount: number;
  evaluations: LetterState[][];
  completedAt: string;
}
