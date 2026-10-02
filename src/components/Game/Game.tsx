import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MAX_MISTAKES } from '../../game/gameLogic';
import { DEFAULT_TIMINGS, REDUCED_TIMINGS } from '../../game/timings';
import { useConnectionsGame } from '../../game/useConnectionsGame';
import { celebrate } from '../../lib/confetti';
import { formatLongDate } from '../../lib/dates';
import { strings } from '../../i18n/en';
import type { PlayerStats } from '../../services/statsStore';
import type { GameProgress, GameResult } from '../../types/game';
import { DIFFICULTIES, type IsoDate, type Puzzle, type PuzzleMode, type PuzzleSummary } from '../../types/puzzle';
import { Controls } from '../Controls/Controls';
import { Grid } from '../Grid/Grid';
import { HintModal } from '../HintModal/HintModal';
import { MistakeDots } from '../MistakeDots/MistakeDots';
import { ShareModal } from '../ShareModal/ShareModal';
import { WinLoseModal } from '../WinLoseModal/WinLoseModal';
import styles from './Game.module.css';

export interface GameProps {
  puzzle: Puzzle;
  summary: PuzzleSummary;
  mode: PuzzleMode;
  initialGuesses: string[][];
  /** Today's puzzle (counts towards stats) vs. an archive replay. */
  isDaily: boolean;
  isFallback: boolean;
  stats: PlayerStats;
  today: IsoDate;
  /** The lightbulb in the toolbar opens this. */
  hintOpen: boolean;
  onCloseHint: () => void;
  onToast: (message: string) => void;
  onProgress: (progress: GameProgress) => void;
  onComplete: (result: GameResult) => void;
  onBackToToday: () => void;
}

/** One puzzle, start to finish. Remount (via `key`) to switch puzzles. */
export function Game({
  puzzle,
  summary,
  mode,
  initialGuesses,
  isDaily,
  isFallback,
  stats,
  today,
  hintOpen,
  onCloseHint,
  onToast,
  onProgress,
  onComplete,
  onBackToToday,
}: GameProps) {
  const reducedMotion = useReducedMotion();
  const timings = reducedMotion ? REDUCED_TIMINGS : DEFAULT_TIMINGS;

  const game = useConnectionsGame(puzzle, { initialGuesses, timings, onProgress, onComplete });
  const { state } = game;

  const [resultsOpen, setResultsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [revealedHints, setRevealedHints] = useState<ReadonlySet<string>>(() => new Set());

  /** Game was already finished when loaded (resumed from storage) — no fanfare. */
  const [finishedOnLoad] = useState(game.isOver);
  const justWon = state.status === 'won' && game.isSettled && !finishedOnLoad;

  // Game feedback → toast
  const feedbackId = state.feedback?.id;
  const feedbackKind = state.feedback?.kind;
  useEffect(() => {
    if (!feedbackKind) return;
    onToast(feedbackKind === 'one-away' ? strings.oneAway : strings.alreadyGuessed);
  }, [feedbackId, feedbackKind, onToast]);

  // End of game: confetti + results modal once the last animation has settled.
  const won = state.status === 'won';
  useEffect(() => {
    if (!game.isSettled || finishedOnLoad) return;
    if (won) celebrate();
    const t = window.setTimeout(() => setResultsOpen(true), won ? 1500 : 900);
    return () => window.clearTimeout(t);
  }, [game.isSettled, won, finishedOnLoad]);

  const unsolved = useMemo(() => {
    const done = new Set([...state.solved, ...state.revealed]);
    return puzzle.categories
      .filter((c) => !done.has(c.id))
      .sort((a, b) => DIFFICULTIES.indexOf(a.difficulty) - DIFFICULTIES.indexOf(b.difficulty));
  }, [puzzle.categories, state.solved, state.revealed]);

  const revealHint = useCallback((id: string) => setRevealedHints((prev) => new Set(prev).add(id)), []);

  const guessColors = game.result?.guessColors ?? [];
  const modeLabel = strings.modeNames[mode];
  const onCopyResult = (ok: boolean) => onToast(ok ? strings.copied : strings.copyFailed);

  return (
    <section className={styles.game} aria-label={strings.appName}>
      {!isDaily && (
        <p className={styles.banner}>
          {strings.archiveBanner} · {strings.puzzleNumber(summary.number)}
          <button type="button" className={styles.link} onClick={onBackToToday}>
            {strings.backToToday}
          </button>
        </p>
      )}
      {isDaily && isFallback && <p className={styles.banner}>{strings.fallbackNotice(formatLongDate(puzzle.date))}</p>}

      <p className={styles.instructions}>{strings.instructions}</p>

      <div className={styles.board}>
        <Grid
          rows={game.rows}
          board={state.board}
          selected={state.selected}
          phase={state.phase}
          inert={game.isOver}
          celebrate={justWon}
          timings={timings}
          onToggle={game.toggle}
        />
      </div>

      <div className={styles.dotsSlot}>
        <AnimatePresence initial={false}>
          {!game.isSettled && (
            <motion.div
              key="dots"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
            >
              <MistakeDots remaining={state.mistakesRemaining} total={MAX_MISTAKES} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Controls
        isOver={game.isOver}
        isSettled={game.isSettled}
        canSubmit={game.canSubmit}
        canDeselect={state.selected.length > 0}
        busy={game.isAnimating}
        onShuffle={game.shuffle}
        onDeselectAll={game.deselectAll}
        onSubmit={game.submit}
        onShare={() => setShareOpen(true)}
        onViewResults={() => setResultsOpen(true)}
      />

      <HintModal
        open={hintOpen}
        onClose={onCloseHint}
        unsolved={unsolved}
        revealed={revealedHints}
        onReveal={revealHint}
        isOver={game.isOver}
      />

      {game.result && (
        <>
          <WinLoseModal
            open={resultsOpen}
            onClose={() => setResultsOpen(false)}
            won={game.result.won}
            mistakes={game.result.mistakes}
            guessColors={guessColors}
            puzzleNumber={summary.number}
            puzzleDate={puzzle.date}
            modeLabel={modeLabel}
            today={today}
            stats={isDaily ? stats : null}
            onCopyResult={onCopyResult}
          />
          <ShareModal
            open={shareOpen}
            onClose={() => setShareOpen(false)}
            guessColors={guessColors}
            puzzleNumber={summary.number}
            puzzleDate={puzzle.date}
            modeLabel={modeLabel}
            onCopyResult={onCopyResult}
          />
        </>
      )}
    </section>
  );
}
