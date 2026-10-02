import { AnimatePresence, motion } from 'motion/react';
import { strings } from '../../i18n/en';
import styles from './Controls.module.css';

export interface ControlsProps {
  isOver: boolean;
  /** Game over and every end animation finished. */
  isSettled: boolean;
  canSubmit: boolean;
  canDeselect: boolean;
  busy: boolean;
  onShuffle: () => void;
  onDeselectAll: () => void;
  onSubmit: () => void;
  onShare: () => void;
  onViewResults: () => void;
}

const fade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.22, ease: 'easeOut' },
} as const;

export function Controls({
  isOver,
  isSettled,
  canSubmit,
  canDeselect,
  busy,
  onShuffle,
  onDeselectAll,
  onSubmit,
  onShare,
  onViewResults,
}: ControlsProps) {
  return (
    <div className={styles.slot}>
      <AnimatePresence mode="wait" initial={false}>
        {!isOver ? (
          <motion.div key="play" className={styles.row} {...fade}>
            <Button onClick={onShuffle} disabled={busy}>
              {strings.shuffle}
            </Button>
            <Button onClick={onDeselectAll} disabled={busy || !canDeselect}>
              {strings.deselectAll}
            </Button>
            <Button onClick={onSubmit} disabled={!canSubmit} primary={canSubmit}>
              {strings.submit}
            </Button>
          </motion.div>
        ) : isSettled ? (
          <motion.div key="over" className={styles.row} {...fade}>
            <Button onClick={onShare}>{strings.share}</Button>
            <Button onClick={onViewResults} primary>
              {strings.viewResults}
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Button({
  children,
  primary,
  disabled,
  onClick,
}: {
  children: string;
  primary?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      className={`${styles.button} ${primary ? styles.primary : ''}`}
      disabled={disabled}
      onClick={onClick}
      whileTap={disabled ? undefined : { scale: 0.95 }}
    >
      {children}
    </motion.button>
  );
}
