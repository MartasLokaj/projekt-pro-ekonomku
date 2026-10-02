import type { User } from '../types/user';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EXTENSION POINT — user accounts / authentication
 * ─────────────────────────────────────────────────────────────────────────────
 * Everyone is an anonymous guest for now. To add accounts, implement these
 * functions with your auth provider, e.g. Supabase:
 *
 *   const { data } = await supabase.auth.getUser();
 *   return data.user ? { id: data.user.id, displayName: data.user.email ?? '' } : null;
 *
 * The rest of the app only ever calls `getCurrentUser()` and uses `user.id`
 * to namespace stats & progress, so no other code needs to change.
 */
export async function getCurrentUser(): Promise<User | null> {
  return null;
}

export async function signIn(): Promise<User> {
  throw new Error('Signing in is not available yet.');
}

export async function signOut(): Promise<void> {
  /* no-op until accounts exist */
}

/** Key used to namespace locally stored data. */
export function storageUserKey(user: User | null): string {
  return user?.id ?? 'guest';
}
