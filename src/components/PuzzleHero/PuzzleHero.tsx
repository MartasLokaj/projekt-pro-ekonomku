import type { Ref } from 'react';
import { formatLongDate } from '../../lib/dates';
import type { IsoDate } from '../../types/puzzle';
import styles from './PuzzleHero.module.css';

export interface PuzzleHeroProps {
  /** Name of the current game. */
  title: string;
  date: IsoDate;
  /** Replaces the date (e.g. "Word 3 of 118"). */
  subtitle?: string;
  ref?: Ref<HTMLElement>;
}

/**
 * Big title + the puzzle's date. It sits above the sticky toolbar; on load
 * the page scrolls past it straight to the board (scroll up to see it).
 */
export function PuzzleHero({ title, date, subtitle, ref }: PuzzleHeroProps) {
  return (
    <section ref={ref} className={styles.hero}>
      <div className={styles.inner}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.date}>{subtitle ?? <time dateTime={date}>{formatLongDate(date)}</time>}</p>
      </div>
    </section>
  );
}
