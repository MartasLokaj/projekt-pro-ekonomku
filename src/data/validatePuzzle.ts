import { DIFFICULTIES, type Category, type Difficulty, type Puzzle } from '../types/puzzle.ts';

/**
 * Runtime validation for puzzle data.
 *
 * Pure & dependency-free on purpose: it runs in the browser (data layer),
 * at build time (Vite plugin) and in unit tests — and a future admin editor
 * or API route can reuse it before saving a puzzle to the database.
 */

export class PuzzleValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[], source?: string) {
    super(`${source ? `${source}: ` : ''}invalid puzzle\n  - ${issues.join('\n  - ')}`);
    this.name = 'PuzzleValidationError';
    this.issues = issues;
  }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const nonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

/** Returns a list of human-readable problems (empty list = valid). */
export function validatePuzzle(input: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(input)) return ['puzzle must be a JSON object'];

  if (!nonEmptyString(input.id)) issues.push('"id" must be a non-empty string');
  if (!isIsoDate(input.date)) issues.push('"date" must be a valid ISO date (YYYY-MM-DD)');

  const categories = input.categories;
  if (!Array.isArray(categories) || categories.length !== 4) {
    issues.push('"categories" must be an array of exactly 4 categories');
    return issues;
  }

  const seenIds = new Set<string>();
  const seenDifficulties = new Set<string>();
  const seenWords = new Map<string, string>();

  categories.forEach((cat: unknown, i) => {
    const where = `categories[${i}]`;
    if (!isRecord(cat)) {
      issues.push(`${where} must be an object`);
      return;
    }
    if (!nonEmptyString(cat.id)) issues.push(`${where}.id must be a non-empty string`);
    else if (seenIds.has(cat.id)) issues.push(`${where}.id "${cat.id}" is duplicated`);
    else seenIds.add(cat.id);

    if (!nonEmptyString(cat.name)) issues.push(`${where}.name must be a non-empty string`);

    if (!DIFFICULTIES.includes(cat.difficulty as Difficulty)) {
      issues.push(`${where}.difficulty must be one of ${DIFFICULTIES.join(', ')}`);
    } else if (seenDifficulties.has(cat.difficulty as string)) {
      issues.push(`${where}.difficulty "${String(cat.difficulty)}" is used more than once`);
    } else {
      seenDifficulties.add(cat.difficulty as string);
    }

    if (!Array.isArray(cat.words) || cat.words.length !== 4) {
      issues.push(`${where}.words must be an array of exactly 4 strings`);
      return;
    }
    cat.words.forEach((w: unknown, j) => {
      if (!nonEmptyString(w)) {
        issues.push(`${where}.words[${j}] must be a non-empty string`);
        return;
      }
      const key = normalizeWord(w);
      const previous = seenWords.get(key);
      if (previous) issues.push(`word "${w.trim()}" appears more than once (also in ${previous})`);
      else seenWords.set(key, where);
    });
  });

  return issues;
}

/** Validates and returns a clean, normalized `Puzzle` (throws on invalid input). */
export function parsePuzzle(input: unknown, source?: string): Puzzle {
  const issues = validatePuzzle(input);
  if (issues.length > 0) throw new PuzzleValidationError(issues, source);

  const raw = input as Record<string, unknown> & { categories: Record<string, unknown>[] };
  const categories: Category[] = raw.categories.map((c) => ({
    id: String(c.id).trim(),
    name: String(c.name).trim(),
    difficulty: c.difficulty as Difficulty,
    words: (c.words as string[]).map((w) => w.trim()),
  }));
  categories.sort((a, b) => DIFFICULTIES.indexOf(a.difficulty) - DIFFICULTIES.indexOf(b.difficulty));

  return {
    id: String(raw.id).trim(),
    date: String(raw.date),
    categories,
    ...(nonEmptyString(raw.author) ? { author: raw.author.trim() } : {}),
  };
}

/** Case- and whitespace-insensitive key used to compare words. */
export function normalizeWord(word: string): string {
  return word.trim().replace(/\s+/g, ' ').toLocaleLowerCase('en');
}
