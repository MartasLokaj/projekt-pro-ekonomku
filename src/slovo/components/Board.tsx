import { useEffect, useRef, type CSSProperties } from 'react';
import { strings } from '../../i18n/en';
import { displayLetter, MAX_GUESSES, WORD_LENGTH } from '../logic';
import type { SlovoState } from '../reducer';
import type { SlovoTimings } from '../timings';
import type { LetterState } from '../types';
import styles from './Board.module.css';

export interface SlovoTileProps {
  letter?: string;
  state?: LetterState;
  /** Play the flip for this tile (starts after `index × flipStagger`). */
  flip?: boolean;
  bounce?: boolean;
  index?: number;
  timings: SlovoTimings;
  size?: 'board' | 'small';
}

/**
 * One letter square. All motion is CSS: a freshly typed letter "pops", a
 * submitted tile flips (the colour switches while it is edge-on) and the
 * winning row bounces. Classes are toggled, so nothing re-mounts.
 */
export function SlovoTile({ letter, state, flip, bounce, index = 0, timings, size = 'board' }: SlovoTileProps) {
  const cls = [
    styles.tile,
    size === 'small' ? styles.small : '',
    letter ? styles.filled : '',
    letter && !state ? styles.pop : '',
    state ? styles[state] : '',
    flip ? styles.flip : '',
    bounce ? styles.bounce : '',
  ].join(' ');

  const style = {
    '--flip-ms': `${timings.flip}ms`,
    '--flip-delay': `${index * timings.flipStagger}ms`,
    '--bounce-ms': `${timings.bounce}ms`,
    '--bounce-delay': `${index * timings.bounceStagger}ms`,
    '--pop-ms': `${timings.pop}ms`,
  } as CSSProperties;

  const label = letter ? strings.slovo.tileLabel(displayLetter(letter), state && strings.slovo.stateNames[state]) : '';

  return (
    <div className={cls} style={style} role="img" aria-label={label || undefined} aria-hidden={!label || undefined}>
      <span className={styles.letter}>{letter ? displayLetter(letter) : ''}</span>
    </div>
  );
}

interface RowProps {
  letters: string[];
  states?: LetterState[];
  flip?: boolean;
  bounce?: boolean;
  /** Active row only: increments whenever the row should shake. */
  shakeId?: number;
  label: string;
  timings: SlovoTimings;
}

function Row({ letters, states, flip, bounce, shakeId, label, timings }: RowProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Shake only when the id changes while this row is active (not when it becomes active).
  const prevShake = useRef(shakeId);
  useEffect(() => {
    const prev = prevShake.current;
    prevShake.current = shakeId;
    if (shakeId === undefined || prev === undefined || shakeId === prev || !timings.shake) return;
    ref.current?.animate(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-2px)', offset: 0.1 },
        { transform: 'translateX(4px)', offset: 0.2 },
        { transform: 'translateX(-6px)', offset: 0.3 },
        { transform: 'translateX(6px)', offset: 0.4 },
        { transform: 'translateX(-6px)', offset: 0.5 },
        { transform: 'translateX(6px)', offset: 0.6 },
        { transform: 'translateX(-6px)', offset: 0.7 },
        { transform: 'translateX(4px)', offset: 0.8 },
        { transform: 'translateX(-2px)', offset: 0.9 },
        { transform: 'translateX(0)' },
      ],
      { duration: timings.shake, easing: 'linear' },
    );
  }, [shakeId, timings.shake]);

  return (
    <div ref={ref} className={styles.row} role="group" aria-label={label}>
      {Array.from({ length: WORD_LENGTH }, (_, i) => (
        <SlovoTile
          key={i}
          index={i}
          letter={letters[i]}
          state={states?.[i]}
          flip={flip}
          bounce={bounce}
          timings={timings}
        />
      ))}
    </div>
  );
}

export function Board({ state, timings }: { state: SlovoState; timings: SlovoTimings }) {
  const lastRow = state.guesses.length - 1;

  return (
    <div className={styles.board} aria-label={strings.slovo.board}>
      {Array.from({ length: MAX_GUESSES }, (_, r) => {
        const label = strings.slovo.rowLabel(r + 1);
        if (r < state.guesses.length) {
          return (
            <Row
              key={r}
              label={label}
              letters={Array.from(state.guesses[r])}
              states={state.evaluations[r]}
              flip={r === lastRow && state.phase === 'revealing'}
              bounce={r === lastRow && state.phase === 'bouncing'}
              timings={timings}
            />
          );
        }
        const active = r === state.guesses.length && state.status === 'playing';
        return (
          <Row
            key={r}
            label={label}
            letters={active ? state.current : []}
            shakeId={active ? (state.feedback?.id ?? 0) : undefined}
            timings={timings}
          />
        );
      })}
    </div>
  );
}
