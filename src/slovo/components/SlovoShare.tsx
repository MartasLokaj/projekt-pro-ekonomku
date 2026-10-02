import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { copyToClipboard } from '../../game/share';
import { strings } from '../../i18n/en';
import { CheckIcon, CopyIcon } from '../../components/Icons';
import shareStyles from '../../components/ShareModal/ShareModal.module.css';
import { buildSlovoShareText } from '../share';
import type { LetterState } from '../types';
import styles from './SlovoModals.module.css';

export interface SlovoShareProps {
  evaluations: LetterState[][];
  won: boolean;
  number: number;
  dark: boolean;
  onCopyResult?: (ok: boolean) => void;
}

const COLOR: Record<LetterState, string> = {
  correct: 'var(--sl-correct)',
  present: 'var(--sl-present)',
  accent: 'var(--sl-accent)',
  absent: 'var(--sl-absent)',
};

/** Coloured result grid + "Copy results" (the copied text uses emoji squares). */
export function SlovoShare({ evaluations, won, number, dark, onCopyResult }: SlovoShareProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const text = buildSlovoShareText({ evaluations, won, number, dark });

  const copy = async () => {
    const ok = await copyToClipboard(text);
    onCopyResult?.(ok);
    if (!ok) return;
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={shareStyles.summary}>
      <div className={styles.shareGrid} role="img" aria-label={text}>
        {evaluations.map((row, r) => (
          <div key={r} className={styles.shareRow}>
            {row.map((s, c) => (
              <motion.span
                key={c}
                className={styles.shareSquare}
                style={{ background: COLOR[s] }}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.12 + r * 0.07 + c * 0.03, type: 'spring', stiffness: 500, damping: 26 }}
              />
            ))}
          </div>
        ))}
      </div>

      <motion.button type="button" className={shareStyles.copy} onClick={copy} whileTap={{ scale: 0.96 }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={copied ? 'done' : 'idle'}
            className={shareStyles.copyInner}
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
