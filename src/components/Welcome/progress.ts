import { restoreState as restoreSpojeni } from '../../game/gameReducer';
import { strings } from '../../i18n/en';
import { MAX_GUESSES } from '../../slovo/logic';
import { restoreState as restoreSlovo } from '../../slovo/reducer';
import type { GameId, PlayerProgress } from '../../types/games';
import type { Puzzle } from '../../types/puzzle';

/** Links: progress rebuilt from the saved guesses (groups found of 4). */
export function spojeniProgress(puzzle: Puzzle, guesses: readonly string[][]): PlayerProgress {
  const state = restoreSpojeni(puzzle, guesses);
  if (state.status !== 'playing') return { kind: state.status };
  if (state.guesses.length === 0) return { kind: 'new' };
  return { kind: 'playing', done: state.solved.length, total: puzzle.categories.length };
}

/** Circular Words: progress rebuilt from the saved words (guesses used of 6). */
export function slovoProgress(answer: string, guesses: readonly string[]): PlayerProgress {
  const state = restoreSlovo(answer, [...guesses]);
  if (state.status !== 'playing') return { kind: state.status };
  if (state.guesses.length === 0) return { kind: 'new' };
  return { kind: 'playing', done: state.guesses.length, total: MAX_GUESSES };
}

export type WelcomeAction = 'play' | 'continue' | 'stats';

export interface WelcomeCopy {
  message: string;
  action: WelcomeAction;
}

/**
 * Text under the title and the main button. A new puzzle gets the game's
 * one-line pitch and "Play"; a started one "Continue"; a finished one the
 * stats. `isToday` = false when an archive puzzle is shown.
 */
export function welcomeCopy(game: GameId, progress: PlayerProgress | null, isToday: boolean): WelcomeCopy {
  const w = strings.welcome;
  switch (progress?.kind) {
    case 'playing':
      return { message: w.playing[game](progress.done, progress.total), action: 'continue' };
    case 'won':
      return { message: w.won[game](isToday), action: 'stats' };
    case 'lost':
      return { message: w.lost[game](isToday), action: 'stats' };
    default:
      return { message: w.subtitle[game], action: 'play' };
  }
}
