import { memo } from 'react';
import { strings } from '../../i18n/en';
import { BackspaceIcon } from '../../components/Icons';
import { displayLetter } from '../logic';
import type { LetterState } from '../types';
import styles from './Keyboard.module.css';

/** English QWERTY. */
const ROWS: string[][] = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
];

export interface KeyboardProps {
  states: Record<string, LetterState>;
  /** Letters revealed by a turquoise tile (announced to screen readers). Never used with English words. */
  variants: ReadonlySet<string>;
  disabled?: boolean;
  onLetter: (letter: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
}

export const Keyboard = memo(function Keyboard({ states, variants, disabled, onLetter, onEnter, onBackspace }: KeyboardProps) {
  const press = (key: string) => {
    if (disabled) return;
    if (key === 'enter') onEnter();
    else if (key === 'backspace') onBackspace();
    else onLetter(key);
  };

  return (
    <div className={styles.keyboard} role="group" aria-label={strings.slovo.keyboard}>
      {ROWS.map((row, r) => (
        <div key={r} className={styles.row}>
          {/* Half-key spacers centre the middle row, like a real keyboard. */}
          {r === 1 && <span className={styles.spacer} aria-hidden="true" />}
          {row.map((key) => {
            const wide = key === 'enter' || key === 'backspace';
            const label =
              key === 'enter' ? strings.slovo.enter : key === 'backspace' ? strings.slovo.backspace : displayLetter(key);
            return (
              <button
                key={key}
                type="button"
                tabIndex={-1}
                className={`${styles.key} ${wide ? styles.wide : ''}`}
                data-state={states[key]}
                aria-label={variants.has(key) ? `${label}, ${strings.slovo.variantKey}` : label}
                aria-disabled={disabled || undefined}
                onClick={(e) => {
                  e.currentTarget.blur();
                  press(key);
                }}
              >
                {key === 'enter' ? (
                  <span className={styles.enter}>{strings.slovo.enter}</span>
                ) : key === 'backspace' ? (
                  <BackspaceIcon size={22} />
                ) : (
                  displayLetter(key)
                )}
              </button>
            );
          })}
          {r === 1 && <span className={styles.spacer} aria-hidden="true" />}
        </div>
      ))}
    </div>
  );
});
