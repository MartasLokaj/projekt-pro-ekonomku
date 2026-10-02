import { localStore } from '../services/storage';
import type { StreakStats } from '../services/statsStore';
import type { IsoDate } from '../types/puzzle';
import { MAX_GUESSES } from './logic';
import type { SlovoProgress, SlovoResult } from './types';

export interface SlovoStats extends StreakStats {
  /** Wins by number of guesses: index 0 = solved on the 1st guess … 5 = 6th. */
  guessDistribution: number[];
  lastPlayedDate: IsoDate | null;
  /** Puzzle ids already counted — makes recording idempotent. */
  completedPuzzleIds: string[];
}

export const EMPTY_SLOVO_STATS: SlovoStats = {
  played: 0,
  won: 0,
  currentStreak: 0,
  maxStreak: 0,
  guessDistribution: Array(MAX_GUESSES).fill(0),
  lastPlayedDate: null,
  lastWonDate: null,
  completedPuzzleIds: [],
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EXTENSION POINT — Circular Words stats & progress persistence
 * ─────────────────────────────────────────────────────────────────────────────
 * Same pattern as Links (`services/statsStore.ts`, `services/progressStore.ts`):
 * swap the localStorage classes for API-backed ones for signed-in users.
 */
export interface SlovoStatsStore {
  get(): Promise<SlovoStats>;
  save(stats: SlovoStats): Promise<void>;
}

export interface SlovoProgressStore {
  load(puzzleId: string): Promise<SlovoProgress | null>;
  save(progress: SlovoProgress): Promise<void>;
}

class LocalSlovoStatsStore implements SlovoStatsStore {
  private readonly key: string;
  constructor(userKey: string) {
    // Own key: the old daily stats ("…:hard") counted days, these count words.
    this.key = `slovo:stats:${userKey}:words`;
  }
  async get(): Promise<SlovoStats> {
    const stored = localStore.get<Partial<SlovoStats>>(this.key, {});
    return { ...EMPTY_SLOVO_STATS, ...stored };
  }
  async save(stats: SlovoStats): Promise<void> {
    localStore.set(this.key, stats);
  }
}

class LocalSlovoProgressStore implements SlovoProgressStore {
  private readonly userKey: string;
  constructor(userKey: string) {
    this.userKey = userKey;
  }
  private key(id: string) {
    return `slovo:progress:${this.userKey}:${id}`;
  }
  async load(puzzleId: string): Promise<SlovoProgress | null> {
    const saved = localStore.get<SlovoProgress | null>(this.key(puzzleId), null);
    return saved && Array.isArray(saved.guesses) ? saved : null;
  }
  async save(progress: SlovoProgress): Promise<void> {
    localStore.set(this.key(progress.puzzleId), progress);
  }
}

export const createSlovoStatsStore = (userKey: string): SlovoStatsStore => new LocalSlovoStatsStore(userKey);

export const createSlovoProgressStore = (userKey: string): SlovoProgressStore => new LocalSlovoProgressStore(userKey);

/**
 * Pure: folds a finished game into the stats (safe to call twice).
 * The words are tasks, not days: the streak counts wins in a row, whenever
 * they were played, and a loss resets it.
 */
export function applySlovoResult(stats: SlovoStats, result: SlovoResult): SlovoStats {
  if (stats.completedPuzzleIds.includes(result.puzzleId)) return stats;
  const day = result.completedAt.slice(0, 10) || null;
  const next: SlovoStats = {
    ...stats,
    guessDistribution: [...stats.guessDistribution],
    played: stats.played + 1,
    lastPlayedDate: day,
    completedPuzzleIds: [...stats.completedPuzzleIds, result.puzzleId].slice(-1000),
  };
  if (result.won) {
    next.won += 1;
    next.currentStreak = stats.currentStreak + 1;
    next.maxStreak = Math.max(stats.maxStreak, next.currentStreak);
    next.lastWonDate = day;
    const bucket = Math.min(MAX_GUESSES, Math.max(1, result.guessCount)) - 1;
    next.guessDistribution[bucket] = (next.guessDistribution[bucket] ?? 0) + 1;
  } else {
    next.currentStreak = 0;
  }
  return next;
}
