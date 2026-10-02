import { motion } from 'motion/react';
import { strings } from '../../i18n/en';
import { PUZZLE_MODES, type PuzzleMode } from '../../types/puzzle';
import { FeatherIcon, FlameIcon } from '../Icons';
import styles from './ModeSwitch.module.css';

const ICONS = { easy: FeatherIcon, hard: FlameIcon } as const;

export interface ModeSwitchProps {
  mode: PuzzleMode;
  onChange: (mode: PuzzleMode) => void;
}

/** Segmented control: 🪶 Easy | 🔥 Hard. The coloured pill slides to the active mode. */
export function ModeSwitch({ mode, onChange }: ModeSwitchProps) {
  return (
    <div className={styles.switch} role="radiogroup" aria-label={strings.modeLabel}>
      {PUZZLE_MODES.map((m) => {
        const Icon = ICONS[m];
        const active = m === mode;
        return (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={active}
            title={strings.modeTitles[m]}
            className={`${styles.option} ${active ? styles.active : ''}`}
            data-mode={m}
            onClick={() => !active && onChange(m)}
          >
            {active && (
              <motion.span
                layoutId="mode-pill"
                className={styles.pill}
                transition={{ type: 'spring', stiffness: 520, damping: 38 }}
              />
            )}
            <span className={styles.content}>
              <Icon size={18} />
              <span>{strings.modeNames[m]}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
