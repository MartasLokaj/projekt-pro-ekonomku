import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { strings } from '../../i18n/en';
import { GAME_IDS, type GameId } from '../../types/games';
import {
  ArchiveIcon,
  CheckIcon,
  HelpIcon,
  LogoMark,
  MenuIcon,
  MoonIcon,
  SettingsIcon,
  SlovoMark,
  StatsIcon,
  SunIcon,
  UserIcon,
} from '../Icons';
import styles from './Header.module.css';

export interface HeaderProps {
  /** Game shown on the page; the ☰ menu switches between games. */
  game: GameId;
  onSwitchGame: (game: GameId) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenHelp: () => void;
  onOpenStats: () => void;
  onOpenArchive: () => void;
  /** Menu label of the archive ("Archive", or "All words" in Circular Words). */
  archiveLabel?: string;
  /** EXTENSION POINT: wire to real sign-in once accounts exist. */
  onSignIn: () => void;
  onHome: () => void;
}

interface MenuItem {
  label: string;
  icon: ReactNode;
  onSelect?: () => void;
  /** Placeholder for features that are not built yet. */
  soon?: boolean;
}

const GAME_MARKS = { spojeni: LogoMark, slovo: SlovoMark } as const;

/** Site bar: menu + brand on the left, theme and sign-in on the right. */
export function Header({
  game,
  onSwitchGame,
  theme,
  onToggleTheme,
  onOpenHelp,
  onOpenStats,
  onOpenArchive,
  archiveLabel = strings.archive,
  onSignIn,
  onHome,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const BrandMark = GAME_MARKS[game];

  const items: MenuItem[] = [
    { label: strings.howToPlay, icon: <HelpIcon size={20} />, onSelect: onOpenHelp },
    { label: strings.stats, icon: <StatsIcon size={20} />, onSelect: onOpenStats },
    { label: archiveLabel, icon: <ArchiveIcon size={20} />, onSelect: onOpenArchive },
    // EXTENSION POINTS — wire these up once settings & accounts exist.
    { label: strings.settings, icon: <SettingsIcon size={20} />, soon: true },
    { label: strings.signIn, icon: <UserIcon size={20} />, soon: true },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <div className={styles.menuWrap} ref={menuRef}>
            <button
              type="button"
              className={styles.iconButton}
              aria-label={strings.menu}
              title={strings.menu}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <MenuIcon />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.ul
                  role="menu"
                  className={styles.menu}
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                >
                  <li role="none" className={styles.menuHeading} aria-hidden="true">
                    {strings.gamesMenuTitle}
                  </li>
                  {GAME_IDS.map((g) => {
                    const Mark = GAME_MARKS[g];
                    const active = g === game;
                    return (
                      <li key={g} role="none">
                        <button
                          type="button"
                          role="menuitemradio"
                          aria-checked={active}
                          className={`${styles.menuItem} ${styles.gameItem} ${active ? styles.gameActive : ''}`}
                          onClick={() => {
                            setMenuOpen(false);
                            if (!active) onSwitchGame(g);
                          }}
                        >
                          <span className={styles.menuIcon}>
                            <Mark size={22} />
                          </span>
                          <span className={styles.gameText}>
                            <span>{strings.games[g]}</span>
                            <span className={styles.gameTagline}>{strings.gameTaglines[g]}</span>
                          </span>
                          {active && <CheckIcon size={18} className={styles.gameCheck} />}
                        </button>
                      </li>
                    );
                  })}
                  <li role="separator" className={styles.menuDivider} />
                  {items.map((item) => (
                    <li key={item.label} role="none">
                      <button
                        type="button"
                        role="menuitem"
                        className={styles.menuItem}
                        disabled={item.soon}
                        onClick={() => {
                          setMenuOpen(false);
                          item.onSelect?.();
                        }}
                      >
                        <span className={styles.menuIcon}>{item.icon}</span>
                        <span>{item.label}</span>
                        {item.soon && <span className={styles.soon}>{strings.comingSoon}</span>}
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          <button type="button" className={styles.brand} onClick={onHome} aria-label={strings.today}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={game}
                className={styles.brandInner}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <BrandMark size={24} />
                <span className={`${styles.title} ${strings.games[game].length > 10 ? styles.titleLong : ''}`}>{strings.games[game]}</span>
              </motion.span>
            </AnimatePresence>
          </button>
        </div>

        <div className={styles.right}>
          <button
            type="button"
            className={styles.iconButton}
            aria-label={strings.toggleTheme}
            title={strings.toggleTheme}
            onClick={onToggleTheme}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={theme}
                className={styles.iconSwap}
                initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.2 }}
              >
                {theme === 'dark' ? <SunIcon size={22} /> : <MoonIcon size={22} />}
              </motion.span>
            </AnimatePresence>
          </button>
          <button type="button" className={styles.signIn} onClick={onSignIn}>
            {strings.signInShort}
          </button>
        </div>
      </div>
    </header>
  );
}
