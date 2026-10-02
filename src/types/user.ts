/**
 * Authenticated player. `null` everywhere means "anonymous guest".
 * EXTENSION POINT: map this from your auth provider's user object
 * (Supabase `auth.getUser()`, Firebase `auth.currentUser`, …).
 */
export interface User {
  id: string;
  displayName: string;
  email?: string;
}
