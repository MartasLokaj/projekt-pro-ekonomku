import { motion } from 'motion/react';
import { strings } from '../../i18n/en';
import styles from './MistakeDots.module.css';

export interface MistakeDotsProps {
  remaining: number;
  total?: number;
}

export function MistakeDots({ remaining, total = 4 }: MistakeDotsProps) {
  return (
    <div className={styles.wrap} role="status" aria-label={strings.mistakesAria(remaining)}>
      <span className={styles.label} aria-hidden="true">
        {strings.mistakesRemaining}
      </span>
      <span className={styles.dots} aria-hidden="true">
        {Array.from({ length: total }, (_, i) => {
          const alive = i < remaining;
          return (
            <motion.span
              key={i}
              className={styles.dot}
              initial={false}
              animate={alive ? { scale: 1, opacity: 1 } : { scale: [1, 1.25, 0], opacity: [1, 1, 0] }}
              transition={{ duration: alive ? 0.2 : 0.42, ease: 'easeInOut' }}
            />
          );
        })}
      </span>
    </div>
  );
}
