import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCurrentUser, storageUserKey } from '../services/auth';
import { createProgressStore } from '../services/progressStore';
import { saveResult } from '../services/results';
import { applyResult, createStatsStore, EMPTY_STATS, type PlayerStats } from '../services/statsStore';
import type { GameResult } from '../types/game';
import type { PuzzleMode } from '../types/puzzle';
import type { User } from '../types/user';

/**
 * Who is playing + where their data lives. Swapping localStorage for a
 * backend only changes the stores created here (see services/*).
 */
export function usePlayer() {
  /** `undefined` while auth is resolving, `null` for guests. */
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    getCurrentUser()
      .then((u) => alive && setUser(u))
      .catch(() => alive && setUser(null));
    return () => {
      alive = false;
    };
  }, []);

  const userKey = storageUserKey(user ?? null);
  const stores = useMemo(
    () => ({
      stats: { easy: createStatsStore(userKey, 'easy'), hard: createStatsStore(userKey, 'hard') },
      progress: createProgressStore(userKey),
    }),
    [userKey],
  );

  /** Stats are kept separately per mode. */
  const [stats, setStats] = useState<Record<PuzzleMode, PlayerStats>>({ easy: EMPTY_STATS, hard: EMPTY_STATS });
  useEffect(() => {
    let alive = true;
    Promise.all([stores.stats.easy.get(), stores.stats.hard.get()]).then(
      ([easy, hard]) => alive && setStats({ easy, hard }),
    );
    return () => {
      alive = false;
    };
  }, [stores]);

  /** Folds a finished daily game into that mode's stats and (for signed-in users) the server. */
  const recordResult = useCallback(
    async (result: GameResult, mode: PuzzleMode) => {
      const store = stores.stats[mode];
      const next = applyResult(await store.get(), result);
      await store.save(next);
      setStats((prev) => ({ ...prev, [mode]: next }));
      if (user) saveResult(user.id, { ...result, mode }).catch((err) => console.error('saveResult failed', err));
    },
    [stores, user],
  );

  return { user, userKey, ready: user !== undefined, stores, stats, recordResult };
}
