import { motion } from 'motion/react';
import { useEffect, useState, type CSSProperties } from 'react';
import { msUntilNextPuzzle } from '../../lib/dates';
import { strings } from '../../i18n/en';
import { displayedStreak, type StreakStats } from '../../services/statsStore';
import type { IsoDate } from '../../types/puzzle';
import styles from './Stats.module.css';

export interface StatsDistribution {
  title: string;
  rows: { label: string; count: number }[];
  /** Highlight this row (e.g. the game just finished). */
  highlight?: number | null;
  /** Colours of the highlighted bar (default: the Links green). */
  highlightColor?: string;
  highlightTextColor?: string;
  empty: string;
}

export interface StatsPanelProps {
  stats: StreakStats;
  today: IsoDate;
  distribution?: StatsDistribution;
  /** Daily games: a streak ends when a day is skipped. Off for Circular Words (tasks, not days). */
  streakDecays?: boolean;
}

/** Shared by both games: four headline numbers + an optional bar chart. */
export function StatsPanel({ stats, today, distribution, streakDecays = true }: StatsPanelProps) {
  const winPct = stats.played ? Math.round((stats.won / stats.played) * 100) : 0;
  const numbers = [
    { label: strings.statsPlayed, value: stats.played },
    { label: strings.statsWinPct, value: winPct },
    { label: strings.statsCurrentStreak, value: streakDecays ? displayedStreak(stats, today) : stats.currentStreak },
    { label: strings.statsMaxStreak, value: stats.maxStreak },
  ];

  return (
    <div className={styles.panel}>
      <dl className={styles.numbers}>
        {numbers.map((n) => (
          <div key={n.label} className={styles.number}>
            <dt className={styles.label}>{n.label}</dt>
            <dd className={styles.value}>{n.value}</dd>
          </div>
        ))}
      </dl>

      {distribution && <Distribution {...distribution} played={stats.played} />}
    </div>
  );
}

function Distribution({
  title,
  rows,
  highlight = null,
  highlightColor,
  highlightTextColor,
  empty,
  played,
}: StatsDistribution & { played: number }) {
  const maxBar = Math.max(1, ...rows.map((r) => r.count));
  const style = highlightColor
    ? ({ '--bar-active': highlightColor, '--bar-active-text': highlightTextColor } as CSSProperties)
    : undefined;
  return (
    <div className={styles.distribution} style={style}>
      <h3 className={styles.subTitle}>{title}</h3>
      {played === 0 ? (
        <p className={styles.empty}>{empty}</p>
      ) : (
        rows.map((row, i) => (
          <div key={row.label} className={styles.barRow}>
            <span className={styles.barLabel}>{row.label}</span>
            <div className={styles.barTrack}>
              <motion.div
                className={`${styles.bar} ${highlight === i ? styles.barActive : ''}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(8, (row.count / maxBar) * 100)}%` }}
                transition={{ delay: 0.1 + i * 0.06, duration: 0.5, ease: 'easeOut' }}
              >
                {row.count}
              </motion.div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const pad = (n: number) => String(n).padStart(2, '0');

export function NextPuzzleCountdown({ label = strings.nextPuzzleIn }: { label?: string }) {
  const [left, setLeft] = useState(msUntilNextPuzzle);
  useEffect(() => {
    const id = window.setInterval(() => setLeft(msUntilNextPuzzle()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const s = Math.floor(left / 1000);
  return (
    <p className={styles.countdown}>
      {label}{' '}
      <strong className={styles.time}>
        {pad(Math.floor(s / 3600))}:{pad(Math.floor((s % 3600) / 60))}:{pad(s % 60)}
      </strong>
    </p>
  );
}
