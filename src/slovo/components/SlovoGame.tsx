import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { strings } from '../../i18n/en';
import type { IsoDate } from '../../types/puzzle';
import { displayLetter, MAX_GUESSES, toLetter } from '../logic';
import type { SlovoStats } from '../stats';
import { bounceTotal, SLOVO_REDUCED_TIMINGS, SLOVO_TIMINGS } from '../timings';
import type { SlovoProgress, SlovoPuzzle, SlovoResult } from '../types';
import { useSlovoGame } from '../useSlovoGame';
import { Board } from './Board';
import { Keyboard } from './Keyboard';
import { NextWordButton, SlovoHintModal, SlovoResultModal, WordInfoCard } from './SlovoModals';
import styles from './SlovoGame.module.css';

export interface SlovoGameProps {
  puzzle: SlovoPuzzle;
  initialGuesses: string[];
  stats: SlovoStats;
  today: IsoDate;
  dark: boolean;
  isAllowed: (word: string) => Promise<boolean>;
  hintOpen: boolean;
  /** Another modal (help, stats, archive) is open — the physical keyboard belongs to it. */
  inputBlocked: boolean;
  onCloseHint: () => void;
  onToast: (message: string, duration?: number) => void;
  onProgress: (progress: SlovoProgress) => void;
  onComplete: (result: SlovoResult) => void;
  /** Label of the "next task" button ("Next word" / "Back to word 1"). */
  nextLabel: string;
  onNext: () => void;
}

/** One word (task), start to finish. Remount (via `key`) to switch words. */
export function SlovoGame({
  puzzle,
  initialGuesses,
  stats,
  today,
  dark,
  isAllowed,
  hintOpen,
  inputBlocked,
  onCloseHint,
  onToast,
  onProgress,
  onComplete,
  nextLabel,
  onNext,
}: SlovoGameProps) {
  const reducedMotion = useReducedMotion();
  const timings = reducedMotion ? SLOVO_REDUCED_TIMINGS : SLOVO_TIMINGS;

  const game = useSlovoGame(puzzle, {
    initialGuesses,
    // Like the real Wordle: any valid word can be guessed, hints need not be reused.
    hardMode: false,
    timings,
    isAllowed,
    onProgress,
    onComplete,
  });
  const { state } = game;
  const [resultsOpen, setResultsOpen] = useState(false);
  const [hints, setHints] = useState<number[]>([]);

  // ── Feedback toasts ───────────────────────────────────────────────────────
  const feedback = state.feedback;
  const lastFeedback = useRef(feedback?.id);
  useEffect(() => {
    if (!feedback || feedback.id === lastFeedback.current) return;
    lastFeedback.current = feedback.id;
    const s = strings.slovo;
    if (feedback.reason === 'short') onToast(s.tooShort);
    else if (feedback.reason === 'unknown') onToast(s.notInList);
    else if (feedback.issue?.kind === 'position')
      onToast(s.hardPosition(feedback.issue.index, displayLetter(feedback.issue.letter)));
    else if (feedback.issue) onToast(s.hardInclude(displayLetter(feedback.issue.letter)));
  }, [feedback, onToast]);

  // ── End of game: toast after the reveal, results a moment later ──────────
  const won = state.status === 'won';
  const revealedEnd = game.isOver && state.revealedCount === state.guesses.length;
  const endToastShown = useRef(game.finishedOnLoad);
  useEffect(() => {
    if (!revealedEnd || endToastShown.current) return;
    endToastShown.current = true;
    if (won) onToast(strings.slovo.winToasts[Math.min(state.guesses.length, MAX_GUESSES) - 1], 1800);
    else onToast(displayLetter(puzzle.answer), 2300);
  }, [revealedEnd, won, onToast, puzzle.answer, state.guesses.length]);

  useEffect(() => {
    if (!game.isSettled || game.finishedOnLoad) return;
    // After a loss the answer toast stays up first; the modal follows once it is gone.
    const t = window.setTimeout(() => setResultsOpen(true), won ? 900 : 2400);
    return () => window.clearTimeout(t);
  }, [game.isSettled, game.finishedOnLoad, won]);

  // ── Physical keyboard ─────────────────────────────────────────────────────
  const { type, backspace, submit } = game;
  const inputOn = !game.isOver && !resultsOpen && !hintOpen && !inputBlocked;
  useEffect(() => {
    if (!inputOn) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey) return;
      const target = e.target instanceof Element ? e.target : null;
      // Modals are tracked in state (a closing dialog can keep focus during its exit animation).
      if (target?.closest('input, textarea, select, [contenteditable="true"], [role="menu"]')) return;

      if (e.key === 'Enter') {
        e.preventDefault(); // don't also "click" a focused button
        (document.activeElement as HTMLElement | null)?.blur?.();
        void submit();
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        backspace();
      } else if (!e.altKey || e.getModifierState?.('AltGraph')) {
        const letter = toLetter(e.key);
        if (letter) {
          e.preventDefault();
          type(letter);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inputOn, type, backspace, submit]);

  // ── Hint: reveal a letter the player does not have in place yet ───────────
  const known = useMemo(() => {
    const set = new Set<number>();
    state.evaluations.slice(0, state.revealedCount).forEach((row) =>
      row.forEach((s, i) => s === 'correct' && set.add(i)),
    );
    return set;
  }, [state.evaluations, state.revealedCount]);
  const revealHint = useCallback(() => {
    setHints((prev) => {
      const next = Array.from({ length: 5 }, (_, i) => i).find((i) => !known.has(i) && !prev.includes(i));
      return next === undefined ? prev : [...prev, next];
    });
  }, [known]);

  const onCopyResult = useCallback(
    (ok: boolean) => onToast(ok ? strings.copied : strings.copyFailed),
    [onToast],
  );

  // After the game (and its animations) the keyboard makes way for the results button.
  const showKeyboard = !game.isSettled;

  return (
    <section className={styles.game} aria-label={strings.games.slovo}>
      <p className={styles.counter}>{strings.slovo.wordOf(puzzle.number, puzzle.total)}</p>

      <Board state={state} timings={timings} />

      <div className={styles.bottom}>
        <AnimatePresence mode="wait" initial={false}>
          {showKeyboard ? (
            <motion.div key="kb" className={styles.kbWrap} exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.25 }}>
              <Keyboard
                states={game.keyboard.states}
                variants={game.keyboard.variants}
                disabled={game.busy || game.isOver}
                onLetter={type}
                onEnter={submit}
                onBackspace={backspace}
              />
            </motion.div>
          ) : (
            <motion.div
              key="done"
              className={styles.done}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: game.finishedOnLoad ? 0 : bounceTotal(timings) / 4000 }}
            >
              <WordInfoCard answer={puzzle.answer} info={puzzle.info} />
              <NextWordButton label={nextLabel} onClick={onNext} />
              <button type="button" className={styles.secondary} onClick={() => setResultsOpen(true)}>
                {strings.viewResults}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <SlovoHintModal
        open={hintOpen}
        onClose={onCloseHint}
        answer={puzzle.answer}
        revealed={hints}
        known={known}
        isOver={game.isOver}
        onReveal={revealHint}
      />

      {game.result && (
        <SlovoResultModal
          open={resultsOpen}
          onClose={() => setResultsOpen(false)}
          puzzle={puzzle}
          won={game.result.won}
          evaluations={game.result.evaluations}
          today={today}
          stats={stats}
          dark={dark}
          timings={timings}
          nextLabel={nextLabel}
          onNext={onNext}
          onCopyResult={onCopyResult}
        />
      )}
    </section>
  );
}
