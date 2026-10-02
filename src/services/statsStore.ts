import { addDays } from '../lib/dates';
import type { GameResult } from '../types/game';
import type { IsoDate, PuzzleMode } from '../types/puzzle';
import { localStore } from './storage';

export interface PlayerStats {
  played: number;
  won: number;
  currentStreak: number;
  maxStreak: number;
  /** Wins bucketed by number of mistakes: index 0..3. */
  mistakeDistribution: [number, number, number, number];
  lastPlayedDate: IsoDate | null;
  lastWonDate: IsoDate | null;
  /** Puzzle ids already counted — makes recording idempotent. */
  completedPuzzleIds: string[];
}

export const EMPTY_STATS: PlayerStats = {
  played: 0,
  won: 0,
  currentStreak: 0,
  maxStreak: 0,
  mistakeDistribution: [0, 0, 0, 0],
  lastPlayedDate: null,
  lastWonDate: null,
  completedPuzzleIds: [],
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EXTENSION POINT — stats & streak persistence
 * ─────────────────────────────────────────────────────────────────────────────
 * Today stats live in localStorage. For a database, write e.g.
 * `class ApiStatsStore implements StatsStore` (GET/PUT /api/stats) and return
 * it from `createStatsStore()` for signed-in users.
 */
export interface StatsStore {
  get(): Promise<PlayerStats>;
  save(stats: PlayerStats): Promise<void>;
}

export class LocalStorageStatsStore implements StatsStore {
  private readonly key: string;

  constructor(userKey: string, mode: PuzzleMode) {
    this.key = `stats:${userKey}:${mode}`;
  }

  async get(): Promise<PlayerStats> {
    const stored = localStore.get<Partial<PlayerStats>>(this.key, {});
    return { ...EMPTY_STATS, ...stored };
  }

  async save(stats: PlayerStats): Promise<void> {
    localStore.set(this.key, stats);
  }
}

/** Stats (and streaks) are kept separately for each mode. */
export function createStatsStore(userKey: string, mode: PuzzleMode): StatsStore {
  return new LocalStorageStatsStore(userKey, mode);
}

/** Pure reducer: folds a finished game into the stats (safe to call twice). */
export function applyResult(stats: PlayerStats, result: GameResult): PlayerStats {
  if (stats.completedPuzzleIds.includes(result.puzzleId)) return stats;

  const next: PlayerStats = {
    ...stats,
    mistakeDistribution: [...stats.mistakeDistribution] as PlayerStats['mistakeDistribution'],
    played: stats.played + 1,
    lastPlayedDate: result.puzzleDate,
    completedPuzzleIds: [...stats.completedPuzzleIds, result.puzzleId].slice(-400),
  };

  if (result.won) {
    const continues = stats.lastWonDate === addDays(result.puzzleDate, -1);
    next.won += 1;
    next.currentStreak = continues ? stats.currentStreak + 1 : 1;
    next.maxStreak = Math.max(stats.maxStreak, next.currentStreak);
    next.lastWonDate = result.puzzleDate;
    const bucket = Math.min(3, Math.max(0, result.mistakes));
    next.mistakeDistribution[bucket] += 1;
  } else {
    next.currentStreak = 0;
  }
  return next;
}

/** Fields every game's stats share (Links, Circular Words). */
export interface StreakStats {
  played: number;
  won: number;
  currentStreak: number;
  maxStreak: number;
  lastWonDate: IsoDate | null;
}

/** A streak is broken as soon as a day is skipped. */
export function displayedStreak(stats: StreakStats, today: IsoDate): number {
  if (!stats.lastWonDate) return 0;
  const alive = stats.lastWonDate === today || stats.lastWonDate === addDays(today, -1);
  return alive ? stats.currentStreak : 0;
}
