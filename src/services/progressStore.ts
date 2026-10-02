import type { GameProgress } from '../types/game';
import { localStore } from './storage';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EXTENSION POINT — in-progress game sync
 * ─────────────────────────────────────────────────────────────────────────────
 * Saves the guess history per puzzle so a reload (or, later, another device)
 * resumes exactly where the player left off. For a backend, implement this
 * with e.g. `PUT /api/progress/:puzzleId` keyed by the signed-in user.
 */
export interface ProgressStore {
  load(puzzleId: string): Promise<GameProgress | null>;
  save(progress: GameProgress): Promise<void>;
}

export class LocalStorageProgressStore implements ProgressStore {
  private readonly userKey: string;

  constructor(userKey: string) {
    this.userKey = userKey;
  }

  private key(puzzleId: string) {
    return `progress:${this.userKey}:${puzzleId}`;
  }

  async load(puzzleId: string): Promise<GameProgress | null> {
    const saved = localStore.get<GameProgress | null>(this.key(puzzleId), null);
    return saved && Array.isArray(saved.guesses) ? saved : null;
  }

  async save(progress: GameProgress): Promise<void> {
    localStore.set(this.key(progress.puzzleId), progress);
  }
}

export function createProgressStore(userKey: string): ProgressStore {
  return new LocalStorageProgressStore(userKey);
}
