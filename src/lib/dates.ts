import type { IsoDate } from '../types/puzzle';

const pad = (n: number) => String(n).padStart(2, '0');

/** Today's date in the player's local timezone as `YYYY-MM-DD`. */
export function todayIso(now: Date = new Date()): IsoDate {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Parses an ISO date as UTC midnight (timezone-safe arithmetic & formatting). */
function toUtcDate(iso: IsoDate): Date {
  return new Date(`${iso}T00:00:00Z`);
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  const d = toUtcDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((toUtcDate(to).getTime() - toUtcDate(from).getTime()) / 86_400_000);
}

const longFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const shortFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** "23 September 2026" */
export function formatLongDate(iso: IsoDate): string {
  return longFormatter.format(toUtcDate(iso));
}

/** "23 Sept 2026" */
export function formatShortDate(iso: IsoDate): string {
  return shortFormatter.format(toUtcDate(iso));
}

/** Milliseconds until the next local midnight (= next daily puzzle). */
export function msUntilNextPuzzle(now: Date = new Date()): number {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}
