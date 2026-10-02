import { motion } from 'motion/react';
import { formatLongDate } from '../../lib/dates';
import { strings } from '../../i18n/en';
import type { PlayerStats } from '../../services/statsStore';
import type { Difficulty, IsoDate } from '../../types/puzzle';
import { Modal } from '../Modal/Modal';
import { ShareSummary } from '../ShareModal/ShareSummary';
import { NextPuzzleCountdown, StatsPanel } from '../Stats/StatsPanel';
import styles from './WinLoseModal.module.css';

export interface WinLoseModalProps {
  open: boolean;
  onClose: () => void;
  won: boolean;
  mistakes: number;
  guessColors: Difficulty[][];
  puzzleNumber: number;
  puzzleDate: IsoDate;
  modeLabel: string;
  today: IsoDate;
  /** Null for archive games (they do not count towards stats). */
  stats: PlayerStats | null;
  onCopyResult?: (ok: boolean) => void;
}

export function WinLoseModal({
  open,
  onClose,
  won,
  mistakes,
  guessColors,
  puzzleNumber,
  puzzleDate,
  modeLabel,
  today,
  stats,
  onCopyResult,
}: WinLoseModalProps) {
  const headline = won ? strings.winHeadline(mistakes) : strings.loseHeadline;

  return (
    <Modal open={open} onClose={onClose} title={headline} hideTitle>
      <div className={styles.content}>
        <motion.p
          className={styles.headline}
          aria-hidden="true"
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.08, type: 'spring', stiffness: 360, damping: 22 }}
        >
          {headline}
        </motion.p>
        <p className={styles.message}>{won ? strings.winMessage(mistakes) : strings.loseMessage}</p>
        <p className={styles.meta}>
          {modeLabel} · {strings.puzzleNumber(puzzleNumber)} · {formatLongDate(puzzleDate)}
        </p>

        <ShareSummary
          guessColors={guessColors}
          puzzleNumber={puzzleNumber}
          modeLabel={modeLabel}
          onCopyResult={onCopyResult}
        />

        <hr className={styles.divider} />

        {stats ? (
          <>
            <StatsPanel stats={stats} today={today} />
            <NextPuzzleCountdown />
          </>
        ) : (
          <p className={styles.note}>{strings.archiveNote}</p>
        )}
      </div>
    </Modal>
  );
}
