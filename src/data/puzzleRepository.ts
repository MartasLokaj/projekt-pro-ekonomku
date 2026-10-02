import type { IsoDate, Puzzle, PuzzleMode, PuzzleSummary } from '../types/puzzle';
import { parsePuzzle } from './validatePuzzle';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  DATA-ACCESS LAYER FOR PUZZLES
 * ─────────────────────────────────────────────────────────────────────────────
 * UI components and game logic never fetch puzzle data themselves — they only
 * call the functions exported at the bottom of this file. To move puzzles into
 * a database, implement `PuzzleRepository` against your API and swap the
 * single `puzzleRepository` instance below. Nothing else has to change.
 *
 * Every call takes a `mode` ('easy' | 'hard'): each mode has its own puzzles.
 */
export interface PuzzleRepository {
  /** The puzzle published for `date` in `mode`, or `null` if there is none. */
  getPuzzleForDate(date: IsoDate, mode: PuzzleMode): Promise<Puzzle | null>;
  /** All published puzzles of a mode (date ascending) — for the archive & fallbacks. */
  listPuzzles(mode: PuzzleMode): Promise<PuzzleSummary[]>;
}

export class PuzzleNotFoundError extends Error {
  constructor(date: IsoDate) {
    super(`No puzzle available for ${date}`);
    this.name = 'PuzzleNotFoundError';
  }
}

/**
 * CURRENT IMPLEMENTATION — static JSON files served from
 * `public/data/puzzles/<mode>/YYYY-MM-DD.json`, plus an `index.json` per mode
 * that the Vite plugin in `scripts/puzzleManifestPlugin.ts` generates.
 */
export class StaticJsonPuzzleRepository implements PuzzleRepository {
  private readonly baseUrl: string;
  private readonly cache = new Map<string, Promise<Puzzle | null>>();
  private readonly indexCache = new Map<PuzzleMode, Promise<PuzzleSummary[]>>();

  constructor(baseUrl = `${import.meta.env.BASE_URL}data/puzzles/`) {
    this.baseUrl = baseUrl;
  }

  getPuzzleForDate(date: IsoDate, mode: PuzzleMode): Promise<Puzzle | null> {
    const key = `${mode}/${date}`;
    let pending = this.cache.get(key);
    if (!pending) {
      pending = this.fetchPuzzle(date, mode);
      this.cache.set(key, pending);
      pending.catch(() => this.cache.delete(key)); // allow retry after network errors
    }
    return pending;
  }

  listPuzzles(mode: PuzzleMode): Promise<PuzzleSummary[]> {
    let pending = this.indexCache.get(mode);
    if (!pending) {
      pending = fetch(`${this.baseUrl}${mode}/index.json`).then((res) => {
        if (!res.ok) throw new Error(`Could not load puzzle index (HTTP ${res.status})`);
        return res.json() as Promise<PuzzleSummary[]>;
      });
      this.indexCache.set(mode, pending);
      pending.catch(() => this.indexCache.delete(mode));
    }
    return pending;
  }

  private async fetchPuzzle(date: IsoDate, mode: PuzzleMode): Promise<Puzzle | null> {
    const res = await fetch(`${this.baseUrl}${mode}/${date}.json`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Could not load puzzle ${mode}/${date} (HTTP ${res.status})`);
    // Some static hosts answer unknown paths with index.html (SPA fallback).
    if (!(res.headers.get('content-type') ?? '').includes('json')) return null;
    return parsePuzzle(await res.json(), `${mode}/${date}.json`);
  }
}

/**
 * FUTURE IMPLEMENTATION (sketch) — a real backend.
 *
 *   GET /api/puzzle?date=YYYY-MM-DD&mode=hard  → Puzzle | 404
 *   GET /api/puzzles?mode=hard                 → PuzzleSummary[]  (only dates <= today!)
 *
 * With Supabase: `supabase.from('puzzles').select().eq('date', date).eq('mode', mode)`.
 * A server can also hide future puzzles, which static files cannot.
 */
export class ApiPuzzleRepository implements PuzzleRepository {
  private readonly apiBase: string;

  constructor(apiBase = '/api') {
    this.apiBase = apiBase;
  }

  async getPuzzleForDate(date: IsoDate, mode: PuzzleMode): Promise<Puzzle | null> {
    const res = await fetch(`${this.apiBase}/puzzle?date=${encodeURIComponent(date)}&mode=${mode}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Puzzle API error (HTTP ${res.status})`);
    return parsePuzzle(await res.json(), `api:${mode}/${date}`);
  }

  async listPuzzles(mode: PuzzleMode): Promise<PuzzleSummary[]> {
    const res = await fetch(`${this.apiBase}/puzzles?mode=${mode}`);
    if (!res.ok) throw new Error(`Puzzle API error (HTTP ${res.status})`);
    return (await res.json()) as PuzzleSummary[];
  }
}

/**
 * EXTENSION POINT — admin / editor view.
 * A future puzzle editor would talk to an implementation of this interface
 * (and reuse `validatePuzzle()` for instant feedback in the form).
 */
export interface PuzzleAdminRepository extends PuzzleRepository {
  savePuzzle(puzzle: Puzzle, mode: PuzzleMode): Promise<void>;
  deletePuzzle(date: IsoDate, mode: PuzzleMode): Promise<void>;
}

// ─── The one place that decides where puzzles come from ────────────────────
export const puzzleRepository: PuzzleRepository = new StaticJsonPuzzleRepository();
// export const puzzleRepository: PuzzleRepository = new ApiPuzzleRepository();

// ─── Public API used by the rest of the app ─────────────────────────────────

/** Exact puzzle for a date and mode, or `null`. */
export function getPuzzleForDate(date: IsoDate, mode: PuzzleMode): Promise<Puzzle | null> {
  return puzzleRepository.getPuzzleForDate(date, mode);
}

/** Published puzzles of a mode up to and including `today` (never leaks future ones). */
export async function listPublishedPuzzles(today: IsoDate, mode: PuzzleMode): Promise<PuzzleSummary[]> {
  const all = await puzzleRepository.listPuzzles(mode);
  return all.filter((p) => p.date <= today);
}

export interface LoadedPuzzle {
  puzzle: Puzzle;
  summary: PuzzleSummary;
  mode: PuzzleMode;
  /** True when no puzzle exists for the requested day and we fell back to the latest one. */
  isFallback: boolean;
}

/**
 * Resolves the puzzle to show for a given day and mode.
 * If that exact day has no puzzle yet, falls back to the most recent earlier
 * puzzle (so the static demo never shows an empty screen).
 */
export async function loadPuzzle(date: IsoDate, today: IsoDate, mode: PuzzleMode): Promise<LoadedPuzzle> {
  const published = await listPublishedPuzzles(today, mode);
  if (published.length === 0) throw new PuzzleNotFoundError(date);

  const exact = published.find((p) => p.date === date);
  const summary = exact ?? [...published].reverse().find((p) => p.date <= date) ?? published[0];

  const puzzle = await getPuzzleForDate(summary.date, mode);
  if (!puzzle) throw new PuzzleNotFoundError(summary.date);
  return { puzzle, summary, mode, isFallback: !exact };
}
