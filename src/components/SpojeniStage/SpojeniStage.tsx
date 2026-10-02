import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import appStyles from '../../App.module.css';
import { listPublishedPuzzles } from '../../data/puzzleRepository';
import type { usePlayer } from '../../hooks/usePlayer';
import { usePuzzle } from '../../hooks/usePuzzle';
import { strings } from '../../i18n/en';
import type { GameProgress, GameResult, GameStatus } from '../../types/game';
import type { StageLoaded, StageModal } from '../../types/games';
import type { IsoDate, PuzzleMode, PuzzleSummary } from '../../types/puzzle';
import { ArchiveModal } from '../ArchiveModal/ArchiveModal';
import { Game } from '../Game/Game';
import { GridSkeleton } from '../Grid/Grid';
import { HowToPlayModal } from '../HowToPlayModal/HowToPlayModal';
import { StatsModal } from '../Stats/StatsModal';
import { spojeniProgress } from '../Welcome/progress';

export interface SpojeniStageProps {
  requestedDate: IsoDate | null;
  today: IsoDate;
  mode: PuzzleMode;
  player: ReturnType<typeof usePlayer>;
  modal: StageModal;
  onCloseModal: () => void;
  onOpenArchive: () => void;
  onToast: (message: string, duration?: number) => void;
  onNavigate: (date: IsoDate | null) => void;
  /** Called once per loaded puzzle (with the saved progress, for the welcome screen). */
  onLoaded: (loaded: StageLoaded) => void;
}

/** Links: loads the puzzle + saved progress, owns its archive and modals. */
export function SpojeniStage({
  requestedDate,
  today,
  mode,
  player,
  modal,
  onCloseModal,
  onOpenArchive,
  onToast,
  onNavigate,
  onLoaded,
}: SpojeniStageProps) {
  const { state, retry } = usePuzzle(requestedDate ?? today, today, mode, player.ready ? player.stores.progress : null);
  const loaded = state.status === 'ready' ? state.loaded : null;
  const initialGuesses = state.status === 'ready' ? state.initialGuesses : null;

  // Report what loaded, with the progress rebuilt from the saved guesses.
  const report = useMemo<StageLoaded | null>(
    () =>
      loaded && initialGuesses
        ? {
            id: loaded.puzzle.id,
            date: loaded.puzzle.date,
            number: loaded.summary.number,
            progress: spojeniProgress(loaded.puzzle, initialGuesses),
          }
        : null,
    [loaded, initialGuesses],
  );
  useEffect(() => {
    if (report) onLoaded(report);
  }, [report, onLoaded]);

  // Archive data (loaded when the archive opens).
  const [archive, setArchive] = useState<{ puzzles: PuzzleSummary[]; statuses: Record<string, GameStatus> }>({
    puzzles: [],
    statuses: {},
  });
  useEffect(() => {
    if (modal !== 'archive') return;
    let alive = true;
    (async () => {
      const puzzles = await listPublishedPuzzles(today, mode);
      const entries = await Promise.all(
        puzzles.map(async (p) => [p.id, (await player.stores.progress.load(p.id))?.status] as const),
      );
      const statuses = Object.fromEntries(entries.filter(([, s]) => s)) as Record<string, GameStatus>;
      if (alive) setArchive({ puzzles, statuses });
    })().catch(console.error);
    return () => {
      alive = false;
    };
  }, [modal, today, mode, player.stores.progress]);

  const isDaily = requestedDate === null || requestedDate === today;

  const handleProgress = useCallback(
    (progress: GameProgress) => void player.stores.progress.save(progress),
    [player.stores.progress],
  );

  const { recordResult } = player;
  const loadedMode = loaded?.mode;
  const handleComplete = useCallback(
    (result: GameResult) => {
      if (isDaily && loadedMode) void recordResult({ ...result, mode: loadedMode }, loadedMode);
    },
    [isDaily, loadedMode, recordResult],
  );

  const modeLabel = strings.modeNames[mode];

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        {state.status === 'ready' && loaded ? (
          <motion.div
            key={loaded.puzzle.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Game
              puzzle={loaded.puzzle}
              summary={loaded.summary}
              mode={loaded.mode}
              initialGuesses={state.initialGuesses}
              isDaily={isDaily}
              isFallback={loaded.isFallback}
              stats={player.stats[loaded.mode]}
              today={today}
              hintOpen={modal === 'hint'}
              onCloseHint={onCloseModal}
              onToast={onToast}
              onProgress={handleProgress}
              onComplete={handleComplete}
              onBackToToday={() => onNavigate(null)}
            />
          </motion.div>
        ) : state.status === 'error' ? (
          <motion.div
            key="error"
            className={appStyles.message}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <p className={appStyles.messageTitle}>{state.notFound ? strings.noPuzzle : strings.loadError}</p>
            <div className={appStyles.messageActions}>
              {!state.notFound && (
                <button type="button" className={appStyles.button} onClick={retry}>
                  {strings.retry}
                </button>
              )}
              <button type="button" className={appStyles.button} onClick={onOpenArchive}>
                {strings.archive}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="loading"
            className={appStyles.loading}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-busy="true"
            aria-label={strings.loading}
          >
            <p className={appStyles.loadingText}>{strings.loading}</p>
            <GridSkeleton />
          </motion.div>
        )}
      </AnimatePresence>

      <HowToPlayModal open={modal === 'help'} onClose={onCloseModal} />
      <StatsModal
        open={modal === 'stats'}
        onClose={onCloseModal}
        stats={player.stats[mode]}
        today={today}
        modeLabel={modeLabel}
      />
      <ArchiveModal
        open={modal === 'archive'}
        onClose={onCloseModal}
        puzzles={archive.puzzles}
        statuses={archive.statuses}
        currentId={loaded?.puzzle.id ?? null}
        today={today}
        modeLabel={modeLabel}
        onSelect={(date) => {
          onCloseModal();
          onNavigate(date === today ? null : date);
        }}
      />
    </>
  );
}
