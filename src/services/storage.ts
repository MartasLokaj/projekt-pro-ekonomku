/**
 * Tiny, crash-proof wrapper around localStorage.
 * Storage can be unavailable (private mode, blocked cookies, SSR) — every
 * access is guarded so the game keeps working, just without persistence.
 */
/** Own prefix, so this English version never mixes its saved games with the Czech app on the same address. */
const PREFIX = 'circular:v1:';

export const localStore = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = window.localStorage.getItem(PREFIX + key);
      return raw == null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  },

  set(key: string, value: unknown): void {
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* storage full or unavailable — ignore */
    }
  },

  remove(key: string): void {
    try {
      window.localStorage.removeItem(PREFIX + key);
    } catch {
      /* ignore */
    }
  },
};
