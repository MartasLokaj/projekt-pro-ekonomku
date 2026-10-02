import { AnimatePresence, MotionConfig } from 'motion/react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Header } from './components/Header/Header';
import { PuzzleHero } from './components/PuzzleHero/PuzzleHero';
import { SpojeniStage } from './components/SpojeniStage/SpojeniStage';
import { Toast } from './components/Toast/Toast';
import { Toolbar } from './components/Toolbar/Toolbar';
import { WelcomeScreen } from './components/Welcome/WelcomeScreen';
import { useMode } from './hooks/useMode';
import { usePlayer } from './hooks/usePlayer';
import { useRoute } from './hooks/useRoute';
import { useTheme } from './hooks/useTheme';
import { useToast } from './hooks/useToast';
import { strings } from './i18n/en';
import { todayIso } from './lib/dates';
import { localStore } from './services/storage';
import { SlovoStage } from './slovo/components/SlovoStage';
import type { GameId, StageLoaded, StageModal } from './types/games';
import type { PuzzleMode } from './types/puzzle';
import styles from './App.module.css';

/** First visit of each game opens its rules once. */
const helpKey = (game: GameId) => (game === 'spojeni' ? 'seenHelp' : `seenHelp:${game}`);

/**
 * Page shell shared by all games: site bar with the ☰ game switcher, big
 * title with the date, sticky toolbar (mode for Links, hint, stats, help) and the stage
 * where the selected game renders its board and its own modals.
 * Opening a game (page load or the ☰ menu) first shows its welcome screen.
 */
export default function App() {
  const today = useMemo(() => todayIso(), []);
  const { theme, toggle: toggleTheme } = useTheme();
  const { route, navigate, navigateWord, switchGame } = useRoute();
  const { game, date: requestedDate, word: requestedWord } = route;
  const { mode, setMode } = useMode();
  const player = usePlayer();
  const { toast, show: showToast } = useToast();

  const [modal, setModal] = useState<StageModal>(null);
  const closeModal = useCallback(() => setModal(null), []);

  // ── Welcome screen: covers the page until the player presses a button ──
  const [welcomeOpen, setWelcomeOpen] = useState(true);
  useLayoutEffect(() => {
    if (!welcomeOpen) return;
    const root = document.documentElement;
    const { overflow } = root.style;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = overflow;
    };
  }, [welcomeOpen]);

  useEffect(() => {
    document.title = strings.games[game];
  }, [game]);

  // ── Scrolling: the big title sits above the fold; the board is what you land on ──
  const heroRef = useRef<HTMLElement>(null);
  const scrollToBoard = useCallback((smooth: boolean) => {
    const hero = heroRef.current;
    if (!hero) return;
    const header = document.querySelector('header');
    const top = hero.offsetTop + hero.offsetHeight - (header?.offsetHeight ?? 0);
    window.scrollTo({ top, behavior: smooth ? 'smooth' : 'instant' });
  }, []);
  useLayoutEffect(() => scrollToBoard(false), [scrollToBoard]);

  // The stage reports what it loaded: the hero shows its date, a new puzzle scrolls into view.
  const [loaded, setLoaded] = useState<StageLoaded | null>(null);
  const previousId = useRef<string | undefined>(undefined);
  const onLoaded = useCallback(
    (p: StageLoaded) => {
      setLoaded(p);
      if (previousId.current && previousId.current !== p.id) scrollToBoard(true);
      previousId.current = p.id;
    },
    [scrollToBoard],
  );

  const changeMode = useCallback(
    (next: PuzzleMode) => {
      setMode(next);
      showToast(strings.modeSwitched[next]);
    },
    [setMode, showToast],
  );

  const changeGame = useCallback(
    (next: GameId) => {
      setModal(null);
      setLoaded(null);
      setWelcomeOpen(true);
      switchGame(next);
    },
    [switchGame],
  );

  /** Leaves the welcome screen; the rules open once, on a player's first game. */
  const closeWelcome = useCallback(
    (then: StageModal) => {
      const firstVisit = !localStore.get(helpKey(game), false);
      localStore.set(helpKey(game), true);
      setWelcomeOpen(false);
      setModal(firstVisit && then === null ? 'help' : then);
      scrollToBoard(false);
    },
    [game, scrollToBoard],
  );

  const goToday = useCallback(() => {
    setModal(null);
    if (game === 'slovo' && requestedWord !== null) navigateWord(null);
    else if (game === 'spojeni' && requestedDate !== null) navigate(null);
    else scrollToBoard(true);
  }, [game, navigate, navigateWord, requestedDate, requestedWord, scrollToBoard]);

  const openArchive = useCallback(() => setModal('archive'), []);
  const heroDate = loaded?.date ?? requestedDate ?? today;
  // Circular Words has no dates: "Word 3 of 118" instead (a blank line while loading).
  const heroLabel = game === 'slovo' ? (loaded?.label ?? '\u00a0') : undefined;
  const signIn = useCallback(() => showToast(strings.signInSoon), [showToast]);

  const stageProps = {
    today,
    modal,
    onCloseModal: closeModal,
    onOpenArchive: openArchive,
    onToast: showToast,
    onLoaded,
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className={styles.app} inert={welcomeOpen}>
        <Header
          game={game}
          onSwitchGame={changeGame}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenHelp={() => setModal('help')}
          onOpenStats={() => setModal('stats')}
          onOpenArchive={openArchive}
          archiveLabel={game === 'slovo' ? strings.slovo.allWords : strings.archive}
          onSignIn={signIn}
          onHome={goToday}
        />

        <PuzzleHero ref={heroRef} title={strings.games[game]} date={heroDate} subtitle={heroLabel} />

        <Toolbar
          mode={mode}
          showModeSwitch={game === 'spojeni'}
          onModeChange={changeMode}
          onHint={() => setModal('hint')}
          onStats={() => setModal('stats')}
          onHelp={() => setModal('help')}
          hintDisabled={!loaded}
        />

        <main className={`${styles.stage} ${game === 'slovo' ? styles.stageSlovo : ''}`}>
          {game === 'slovo' ? (
            <SlovoStage
              key="slovo"
              {...stageProps}
              requestedWord={requestedWord}
              onNavigateWord={navigateWord}
              paused={welcomeOpen}
              user={player.user ?? null}
              userKey={player.userKey}
              dark={theme === 'dark'}
            />
          ) : (
            <SpojeniStage
              key="spojeni"
              {...stageProps}
              requestedDate={requestedDate}
              onNavigate={navigate}
              mode={mode}
              player={player}
            />
          )}
        </main>
      </div>

      <AnimatePresence>
        {welcomeOpen && (
          <WelcomeScreen
            key={game}
            game={game}
            date={heroDate}
            number={loaded?.number ?? null}
            label={heroLabel}
            modeLabel={game === 'spojeni' ? strings.modeNames[mode] : undefined}
            progress={loaded?.progress ?? null}
            isToday={heroDate === today}
            onPlay={() => closeWelcome(null)}
            onStats={() => closeWelcome('stats')}
            onSignIn={signIn}
          />
        )}
      </AnimatePresence>

      <Toast toast={toast} top={welcomeOpen} />
    </MotionConfig>
  );
}
