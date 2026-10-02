import { motion, type Variants } from 'motion/react';
import type { Ref } from 'react';
import type { Category } from '../../types/puzzle';
import { strings } from '../../i18n/en';
import styles from './ResultRow.module.css';

export interface ResultRowProps {
  category: Category;
  /** Row index — staggers the win bounce. */
  index: number;
  /** Revealed after a loss (not solved by the player). */
  revealed?: boolean;
  celebrate?: boolean;
  /** Forwarded to the DOM node (needed by AnimatePresence "popLayout"). */
  ref?: Ref<HTMLDivElement>;
}

const variants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  shown: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 420, damping: 30 },
  },
  bounce: (i: number) => ({
    opacity: 1,
    scale: [1, 1.03, 1],
    y: [0, -12, 0],
    transition: {
      opacity: { duration: 0.2 },
      default: { delay: 0.25 + i * 0.13, duration: 0.5, ease: 'easeInOut' },
    },
  }),
};

const upper = (s: string) => s.toLocaleUpperCase('en');

export function ResultRow({ category, index, revealed, celebrate, ref }: ResultRowProps) {
  const words = category.words.map(upper).join(', ');
  return (
    <motion.div
      ref={ref}
      layout="position"
      role="group"
      aria-label={`${category.name}: ${category.words.join(', ')}`}
      className={styles.row}
      data-difficulty={category.difficulty}
      data-revealed={revealed || undefined}
      style={{ background: `var(--${category.difficulty})` }}
      variants={variants}
      custom={index}
      initial="hidden"
      animate={celebrate ? 'bounce' : 'shown'}
    >
      <h3 className={styles.name}>{upper(category.name)}</h3>
      <p className={styles.words}>{words}</p>
      <span className="visually-hidden">{strings.difficultyNames[category.difficulty]}</span>
    </motion.div>
  );
}
