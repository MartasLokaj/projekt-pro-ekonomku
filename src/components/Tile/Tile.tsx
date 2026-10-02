import { motion, type Variants } from 'motion/react';
import { memo, useMemo, type Ref } from 'react';
import { ms, type GameTimings } from '../../game/timings';
import type { FitResult } from '../../lib/fitText';
import styles from './Tile.module.css';

export type TileMotion = 'idle' | 'jump' | 'shake';

export interface TileProps {
  word: string;
  /** Upper-cased word (accessible name). */
  label: string;
  /** Font size + line split computed by the grid (see lib/fitText). */
  fit?: FitResult;
  selected: boolean;
  /** Game over — tile is inert. */
  inert: boolean;
  motionState: TileMotion;
  /** Position in the jump wave (0–3). */
  jumpIndex: number;
  /** Position on the board, used for the entrance stagger. */
  boardIndex: number;
  timings: GameTimings;
  onToggle: (word: string) => void;
  /** Forwarded to the DOM node (needed by AnimatePresence "popLayout"). */
  ref?: Ref<HTMLButtonElement>;
}

const LAYOUT_EASE = [0.25, 0.8, 0.25, 1] as const;

function TileImpl({
  word,
  label,
  fit,
  selected,
  inert,
  motionState,
  jumpIndex,
  boardIndex,
  timings,
  onToggle,
  ref,
}: TileProps) {
  // Every variant sets every animated value: motion animates values missing
  // from the active variant back to `initial` (= hidden), which would blink tiles out.
  const variants = useMemo<Variants>(
    () => ({
      hidden: { opacity: 0, scale: 0.9, x: 0, y: 6 },
      idle: (c: { boardIndex: number }) => ({
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
        transition: { delay: c.boardIndex * 0.018, duration: 0.28, ease: 'easeOut' },
      }),
      jump: (c: { jumpIndex: number }) => ({
        opacity: 1,
        scale: 1,
        x: 0,
        y: [0, -10, 0],
        transition: {
          default: { duration: 0.15 },
          y: {
            delay: ms(c.jumpIndex * timings.jumpStagger),
            duration: ms(timings.jumpDuration),
            ease: 'easeInOut',
          },
        },
      }),
      shake: {
        opacity: 1,
        scale: 1,
        y: 0,
        x: [0, -7, 7, -6, 6, -3, 3, 0],
        transition: {
          default: { duration: 0.15 },
          x: { duration: ms(timings.shake) * 0.9, ease: 'easeInOut' },
        },
      },
    }),
    [timings],
  );

  return (
    <motion.button
      ref={ref}
      type="button"
      layout="position"
      className={`${styles.tile} ${selected ? styles.selected : ''}`}
      aria-label={label}
      aria-pressed={selected}
      aria-disabled={inert || undefined}
      onClick={() => onToggle(word)}
      custom={{ jumpIndex, boardIndex }}
      variants={variants}
      initial="hidden"
      animate={motionState}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.18 } }}
      whileTap={inert ? undefined : { scale: 0.95, transition: { duration: 0.08 } }}
      transition={{ layout: { duration: ms(timings.move) * 0.9, ease: LAYOUT_EASE } }}
    >
      <span className={styles.label} style={{ fontSize: fit?.fontSize }} lang="cs" aria-hidden="true">
        {fit && fit.lines.length > 1
          ? fit.lines.map((line, i) => (
              <span key={i} className={styles.line}>
                {line}
              </span>
            ))
          : label}
      </span>
    </motion.button>
  );
}

export const Tile = memo(TileImpl);
