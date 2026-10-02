import { AnimatePresence, motion } from 'motion/react';
import type { ToastMessage } from '../../hooks/useToast';
import styles from './Toast.module.css';

export interface ToastProps {
  toast: ToastMessage | null;
  /** Pin to the top of the screen (the welcome screen has no header or toolbar). */
  top?: boolean;
}

export function Toast({ toast, top = false }: ToastProps) {
  return (
    <div className={`${styles.region} ${top ? styles.top : ''}`} role="status" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            className={styles.toast}
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
