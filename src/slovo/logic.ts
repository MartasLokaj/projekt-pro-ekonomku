import type { LetterState } from './types';

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;

/** English alphabet as used by the game (no letters with diacritics). */
export const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';
const LETTER_SET = new Set(ALPHABET);

/** Lower case + composed form, so a letter typed on any keyboard matches the word list. */
export function normalizeWord(word: string): string {
  return word.normalize('NFC').trim().toLocaleLowerCase('en');
}

/** Returns the normalised letter, or null when `key` is not a playable letter. */
export function toLetter(key: string): string | null {
  const ch = normalizeWord(key);
  return Array.from(ch).length === 1 && LETTER_SET.has(ch) ? ch : null;
}

export function letters(word: string): string[] {
  return Array.from(word);
}

export const displayLetter = (ch: string) => ch.toLocaleUpperCase('en');

/** The letter without diacritics: Ě → e, Ů → u, Ř → r. */
export const baseLetter = (ch: string) => ch.normalize('NFD').charAt(0);

/**
 * Wordle colouring with correct handling of repeated letters: greens are
 * assigned first, then yellows only while unmatched copies of that letter
 * remain in the answer. Finally, a still-grey letter turns turquoise
 * ("accent") when an unmatched letter of the answer differs from it only by
 * its diacritic (E vs É/Ě, U vs Ú/Ů). Accent says nothing about the position.
 */
export function evaluateGuess(guess: string, answer: string): LetterState[] {
  const g = letters(guess);
  const a = letters(answer);
  const result: LetterState[] = g.map(() => 'absent');
  const unmatched = new Map<string, number>();

  g.forEach((ch, i) => {
    if (ch === a[i]) result[i] = 'correct';
    else unmatched.set(a[i], (unmatched.get(a[i]) ?? 0) + 1);
  });
  g.forEach((ch, i) => {
    if (result[i] === 'correct') return;
    const left = unmatched.get(ch) ?? 0;
    if (left > 0) {
      result[i] = 'present';
      unmatched.set(ch, left - 1);
    }
  });
  g.forEach((ch, i) => {
    if (result[i] !== 'absent') return;
    const variant = [...unmatched].find(([other, left]) => left > 0 && other !== ch && baseLetter(other) === baseLetter(ch));
    if (variant) {
      result[i] = 'accent';
      unmatched.set(variant[0], variant[1] - 1);
    }
  });
  return result;
}

export const isSolved = (evaluation: LetterState[]) => evaluation.every((s) => s === 'correct');

const RANK: Record<LetterState, number> = { absent: 0, accent: 1, present: 2, correct: 3 };

export interface KeyboardInfo {
  /** Best known state per letter. */
  states: Record<string, LetterState>;
  /**
   * Letters revealed by a turquoise tile: the form with the diacritic that is
   * really in the word (typed E → the keyboard lights up Ě, not É).
   */
  variants: Set<string>;
}

/**
 * Colours for the on-screen keyboard. A turquoise tile lights up only the key
 * of the form that is really in the word (Ě); the typed key (E) turns grey
 * like any other miss.
 */
export function keyboardStates(guesses: string[], evaluations: LetterState[][], answer: string): KeyboardInfo {
  const states: Record<string, LetterState> = {};
  const variants = new Set<string>();
  const raise = (ch: string, next: LetterState) => {
    const prev = states[ch];
    if (!prev || RANK[next] > RANK[prev]) states[ch] = next;
  };
  const answerLetters = letters(answer);
  guesses.forEach((guess, r) => {
    letters(guess).forEach((ch, i) => {
      const next = evaluations[r]?.[i];
      if (!next) return;
      raise(ch, next === 'accent' ? 'absent' : next);
      if (next !== 'accent') return;
      for (const real of answerLetters) {
        if (real !== ch && baseLetter(real) === baseLetter(ch)) {
          variants.add(real);
          raise(real, 'accent');
        }
      }
    });
  });
  return { states, variants };
}

export type HardModeIssue = { kind: 'position'; index: number; letter: string } | { kind: 'include'; letter: string };

/**
 * Hard mode rule (like Wordle's hard mode): every revealed hint must be used.
 * Green letters stay in their place, yellow letters must appear in the guess.
 */
export function hardModeIssue(guess: string, guesses: string[], evaluations: LetterState[][]): HardModeIssue | null {
  const g = letters(guess);

  for (let r = 0; r < guesses.length; r++) {
    const prev = letters(guesses[r]);
    for (let i = 0; i < prev.length; i++) {
      if (evaluations[r][i] === 'correct' && g[i] !== prev[i]) return { kind: 'position', index: i, letter: prev[i] };
    }
  }

  for (let r = 0; r < guesses.length; r++) {
    const required = new Map<string, number>();
    letters(guesses[r]).forEach((ch, i) => {
      const s = evaluations[r][i];
      if (s === 'correct' || s === 'present') required.set(ch, (required.get(ch) ?? 0) + 1);
    });
    for (const [ch, count] of required) {
      if (g.filter((x) => x === ch).length < count) return { kind: 'include', letter: ch };
    }
  }
  return null;
}
