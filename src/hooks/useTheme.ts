import { useCallback, useEffect, useState } from 'react';
import { localStore } from '../services/storage';

export type ThemePreference = 'light' | 'dark' | 'system';
type Resolved = 'light' | 'dark';

const media = () => window.matchMedia?.('(prefers-color-scheme: dark)');

/**
 * Light / dark theme. "system" follows the OS; an explicit choice is saved
 * and applied as `<html data-theme="…">` (see tokens in global.css).
 */
export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(() => {
    const saved = localStore.get<ThemePreference | null>('theme', null);
    return saved === 'light' || saved === 'dark' ? saved : 'system';
  });
  const [systemDark, setSystemDark] = useState(() => media()?.matches ?? false);

  useEffect(() => {
    const mq = media();
    if (!mq) return;
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const resolved: Resolved = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;

  useEffect(() => {
    const root = document.documentElement;
    if (preference === 'system') delete root.dataset.theme;
    else root.dataset.theme = preference;
    localStore.set('theme', preference === 'system' ? null : preference);
  }, [preference]);

  const toggle = useCallback(() => setPreference(resolved === 'dark' ? 'light' : 'dark'), [resolved]);

  return { theme: resolved, preference, setPreference, toggle };
}
