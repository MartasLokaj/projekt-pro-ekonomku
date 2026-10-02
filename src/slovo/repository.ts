import { normalizeWord, WORD_LENGTH, letters } from './logic';
import type { SlovoPuzzle, SlovoSummary, WordInfo } from './types';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  DATA ACCESS — words for "Circular Words"
 * ─────────────────────────────────────────────────────────────────────────────
 * The game is a list of tasks: word 1, word 2, … (no daily schedule). Today the
 * words are static files in `public/data/slovo/`:
 *   answers.json  → { words: [{ word, type, meaning, circular }] } in play order
 *   words.txt     → every allowed guess, one per line
 *
 * For a backend, implement `SlovoRepository` (e.g. `GET /api/slovo/words/3`
 * plus a server-side guess check) and assign it to `slovoRepository` below.
 */
export interface SlovoRepository {
  /** Every word in play order. */
  listWords(): Promise<SlovoSummary[]>;
  /** The word at a 1-based position. */
  getPuzzle(number: number): Promise<SlovoPuzzle>;
  isAllowed(word: string): Promise<boolean>;
}

export class SlovoNotFoundError extends Error {
  constructor(number: number) {
    super(`No word #${number}`);
    this.name = 'SlovoNotFoundError';
  }
}

interface AnswerEntry extends WordInfo {
  word: string;
}

interface AnswerFile {
  words: AnswerEntry[];
}

export const slovoPuzzleId = (answer: string) => `slovo-${answer}`;

export class StaticSlovoRepository implements SlovoRepository {
  private readonly base: string;
  private answers: Promise<AnswerEntry[]> | null = null;
  private allowed: Promise<Set<string>> | null = null;

  constructor(base = `${import.meta.env.BASE_URL}data/slovo/`) {
    this.base = base;
  }

  private async fetchText(file: string): Promise<string> {
    const res = await fetch(this.base + file);
    if (!res.ok) throw new Error(`Failed to load ${file}: ${res.status}`);
    return res.text();
  }

  private answerList(): Promise<AnswerEntry[]> {
    if (!this.answers) {
      this.answers = this.fetchText('answers.json').then((t) =>
        (JSON.parse(t) as AnswerFile).words.map((w) => ({ ...w, word: normalizeWord(w.word) })),
      );
      this.answers.catch(() => (this.answers = null));
    }
    return this.answers;
  }

  /** The (large) guess list is only fetched when the first word is submitted. */
  private allowedWords(): Promise<Set<string>> {
    if (!this.allowed) {
      this.allowed = this.fetchText('words.txt').then(
        (t) => new Set(t.split('\n').map(normalizeWord).filter((w) => letters(w).length === WORD_LENGTH)),
      );
      this.allowed.catch(() => (this.allowed = null));
    }
    return this.allowed;
  }

  async listWords(): Promise<SlovoSummary[]> {
    const words = await this.answerList();
    return words.map((w, i) => ({ id: slovoPuzzleId(w.word), number: i + 1, answer: w.word }));
  }

  async getPuzzle(number: number): Promise<SlovoPuzzle> {
    const words = await this.answerList();
    const entry = words[number - 1];
    if (!Number.isInteger(number) || !entry) throw new SlovoNotFoundError(number);
    const { word, type, meaning, circular } = entry;
    return { id: slovoPuzzleId(word), number, total: words.length, answer: word, info: { type, meaning, circular } };
  }

  async isAllowed(word: string): Promise<boolean> {
    const w = normalizeWord(word);
    // Every answer can be guessed, even if the guess list misses it.
    const [allowed, answers] = await Promise.all([this.allowedWords(), this.answerList()]);
    return allowed.has(w) || answers.some((a) => a.word === w);
  }
}

export const slovoRepository: SlovoRepository = new StaticSlovoRepository();

/** Saved status of one word, as the progress store knows it. */
export type WordStatusLookup = (id: string) => Promise<'playing' | 'won' | 'lost' | undefined>;

/**
 * The word to open when no number is requested: the first one the player has
 * not finished yet (word 1 if everything is done).
 */
export async function firstUnfinished(words: SlovoSummary[], statusOf: WordStatusLookup): Promise<number> {
  for (const w of words) {
    const status = await statusOf(w.id);
    if (status !== 'won' && status !== 'lost') return w.number;
  }
  return 1;
}

/** The task after `number`; after the last word it starts again at 1. */
export const nextNumber = (number: number, total: number) => (number >= total ? 1 : number + 1);
