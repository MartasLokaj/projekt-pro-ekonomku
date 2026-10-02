import { strings } from '../../i18n/en';
import { DIFFICULTIES, PUZZLE_MODES } from '../../types/puzzle';
import { FeatherIcon, FlameIcon } from '../Icons';
import { Modal } from '../Modal/Modal';
import styles from './HowToPlayModal.module.css';

export function HowToPlayModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title={strings.howToPlay}>
      <div className={styles.body}>
        <p className={styles.lead}>{strings.howToPlayIntro}</p>
        <ul className={styles.rules}>
          {strings.howToPlayRules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>

        <h3 className={styles.sub}>{strings.howToPlayModesTitle}</h3>
        <div className={styles.modes}>
          {PUZZLE_MODES.map((m) => {
            const Icon = m === 'easy' ? FeatherIcon : FlameIcon;
            return (
              <div key={m} className={styles.mode}>
                <span className={styles.modeBadge} data-mode={m}>
                  <Icon size={17} />
                  {strings.modeNames[m]}
                </span>
                <span className={styles.modeText}>{strings.howToPlayModes[m]}</span>
              </div>
            );
          })}
          <p className={styles.modeNote}>{strings.howToPlayModesNote}</p>
        </div>

        <h3 className={styles.sub}>{strings.howToPlayExamplesTitle}</h3>
        <ul className={styles.examples}>
          {strings.howToPlayExamples.map((ex) => (
            <li key={ex.name}>
              <strong>{ex.name.toLocaleUpperCase('en')}:</strong> {ex.words}
            </li>
          ))}
        </ul>

        <h3 className={styles.sub}>{strings.howToPlayColors}</h3>
        <div className={styles.legend}>
          {DIFFICULTIES.map((d) => (
            <div key={d} className={styles.legendItem}>
              <span className={styles.swatch} style={{ background: `var(--${d})` }} />
              {strings.difficultyNames[d]}
            </div>
          ))}
        </div>

        <p className={styles.footer}>{strings.howToPlayFooter}</p>
      </div>
    </Modal>
  );
}
