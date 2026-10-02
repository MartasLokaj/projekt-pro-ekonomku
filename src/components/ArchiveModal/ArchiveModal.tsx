import { motion } from 'motion/react';
import { formatLongDate } from '../../lib/dates';
import { strings } from '../../i18n/en';
import type { GameStatus } from '../../types/game';
import type { IsoDate, PuzzleSummary } from '../../types/puzzle';
import { CheckIcon, ChevronRightIcon, CloseIcon } from '../Icons';
import { Modal } from '../Modal/Modal';
import styles from './ArchiveModal.module.css';

export interface ArchiveModalProps {
  open: boolean;
  onClose: () => void;
  puzzles: PuzzleSummary[];
  /** Saved status per puzzle id (missing = not started). */
  statuses: Record<string, GameStatus | undefined>;
  currentId: string | null;
  today: IsoDate;
  modeLabel: string;
  /** Text above the list (defaults to the Links wording). */
  intro?: string;
  onSelect: (date: IsoDate) => void;
}

export function ArchiveModal({
  open,
  onClose,
  puzzles,
  statuses,
  currentId,
  today,
  modeLabel,
  intro = strings.archiveIntro,
  onSelect,
}: ArchiveModalProps) {
  const newestFirst = [...puzzles].reverse();

  return (
    <Modal open={open} onClose={onClose} title={`${strings.archive} · ${modeLabel}`}>
      <p className={styles.intro}>{intro}</p>
      {newestFirst.length === 0 ? (
        <p className={styles.intro}>{strings.archiveEmpty}</p>
      ) : (
        <ul className={styles.list}>
          {newestFirst.map((p, i) => {
            const status = statuses[p.id];
            return (
              <motion.li
                key={p.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 10) * 0.035 }}
              >
                <button
                  type="button"
                  className={`${styles.item} ${p.id === currentId ? styles.current : ''}`}
                  onClick={() => onSelect(p.date)}
                  aria-current={p.id === currentId || undefined}
                >
                  <span className={styles.number}>#{p.number}</span>
                  <span className={styles.text}>
                    <span className={styles.date}>{formatLongDate(p.date)}</span>
                    {p.date === today && <span className={styles.today}>{strings.today}</span>}
                  </span>
                  <StatusBadge status={status} />
                  <ChevronRightIcon size={18} className={styles.chevron} />
                </button>
              </motion.li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}

export function StatusBadge({ status }: { status?: GameStatus }) {
  if (!status) return <span className={styles.badgeEmpty} />;
  if (status === 'won')
    return (
      <span className={`${styles.badge} ${styles.won}`} title={strings.archiveSolved}>
        <CheckIcon size={14} /> {strings.archiveSolved}
      </span>
    );
  if (status === 'lost')
    return (
      <span className={`${styles.badge} ${styles.lost}`} title={strings.archiveLost}>
        <CloseIcon size={14} /> {strings.archiveLost}
      </span>
    );
  return <span className={styles.badge}>{strings.archiveInProgress}</span>;
}
