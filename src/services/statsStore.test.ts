import { describe, expect, it } from 'vitest';
import type { GameResult } from '../types/game';
import { applyResult, displayedStreak, EMPTY_STATS } from './statsStore';

const result = (date: string, won: boolean, mistakes = 0): GameResult => ({
  puzzleId: `p-${date}`,
  puzzleDate: date,
  won,
  mistakes,
  solvedOrder: [],
  guessColors: [],
  completedAt: `${date}T12:00:00Z`,
});

describe('applyResult', () => {
  it('counts consecutive daily wins as a streak', () => {
    let s = applyResult(EMPTY_STATS, result('2026-09-21', true));
    s = applyResult(s, result('2026-09-22', true, 2));
    s = applyResult(s, result('2026-09-23', true, 1));
    expect(s.played).toBe(3);
    expect(s.currentStreak).toBe(3);
    expect(s.maxStreak).toBe(3);
    expect(s.mistakeDistribution).toEqual([1, 1, 1, 0]);
  });

  it('resets the streak on a loss or a skipped day', () => {
    let s = applyResult(EMPTY_STATS, result('2026-09-20', true));
    s = applyResult(s, result('2026-09-22', true));
    expect(s.currentStreak).toBe(1);
    s = applyResult(s, result('2026-09-23', false));
    expect(s.currentStreak).toBe(0);
    expect(s.maxStreak).toBe(1);
  });

  it('is idempotent per puzzle', () => {
    const once = applyResult(EMPTY_STATS, result('2026-09-23', true));
    expect(applyResult(once, result('2026-09-23', true))).toBe(once);
  });

  it('shows a streak only while it is still alive', () => {
    const s = applyResult(EMPTY_STATS, result('2026-09-20', true));
    expect(displayedStreak(s, '2026-09-21')).toBe(1);
    expect(displayedStreak(s, '2026-09-23')).toBe(0);
  });
});
