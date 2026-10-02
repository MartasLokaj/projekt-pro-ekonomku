import { AnimatePresence, motion } from 'motion/react';
import { strings } from '../../i18n/en';
import type { Category } from '../../types/puzzle';
import { Modal } from '../Modal/Modal';
import styles from './HintModal.module.css';

export interface HintModalProps {
  open: boolean;
  onClose: () => void;
  /** Groups the player has not found yet, easiest first. */
  unsolved: Category[];
  /** Ids of groups whose theme was already revealed. */
  revealed: ReadonlySet<string>;
  onReveal: (categoryId: string) => void;
  isOver: boolean;
}

/** Lightbulb: reveal the theme of a missing group, one at a time. */
export function HintModal({ open, onClose, unsolved, revealed, onReveal, isOver }: HintModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={strings.hint} size="sm">
      {isOver || unsolved.length === 0 ? (
        <p className={styles.intro}>{strings.hintDone}</p>
      ) : (
        <>
          <p className={styles.intro}>{strings.hintIntro}</p>
          <ul className={styles.list}>
            {unsolved.map((c) => {
              const shown = revealed.has(c.id);
              return (
                <li key={c.id} className={styles.row} style={{ ['--swatch' as string]: `var(--${c.difficulty})` }}>
                  <span className={styles.swatch} aria-hidden="true" />
                  <span className={styles.level}>{strings.difficultyNames[c.difficulty]}</span>
                  <AnimatePresence mode="wait" initial={false}>
                    {shown ? (
                      <motion.strong
                        key="name"
                        className={styles.name}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {c.name.toLocaleUpperCase('en')}
                      </motion.strong>
                    ) : (
                      <motion.button
                        key="btn"
                        type="button"
                        className={styles.reveal}
                        onClick={() => onReveal(c.id)}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {strings.hintReveal}
                      </motion.button>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Modal>
  );
}
