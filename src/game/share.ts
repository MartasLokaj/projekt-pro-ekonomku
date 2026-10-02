import type { Difficulty } from '../types/puzzle';
import { strings } from '../i18n/en';

export const DIFFICULTY_EMOJI: Record<Difficulty, string> = {
  yellow: '🟨',
  green: '🟩',
  blue: '🟦',
  purple: '🟪',
};

/** One emoji row per guess, e.g. "🟨🟨🟨🟨". */
export function emojiRows(guessColors: Difficulty[][]): string[] {
  return guessColors.map((row) => row.map((d) => DIFFICULTY_EMOJI[d]).join(''));
}

/**
 * Text copied to the clipboard:
 *
 *   Links · Hard
 *   Puzzle #5
 *   🟨🟨🟨🟨
 *   🟩🟪🟩🟩
 *   …
 */
export function buildShareText(
  guessColors: Difficulty[][],
  puzzleNumber: number,
  modeLabel?: string,
  url?: string,
): string {
  const title = modeLabel ? `${strings.appName} · ${modeLabel}` : strings.appName;
  const lines = [title, strings.puzzleNumber(puzzleNumber), ...emojiRows(guessColors)];
  if (url) lines.push(url);
  return lines.join('\n');
}

/** Clipboard write with a fallback for older / non-secure contexts. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    el.remove();
    return ok;
  } catch {
    return false;
  }
}
