import { strings } from '../../i18n/en';
import type { PuzzleMode } from '../../types/puzzle';
import { BulbIcon, HelpIcon, StatsIcon } from '../Icons';
import { ModeSwitch } from '../ModeSwitch/ModeSwitch';
import styles from './Toolbar.module.css';

export interface ToolbarProps {
  mode: PuzzleMode;
  /** Circular Words has a single mode, so the switch is hidden there. */
  showModeSwitch?: boolean;
  onModeChange: (mode: PuzzleMode) => void;
  onHint: () => void;
  onStats: () => void;
  onHelp: () => void;
  /** No puzzle loaded yet → hints are unavailable. */
  hintDisabled?: boolean;
}

/** Sticky bar: difficulty switch on the left (Links only), the game's three actions (hint, stats, help) on the right. */
export function Toolbar({ mode, showModeSwitch = true, onModeChange, onHint, onStats, onHelp, hintDisabled }: ToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.inner}>
        {showModeSwitch && <ModeSwitch mode={mode} onChange={onModeChange} />}
        <div className={styles.icons}>
          <button
            type="button"
            className={styles.button}
            onClick={onHint}
            disabled={hintDisabled}
            aria-label={strings.hint}
            title={strings.hint}
          >
            <BulbIcon size={28} />
          </button>
          <button
            type="button"
            className={styles.button}
            onClick={onStats}
            aria-label={strings.stats}
            title={strings.stats}
          >
            <StatsIcon size={28} />
          </button>
          <button
            type="button"
            className={styles.button}
            onClick={onHelp}
            aria-label={strings.howToPlay}
            title={strings.howToPlay}
          >
            <HelpIcon size={28} />
          </button>
        </div>
      </div>
    </div>
  );
}
