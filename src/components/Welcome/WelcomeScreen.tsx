import { motion } from 'motion/react';
import { useEffect, useId, useState } from 'react';
import { strings } from '../../i18n/en';
import { formatLongDate } from '../../lib/dates';
import type { GameId, PlayerProgress } from '../../types/games';
import type { IsoDate } from '../../types/puzzle';
import { welcomeCopy } from './progress';
import styles from './WelcomeScreen.module.css';

export interface WelcomeScreenProps {
  game: GameId;
  date: IsoDate;
  /** Running number of the puzzle; `null` until the stage has loaded it. */
  number: number | null;
  /** Replaces the date and the number (Circular Words: "Word 3 of 118"). */
  label?: string;
  /** Links only: the difficulty the player is on ("Easy"). */
  modeLabel?: string;
  /** `null` while the puzzle and the saved progress are loading. */
  progress: PlayerProgress | null;
  isToday: boolean;
  /** Start or continue the game. */
  onPlay: () => void;
  /** Finished puzzle: close the welcome screen and show the stats. */
  onStats: () => void;
  /** EXTENSION POINT: wire to real sign-in once accounts exist. */
  onSignIn: () => void;
}

/** If loading takes longer than this, show the generic text rather than a blank screen. */
const LOAD_GRACE_MS = 1200;

const TILE_COLORS: Record<GameId, string[]> = {
  spojeni: ['var(--yellow)', 'var(--green)', 'var(--blue)', 'var(--purple)'],
  slovo: ['var(--sl-absent)', 'var(--sl-present)', 'var(--sl-correct)', 'var(--sl-correct)'],
};

/** The game's mark, large: four tiles that pop in one after another. */
function WelcomeMark({ game }: { game: GameId }) {
  return (
    <div className={styles.markCard} aria-hidden="true">
      <svg className={styles.mark} viewBox="0 0 32 32" focusable="false">
        {TILE_COLORS[game].map((fill, i) => (
          <motion.rect
            key={i}
            x={i % 2 ? 17 : 2}
            y={i < 2 ? 2 : 17}
            width={13}
            height={13}
            rx={game === 'spojeni' ? 3 : 1.6}
            fill={fill}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 + i * 0.08, type: 'spring', stiffness: 420, damping: 20 }}
          />
        ))}
      </svg>
    </div>
  );
}

/**
 * Full-screen welcome card shown when a game opens (like the NYT games):
 * mark, title, a one-line pitch or the player's progress, the main button,
 * and the puzzle's date and number. The game loads underneath meanwhile.
 */
export function WelcomeScreen({
  game,
  date,
  number,
  label,
  modeLabel,
  progress,
  isToday,
  onPlay,
  onStats,
  onSignIn,
}: WelcomeScreenProps) {
  const titleId = useId();
  const [graceOver, setGraceOver] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setGraceOver(true), LOAD_GRACE_MS);
    return () => window.clearTimeout(t);
  }, []);
  const ready = progress !== null || graceOver;

  const { message, action } = welcomeCopy(game, progress, isToday);
  const buttonLabel = { play: strings.welcome.play, continue: strings.welcome.continue, stats: strings.welcome.stats }[action];
  const numberLabel = number === null ? null : game === 'slovo' ? strings.slovo.wordNumber(number) : strings.puzzleNumber(number);

  return (
    <motion.div
      className={`${styles.screen} ${styles[game]}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      <motion.div className={styles.inner} exit={{ y: -16, scale: 0.98 }} transition={{ duration: 0.28, ease: 'easeOut' }}>
        <WelcomeMark game={game} />
        <h1 id={titleId} className={styles.title}>
          {strings.games[game]}
        </h1>

        <motion.div
          className={styles.body}
          initial={false}
          animate={{ opacity: ready ? 1 : 0, y: ready ? 0 : 6 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          aria-busy={!ready}
        >
          <p className={styles.message}>{message}</p>

          <div className={styles.actions}>
            <button type="button" className={`${styles.button} ${styles.secondary}`} onClick={onSignIn}>
              {strings.welcome.signIn}
            </button>
            <button
              type="button"
              className={`${styles.button} ${styles.primary}`}
              onClick={action === 'stats' ? onStats : onPlay}
            >
              {buttonLabel}
            </button>
          </div>

          <div className={styles.meta}>
            {label ? (
              <p className={styles.date}>{label}</p>
            ) : (
              <>
                <p className={styles.date}>
                  <time dateTime={date}>{formatLongDate(date)}</time>
                </p>
                {numberLabel && <p>{numberLabel}</p>}
              </>
            )}
            {modeLabel && <p>{strings.welcome.mode(modeLabel)}</p>}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
