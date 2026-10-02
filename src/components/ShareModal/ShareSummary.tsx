import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { buildShareText, copyToClipboard } from '../../game/share';
import { strings } from '../../i18n/en';
import type { Difficulty } from '../../types/puzzle';
import { CheckIcon, CopyIcon } from '../Icons';
import styles from './ShareModal.module.css';

export interface ShareSummaryProps {
  guessColors: Difficulty[][];
  puzzleNumber: number;
  /** "Easy" / "Hard" — shown in the copied text. */
  modeLabel?: string;
  onCopyResult?: (ok: boolean) => void;
}

/** Emoji-style result grid + "Copy results" button. */
export function ShareSummary({ guessColors, puzzleNumber, modeLabel, onCopyResult }: ShareSummaryProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    const ok = await copyToClipboard(buildShareText(guessColors, puzzleNumber, modeLabel));
    onCopyResult?.(ok);
    if (!ok) return;
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.summary}>
      <div className={styles.grid} role="img" aria-label={buildShareText(guessColors, puzzleNumber, modeLabel)}>
        {guessColors.map((row, r) => (
          <div key={r} className={styles.gridRow}>
            {row.map((d, c) => (
              <motion.span
                key={c}
                className={styles.square}
                style={{ background: `var(--${d})` }}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.12 + r * 0.07 + c * 0.03, type: 'spring', stiffness: 500, damping: 26 }}
              />
            ))}
          </div>
        ))}
      </div>

      <motion.button type="button" className={styles.copy} onClick={copy} whileTap={{ scale: 0.96 }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={copied ? 'done' : 'idle'}
            className={styles.copyInner}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {copied ? <CheckIcon size={18} /> : <CopyIcon size={18} />}
            {copied ? strings.copiedShort : strings.copyResults}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
