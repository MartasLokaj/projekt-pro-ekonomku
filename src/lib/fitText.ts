/**
 * Fits a tile label: picks a font size so the word fits on one line, and —
 * for long words on narrow phones ("REMANUFACTURE") — falls back to a
 * hyphenated two-line split at a syllable-like boundary ("REMANU-/FACTURE").
 *
 * Uses canvas text metrics: exact for the real font and far cheaper than
 * measuring DOM nodes in a loop.
 */
let ctx: CanvasRenderingContext2D | null = null;

function measure(text: string, font: string): number {
  if (!ctx) ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return text.length * 62; // no canvas: rough estimate at 100px
  ctx.font = font;
  return ctx.measureText(text).width;
}

export interface FitOptions {
  maxSize: number;
  minSize: number;
  /** Below this single-line size, try a hyphenated two-line split instead. */
  breakBelow: number;
  fontFamily: string;
  fontWeight?: number;
  /** CSS letter-spacing of the label, in em (e.g. -0.01). */
  letterSpacingEm?: number;
}

export interface FitResult {
  fontSize: number;
  /** One entry per rendered line. */
  lines: string[];
}

const VOWELS = /[AEIOUY]/;
const isVowel = (ch: string) => VOWELS.test(ch);
const isLetter = (ch: string) => /\p{L}/u.test(ch);

/** Consonant pairs that commonly start an English syllable (may stay together). */
const ONSETS = new Set([
  'BL', 'BR', 'CL', 'CR', 'DR', 'FL', 'FR', 'GL', 'GR', 'PL', 'PR', 'SC', 'SK', 'SL', 'SM',
  'SN', 'SP', 'ST', 'SW', 'TR', 'TW', 'CH', 'SH', 'TH', 'PH', 'WH',
]);

/** Letter pairs that are never split across lines. */
const DIGRAPHS = new Set(['CH', 'SH', 'TH', 'PH', 'WH', 'CK', 'QU', 'NG']);

/**
 * Candidate break positions for a single upper-case word, using simple
 * syllable rules: V|CV (RE|CYCLE), V|CCV for
 * common onsets (RE|CLAIM) and VC|CV (CAR|BON). Never splits a digraph
 * like "CH", "SH" or "TH".
 */
export function breakCandidates(w: string): number[] {
  const out: number[] = [];
  const V = (i: number) => i >= 0 && i < w.length && isVowel(w[i]);
  const C = (i: number) => i >= 0 && i < w.length && isLetter(w[i]) && !isVowel(w[i]);
  for (let i = 2; i <= w.length - 2; i++) {
    if (DIGRAPHS.has(w[i - 1] + w[i])) continue;
    const vcv = V(i - 1) && C(i) && V(i + 1);
    const vccv = V(i - 1) && C(i) && C(i + 1) && V(i + 2) && ONSETS.has(w[i] + w[i + 1]);
    const vc_cv = V(i - 2) && C(i - 1) && C(i) && V(i + 1);
    if (vcv || vccv || vc_cv) out.push(i);
  }
  return out;
}

const round = (n: number) => Math.floor(n * 2) / 2;

export function fitLabel(text: string, availableWidth: number, opts: FitOptions): FitResult {
  const { maxSize, minSize, breakBelow, fontFamily, fontWeight = 700, letterSpacingEm = 0 } = opts;
  if (availableWidth <= 0) return { fontSize: maxSize, lines: [text] };

  const font = `${fontWeight} 100px ${fontFamily}`;
  const perPx = (s: string) => measure(s, font) / 100 + letterSpacingEm * s.length;
  const safe = availableWidth * 0.96;

  const words = text.split(/\s+/).filter(Boolean);
  let size = safe / Math.max(...words.map(perPx));
  // Multi-word phrases may use two lines — make sure the whole phrase fits in them.
  if (words.length > 1) size = Math.min(size, (safe * 1.85) / perPx(text));
  size = Math.min(maxSize, size);

  if (size >= breakBelow || words.length > 1) {
    return { fontSize: Math.max(minSize, round(size)), lines: [text] };
  }

  // Single long word: try the best hyphenated split.
  let best: FitResult | null = null;
  for (const i of breakCandidates(text)) {
    const first = `${text.slice(0, i)}-`;
    const second = text.slice(i);
    const splitSize = Math.min(maxSize, safe / Math.max(perPx(first), perPx(second)));
    if (!best || splitSize > best.fontSize) best = { fontSize: splitSize, lines: [first, second] };
  }

  if (best && best.fontSize > size * 1.12) {
    return { fontSize: Math.max(minSize, round(best.fontSize)), lines: best.lines };
  }
  return { fontSize: Math.max(minSize, round(size)), lines: [text] };
}
