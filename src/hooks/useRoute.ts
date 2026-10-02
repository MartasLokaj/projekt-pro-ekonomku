import { useCallback, useEffect, useState } from 'react';
import { isIsoDate } from '../data/validatePuzzle';
import { isGameId, type GameId } from '../types/games';
import type { IsoDate } from '../types/puzzle';

export interface Route {
  game: GameId;
  /** Links: `null` = today's puzzle. */
  date: IsoDate | null;
  /** Circular Words: the task number, `null` = the first unfinished word. */
  word: number | null;
}

const toWord = (v: string | null): number | null => {
  const n = v === null ? NaN : Number(v);
  return Number.isInteger(n) && n >= 1 ? n : null;
};

const read = (): Route => {
  const params = new URLSearchParams(window.location.search);
  const game = params.get('hra');
  const date = params.get('date');
  return { game: isGameId(game) ? game : 'spojeni', date: isIsoDate(date) ? date : null, word: toWord(params.get('word')) };
};

/**
 * The URL is the source of truth:
 *   /                     Links, today
 *   /?hra=slovo           Circular Words, the first unfinished word
 *   /?hra=slovo&word=3    Circular Words, word 3
 * Uses the History API so back/forward work without a router.
 */
export function useRoute() {
  const [route, setRoute] = useState<Route>(read);

  useEffect(() => {
    const onPop = () => setRoute(read());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const go = useCallback((next: Route) => {
    const url = new URL(window.location.href);
    if (next.game === 'spojeni') url.searchParams.delete('hra');
    else url.searchParams.set('hra', next.game);
    if (next.date) url.searchParams.set('date', next.date);
    else url.searchParams.delete('date');
    if (next.word) url.searchParams.set('word', String(next.word));
    else url.searchParams.delete('word');
    try {
      window.history.pushState(null, '', url);
    } catch {
      /* sandboxed iframes may forbid history changes — state still updates */
    }
    setRoute(next);
  }, []);

  /** Same game, another day (`null` = today). */
  const navigate = useCallback((date: IsoDate | null) => go({ ...read(), date }), [go]);
  /** Circular Words: another task (`null` = the first unfinished word). */
  const navigateWord = useCallback((word: number | null) => go({ ...read(), date: null, word }), [go]);
  /** Switch game, always to today's puzzle / the first unfinished word. */
  const switchGame = useCallback((game: GameId) => go({ game, date: null, word: null }), [go]);

  return { route, navigate, navigateWord, switchGame };
}
