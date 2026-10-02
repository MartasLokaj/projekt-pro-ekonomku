import { strings } from '../i18n/en';
import { MAX_GUESSES } from './logic';
import type { LetterState } from './types';

export function slovoEmojiRows(evaluations: LetterState[][], dark: boolean): string[] {
  const emoji: Record<LetterState, string> = {
    correct: '🟩',
    present: '🟨',
    accent: '🟦',
    absent: dark ? '⬛' : '⬜',
  };
  return evaluations.map((row) => row.map((s) => emoji[s]).join(''));
}

/**
 * Text copied to the clipboard:
 *
 *   Circular Words
 *   Word #3 · 4/6
 *
 *   ⬜🟨⬜⬜⬜
 *   …
 */
export function buildSlovoShareText(opts: {
  evaluations: LetterState[][];
  won: boolean;
  number: number;
  dark: boolean;
}): string {
  const score = `${opts.won ? opts.evaluations.length : 'X'}/${MAX_GUESSES}`;
  return [
    strings.games.slovo,
    `${strings.slovo.wordNumber(opts.number)} · ${score}`,
    '',
    ...slovoEmojiRows(opts.evaluations, opts.dark),
  ].join('\n');
}
