import type { SlovoResult } from '../slovo/types';
import type { GameResult } from '../types/game';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EXTENSION POINT — persist finished games on a server
 * ─────────────────────────────────────────────────────────────────────────────
 * Called once per finished daily game for signed-in users. Replace the body
 * with a real request, for example:
 *
 *   await fetch('/api/results', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ userId, ...result }),
 *   });
 *
 * or with Supabase:  await supabase.from('results').upsert({ user_id: userId, ...result });
 *
 * (Use `puzzleId + userId` as the unique key so retries are idempotent.)
 */
export async function saveResult(userId: string, result: GameResult): Promise<void> {
  if (import.meta.env.DEV) {
    console.info('[saveResult stub]', userId, result);
  }
}

/** Same extension point for Circular Words (e.g. a `slovo_results` table keyed by user + puzzle). */
export async function saveSlovoResult(userId: string, result: SlovoResult): Promise<void> {
  if (import.meta.env.DEV) {
    console.info('[saveSlovoResult stub]', userId, result);
  }
}
