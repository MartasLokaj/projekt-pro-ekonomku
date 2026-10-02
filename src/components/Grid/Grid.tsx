import { AnimatePresence } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Phase } from '../../game/gameReducer';
import type { GameTimings } from '../../game/timings';
import { strings } from '../../i18n/en';
import { fitLabel, type FitResult } from '../../lib/fitText';
import type { Category } from '../../types/puzzle';
import { ResultRow } from '../ResultRow/ResultRow';
import { Tile, type TileMotion } from '../Tile/Tile';
import styles from './Grid.module.css';

export interface GridProps {
  rows: { category: Category; revealed: boolean }[];
  board: string[];
  selected: string[];
  phase: Phase;
  inert: boolean;
  celebrate: boolean;
  timings: GameTimings;
  onToggle: (word: string) => void;
}

const GAP = 8;
const TILE_PADDING_X = 5;
/** Keep in sync with `.label { letter-spacing }` in Tile.module.css. */
const LETTER_SPACING = -0.01;
const FONT_FAMILY = "'Libre Franklin Variable', 'Libre Franklin', Arial, sans-serif";

/** Width of one tile, tracked with a ResizeObserver so text can be fitted. */
function useTileWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [tileWidth, setTileWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setTileWidth((el.clientWidth - 3 * GAP) / 4);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, tileWidth };
}

/** Re-renders once web fonts are ready so canvas measurements use the real font. */
function useFontsReady() {
  const [ready, setReady] = useState(() => typeof document === 'undefined' || document.fonts?.status === 'loaded');
  useEffect(() => {
    if (ready || !document.fonts) return;
    let alive = true;
    document.fonts.load(`700 16px ${FONT_FAMILY}`).finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, [ready]);
  return ready;
}

export function Grid({ rows, board, selected, phase, inert, celebrate, timings, onToggle }: GridProps) {
  const { ref, tileWidth } = useTileWidth();
  const fontsReady = useFontsReady();

  const labels = useMemo(() => new Map(board.map((w) => [w, w.toLocaleUpperCase('en')])), [board]);

  const fits = useMemo(() => {
    const out = new Map<string, FitResult>();
    const available = tileWidth - TILE_PADDING_X * 2;
    // Sized to match the original's cap height (Franklin Gothic, ~20px there).
    const maxSize = tileWidth >= 124 ? 19 : Math.max(13, Math.min(17, tileWidth * 0.19));
    // Until the web font has loaded, measure with a close fallback; re-fit afterwards.
    const fontFamily = fontsReady ? FONT_FAMILY : 'Arial, sans-serif';
    for (const [word, label] of labels) {
      out.set(
        word,
        tileWidth
          ? fitLabel(label, available, { maxSize, minSize: 9, breakBelow: 11, fontFamily, letterSpacingEm: LETTER_SPACING })
          : { fontSize: maxSize, lines: [label] },
      );
    }
    return out;
  }, [labels, tileWidth, fontsReady]);

  // Selected tiles jump in board order (left→right, top→bottom).
  const jumpOrder = useMemo(() => {
    const ordered = board.filter((w) => selected.includes(w));
    return new Map(ordered.map((w, i) => [w, i]));
  }, [board, selected]);

  const motionFor = useCallback(
    (isSelected: boolean): TileMotion => {
      if (!isSelected) return 'idle';
      if (phase.name === 'jumping') return 'jump';
      if (phase.name === 'shaking') return 'shake';
      return 'idle';
    },
    [phase.name],
  );

  return (
    <div ref={ref} className={styles.grid} role="group" aria-label={strings.board}>
      <AnimatePresence mode="popLayout">
        {rows.map(({ category, revealed }, i) => (
          <ResultRow key={`row-${category.id}`} category={category} index={i} revealed={revealed} celebrate={celebrate} />
        ))}
        {board.map((word, i) => {
          const isSelected = selected.includes(word);
          return (
            <Tile
              key={word}
              word={word}
              label={labels.get(word) ?? word}
              fit={fits.get(word)}
              selected={isSelected}
              inert={inert}
              motionState={motionFor(isSelected)}
              jumpIndex={jumpOrder.get(word) ?? 0}
              boardIndex={i}
              timings={timings}
              onToggle={onToggle}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function GridSkeleton() {
  return (
    <div className={styles.grid} aria-hidden="true">
      {Array.from({ length: 16 }, (_, i) => (
        <div key={i} className={styles.skeleton} style={{ animationDelay: `${(i % 4) * 90 + Math.floor(i / 4) * 60}ms` }} />
      ))}
    </div>
  );
}
