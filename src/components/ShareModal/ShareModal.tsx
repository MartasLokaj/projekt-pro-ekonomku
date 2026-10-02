import { formatLongDate } from '../../lib/dates';
import { strings } from '../../i18n/en';
import type { Difficulty, IsoDate } from '../../types/puzzle';
import { Modal } from '../Modal/Modal';
import styles from './ShareModal.module.css';
import { ShareSummary } from './ShareSummary';

export interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  guessColors: Difficulty[][];
  puzzleNumber: number;
  puzzleDate: IsoDate;
  modeLabel: string;
  onCopyResult?: (ok: boolean) => void;
}

/** Re-opens the shareable result after the end-of-game modal was dismissed. */
export function ShareModal({
  open,
  onClose,
  guessColors,
  puzzleNumber,
  puzzleDate,
  modeLabel,
  onCopyResult,
}: ShareModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={strings.shareTitle} size="sm">
      <p className={styles.meta}>
        {modeLabel} · {strings.puzzleNumber(puzzleNumber)} · {formatLongDate(puzzleDate)}
      </p>
      <ShareSummary
        guessColors={guessColors}
        puzzleNumber={puzzleNumber}
        modeLabel={modeLabel}
        onCopyResult={onCopyResult}
      />
    </Modal>
  );
}
