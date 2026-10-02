import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { slovoProgress } from '../../components/Welcome/progress';
import { strings } from '../../i18n/en';
import appStyles from '../../App.module.css';
import { saveSlovoResult } from '../../services/results';
import type { GameStatus } from '../../types/game';
import type { StageLoaded, StageModal } from '../../types/games';
import type { IsoDate } from '../../types/puzzle';
import type { User } from '../../types/user';
import { firstUnfinished, nextNumber, SlovoNotFoundError, slovoRepository } from '../repository';
import { applySlovoResult, createSlovoProgressStore, createSlovoStatsStore, EMPTY_SLOVO_STATS, type SlovoStats } from '../stats';
import type { SlovoProgress, SlovoPuzzle, SlovoResult, SlovoSummary } from '../types';
import { SlovoGame } from './SlovoGame';
import { SlovoHelpModal, SlovoStatsModal, SlovoWordsModal } from './SlovoModals';

export interface SlovoStageProps {
  /** Task number from the URL; `null` = the first word the player has not finished. */
  requestedWord: number | null;
  today: IsoDate;
  user: User | null;
  userKey: string;
  dark: boolean;
  modal: StageModal;
  /** The welcome screen is up: ignore the physical keyboard. */
  paused?: boolean;
  onCloseModal: () => void;
  onOpenArchive: () => void;
  onToast: (message: string, duration?: number) => void;
  onNavigateWord: (word: number | null) => void;
  /** Called once per loaded word (with the saved progress, for the welcome screen). */
  onLoaded: (loaded: StageLoaded) => void;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; notFound: boolean }
  | { status: 'ready'; puzzle: SlovoPuzzle; initialGuesses: string[] };

/**
 * Circular Words: a list of tasks (word 1, 2, 3 …). Loads the requested word
 * (or the first unfinished one) with its saved progress; owns stats, the
 * "All words" list and the modals.
 */
export function SlovoStage({
  requestedWord,
  today,
  user,
  userKey,
  dark,
  modal,
  paused = false,
  onCloseModal,
  onOpenArchive,
  onToast,
  onNavigateWord,
  onLoaded,
}: SlovoStageProps) {
  const progressStore = useMemo(() => createSlovoProgressStore(userKey), [userKey]);
  const statsStore = useMemo(() => createSlovoStatsStore(userKey), [userKey]);
  const statusOf = useCallback(async (id: string) => (await progressStore.load(id))?.status, [progressStore]);

  // ── Word + progress ───────────────────────────────────────────────────────
  const [attempt, setAttempt] = useState(0);
  const key = `${requestedWord ?? 'next'}|${attempt}`;
  const [settled, setSettled] = useState<{ key: string; state: LoadState } | null>(null);
  useEffect(() => {
    let alive = true;
    (async (): Promise<LoadState> => {
      try {
        const number = requestedWord ?? (await firstUnfinished(await slovoRepository.listWords(), statusOf));
        const puzzle = await slovoRepository.getPuzzle(number);
        const progress = await progressStore.load(puzzle.id);
        return { status: 'ready', puzzle, initialGuesses: progress?.guesses ?? [] };
      } catch (err) {
        console.error(err);
        return { status: 'error', notFound: err instanceof SlovoNotFoundError };
      }
    })().then((state) => alive && setSettled({ key, state }));
    return () => {
      alive = false;
    };
  }, [key, requestedWord, statusOf, progressStore]);
  const load: LoadState = settled?.key === key ? settled.state : { status: 'loading' };
  const puzzle = load.status === 'ready' ? load.puzzle : null;
  const initialGuesses = load.status === 'ready' ? load.initialGuesses : null;

  // Report what loaded, with the progress rebuilt from the saved guesses.
  const report = useMemo<StageLoaded | null>(
    () =>
      puzzle && initialGuesses
        ? {
            id: puzzle.id,
            date: today,
            number: puzzle.number,
            label: strings.slovo.wordOf(puzzle.number, puzzle.total),
            progress: slovoProgress(puzzle.answer, initialGuesses),
          }
        : null,
    [puzzle, initialGuesses, today],
  );
  useEffect(() => {
    if (report) onLoaded(report);
  }, [report, onLoaded]);

  // ── Stats (every finished word counts once) ──────────────────────────────
  const [stats, setStats] = useState<SlovoStats>(EMPTY_SLOVO_STATS);
  useEffect(() => {
    let alive = true;
    statsStore.get().then((s) => alive && setStats(s));
    return () => {
      alive = false;
    };
  }, [statsStore]);

  const handleProgress = useCallback((p: SlovoProgress) => void progressStore.save(p), [progressStore]);
  const handleComplete = useCallback(
    async (result: SlovoResult) => {
      const next = applySlovoResult(await statsStore.get(), result);
      await statsStore.save(next);
      setStats(next);
      if (user) saveSlovoResult(user.id, result).catch((err) => console.error('saveSlovoResult failed', err));
    },
    [statsStore, user],
  );

  // ── Next task ─────────────────────────────────────────────────────────────
  const goNext = useCallback(() => {
    if (!puzzle) return;
    onCloseModal();
    onNavigateWord(nextNumber(puzzle.number, puzzle.total));
  }, [puzzle, onCloseModal, onNavigateWord]);
  const nextLabel = puzzle && puzzle.number >= puzzle.total ? strings.slovo.startAgain : strings.slovo.nextWord;

  // ── All words ─────────────────────────────────────────────────────────────
  const [list, setList] = useState<{ words: SlovoSummary[]; statuses: Record<string, GameStatus> }>({
    words: [],
    statuses: {},
  });
  useEffect(() => {
    if (modal !== 'archive') return;
    let alive = true;
    (async () => {
      const words = await slovoRepository.listWords();
      const entries = await Promise.all(words.map(async (w) => [w.id, await statusOf(w.id)] as const));
      const statuses = Object.fromEntries(entries.filter(([, s]) => s)) as Record<string, GameStatus>;
      if (alive) setList({ words, statuses });
    })().catch(console.error);
    return () => {
      alive = false;
    };
  }, [modal, statusOf]);

  const isAllowed = useCallback((word: string) => slovoRepository.isAllowed(word), []);

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        {load.status === 'ready' ? (
          <motion.div
            key={load.puzzle.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <SlovoGame
              puzzle={load.puzzle}
              initialGuesses={load.initialGuesses}
              stats={stats}
              today={today}
              dark={dark}
              isAllowed={isAllowed}
              hintOpen={modal === 'hint'}
              inputBlocked={paused || (modal !== null && modal !== 'hint')}
              onCloseHint={onCloseModal}
              onToast={onToast}
              onProgress={handleProgress}
              onComplete={handleComplete}
              nextLabel={nextLabel}
              onNext={goNext}
            />
          </motion.div>
        ) : load.status === 'error' ? (
          <motion.div
            key="error"
            className={appStyles.message}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <p className={appStyles.messageTitle}>{load.notFound ? strings.slovo.noWord : strings.slovo.loadError}</p>
            <div className={appStyles.messageActions}>
              {!load.notFound && (
                <button type="button" className={appStyles.button} onClick={() => setAttempt((a) => a + 1)}>
                  {strings.retry}
                </button>
              )}
              <button type="button" className={appStyles.button} onClick={onOpenArchive}>
                {strings.slovo.allWords}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.p
            key="loading"
            className={appStyles.loadingText}
            style={{ textAlign: 'center' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-busy="true"
          >
            {strings.slovo.loading}
          </motion.p>
        )}
      </AnimatePresence>

      <SlovoHelpModal open={modal === 'help'} onClose={onCloseModal} />
      <SlovoStatsModal open={modal === 'stats'} onClose={onCloseModal} stats={stats} today={today} />
      <SlovoWordsModal
        open={modal === 'archive'}
        onClose={onCloseModal}
        words={list.words}
        statuses={list.statuses}
        currentId={puzzle?.id ?? null}
        onSelect={(n) => {
          onCloseModal();
          onNavigateWord(n);
        }}
      />
    </>
  );
}
