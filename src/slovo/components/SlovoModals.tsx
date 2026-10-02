import { AnimatePresence, motion } from 'motion/react';
import { strings } from '../../i18n/en';
import { StatusBadge } from '../../components/ArchiveModal/ArchiveModal';
import archiveStyles from '../../components/ArchiveModal/ArchiveModal.module.css';
import { ChevronRightIcon } from '../../components/Icons';
import { Modal } from '../../components/Modal/Modal';
import { StatsPanel, type StatsDistribution } from '../../components/Stats/StatsPanel';
import helpStyles from '../../components/HowToPlayModal/HowToPlayModal.module.css';
import hintStyles from '../../components/HintModal/HintModal.module.css';
import resultStyles from '../../components/WinLoseModal/WinLoseModal.module.css';
import type { GameStatus } from '../../types/game';
import type { IsoDate } from '../../types/puzzle';
import { displayLetter, letters, MAX_GUESSES } from '../logic';
import type { SlovoStats } from '../stats';
import { SLOVO_TIMINGS, type SlovoTimings } from '../timings';
import type { LetterState, SlovoPuzzle, SlovoSummary, WordInfo } from '../types';
import { SlovoTile } from './Board';
import { SlovoShare } from './SlovoShare';
import styles from './SlovoModals.module.css';

function distribution(stats: SlovoStats, highlight: number | null): StatsDistribution {
  return {
    title: strings.slovo.statsDistribution,
    rows: Array.from({ length: MAX_GUESSES }, (_, i) => ({ label: String(i + 1), count: stats.guessDistribution[i] ?? 0 })),
    highlight,
    highlightColor: 'var(--sl-correct)',
    highlightTextColor: 'var(--sl-revealed-text)',
    empty: strings.slovo.statsEmpty,
  };
}

/** The answer as a row of small green tiles. */
function AnswerTiles({ answer, timings }: { answer: string; timings: SlovoTimings }) {
  return (
    <div className={styles.answer} aria-label={`${strings.slovo.answerWas}: ${displayLetter(answer)}`}>
      {letters(answer).map((ch, i) => (
        <SlovoTile key={i} index={i} letter={ch} state="correct" flip size="small" timings={{ ...timings, flipStagger: 120 }} />
      ))}
    </div>
  );
}

// ── After the game: what the word means ──────────────────────────────────────
/** The English explanation of the answer, shown after every game (won or lost). */
export function WordInfoCard({ answer, info }: { answer: string; info: WordInfo }) {
  return (
    <section className={styles.info} aria-label={strings.slovo.explainTitle}>
      <p className={styles.infoTitle}>{strings.slovo.explainTitle}</p>
      <p className={styles.infoWord}>
        <strong>{displayLetter(answer)}</strong> <span className={styles.infoType}>{info.type}</span>
      </p>
      <p className={styles.infoText}>{info.meaning}</p>
      <p className={styles.infoLabel}>{strings.slovo.explainCircular}</p>
      <p className={styles.infoText}>{info.circular}</p>
    </section>
  );
}

/** "Next word →" (or "Back to word 1" after the last word). */
export function NextWordButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <motion.button type="button" className={styles.nextButton} onClick={onClick} whileTap={{ scale: 0.97 }}>
      {label}
      <ChevronRightIcon size={20} />
    </motion.button>
  );
}

// ── End of game ─────────────────────────────────────────────────────────────
export interface SlovoResultModalProps {
  open: boolean;
  onClose: () => void;
  puzzle: SlovoPuzzle;
  won: boolean;
  evaluations: LetterState[][];
  today: IsoDate;
  stats: SlovoStats;
  dark: boolean;
  timings: SlovoTimings;
  nextLabel: string;
  onNext: () => void;
  onCopyResult: (ok: boolean) => void;
}

export function SlovoResultModal({
  open,
  onClose,
  puzzle,
  won,
  evaluations,
  today,
  stats,
  dark,
  timings,
  nextLabel,
  onNext,
  onCopyResult,
}: SlovoResultModalProps) {
  const n = evaluations.length;
  const headline = won ? strings.slovo.winToasts[Math.min(n, MAX_GUESSES) - 1] : strings.slovo.loseHeadline;

  return (
    <Modal open={open} onClose={onClose} title={headline} hideTitle>
      <div className={resultStyles.content}>
        <motion.p
          className={resultStyles.headline}
          aria-hidden="true"
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.08, type: 'spring', stiffness: 360, damping: 22 }}
        >
          {headline}
        </motion.p>
        <p className={resultStyles.message}>{won ? strings.slovo.winMessage(n) : strings.slovo.loseMessage}</p>
        <p className={styles.answerLabel}>{strings.slovo.answerWas}</p>
        <AnswerTiles answer={puzzle.answer} timings={timings} />
        <WordInfoCard answer={puzzle.answer} info={puzzle.info} />
        <div className={styles.nextWrap}>
          <NextWordButton label={nextLabel} onClick={onNext} />
        </div>
        <p className={resultStyles.meta}>{strings.slovo.wordOf(puzzle.number, puzzle.total)}</p>

        <SlovoShare
          evaluations={evaluations}
          won={won}
          number={puzzle.number}
          dark={dark}
          onCopyResult={onCopyResult}
        />

        <hr className={resultStyles.divider} />

        <StatsPanel
          stats={stats}
          today={today}
          streakDecays={false}
          distribution={distribution(stats, won ? n - 1 : null)}
        />
      </div>
    </Modal>
  );
}

// ── Stats ───────────────────────────────────────────────────────────────────
export function SlovoStatsModal(props: {
  open: boolean;
  onClose: () => void;
  stats: SlovoStats;
  today: IsoDate;
}) {
  return (
    <Modal open={props.open} onClose={props.onClose} title={strings.stats}>
      <StatsPanel
        stats={props.stats}
        today={props.today}
        streakDecays={false}
        distribution={distribution(props.stats, null)}
      />
    </Modal>
  );
}

// ── How to play ─────────────────────────────────────────────────────────────
export function SlovoHelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = strings.slovo;
  return (
    <Modal open={open} onClose={onClose} title={strings.howToPlay}>
      <div className={helpStyles.body}>
        <p className={helpStyles.lead}>{s.helpIntro}</p>
        <ul className={helpStyles.rules}>
          {s.helpRules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>

        <h3 className={helpStyles.sub}>{s.helpExamplesTitle}</h3>
        <div className={styles.examples}>
          {s.helpExamples.map((ex, k) => (
            <div key={ex.word} className={styles.example}>
              <div className={styles.exampleRow}>
                {letters(ex.word).map((ch, i) => (
                  <SlovoTile
                    key={i}
                    index={k + 1}
                    letter={ch}
                    state={i === ex.index ? ex.state : undefined}
                    flip={i === ex.index}
                    size="small"
                    timings={{ ...SLOVO_TIMINGS, flipStagger: 350 }}
                  />
                ))}
              </div>
              <p className={styles.exampleText}>
                <strong>{displayLetter(letters(ex.word)[ex.index])}</strong> {ex.text}
              </p>
            </div>
          ))}
        </div>
        <p className={styles.note}>{s.helpNote}</p>

        <p className={helpStyles.footer}>{s.helpFooter}</p>
      </div>
    </Modal>
  );
}

// ── Hint (lightbulb) ────────────────────────────────────────────────────────
export const MAX_HINTS = 2;

export function SlovoHintModal({
  open,
  onClose,
  answer,
  revealed,
  known,
  isOver,
  onReveal,
}: {
  open: boolean;
  onClose: () => void;
  answer: string;
  /** Positions already revealed by a hint, in order. */
  revealed: number[];
  /** Positions the player already has green. */
  known: ReadonlySet<number>;
  isOver: boolean;
  onReveal: () => void;
}) {
  const s = strings.slovo;
  const chars = letters(answer);
  const remaining = chars.some((_, i) => !known.has(i) && !revealed.includes(i));
  const canReveal = !isOver && remaining && revealed.length < MAX_HINTS;
  const note = isOver ? s.hintOver : !remaining ? s.hintNone : revealed.length >= MAX_HINTS ? s.hintMax : s.hintIntro;

  return (
    <Modal open={open} onClose={onClose} title={strings.hint} size="sm">
      <p className={hintStyles.intro}>{note}</p>
      <ul className={hintStyles.list}>
        <AnimatePresence initial={false}>
          {revealed.map((i) => (
            <motion.li
              key={i}
              className={`${hintStyles.row} ${styles.hintRow}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <SlovoTile letter={chars[i]} state="correct" flip size="small" timings={SLOVO_TIMINGS} />
              <strong className={styles.hintText}>{s.hintLetter(i, displayLetter(chars[i]))}</strong>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {canReveal && (
        <motion.button type="button" className={`${hintStyles.reveal} ${styles.hintButton}`} onClick={onReveal} whileTap={{ scale: 0.95 }}>
          {s.hintReveal} ({revealed.length + 1}/{MAX_HINTS})
        </motion.button>
      )}
    </Modal>
  );
}

// ── All words (the list of tasks) ───────────────────────────────────────────
export function SlovoWordsModal({
  open,
  onClose,
  words,
  statuses,
  currentId,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  words: SlovoSummary[];
  /** Saved status per word id (missing = not started). */
  statuses: Record<string, GameStatus | undefined>;
  currentId: string | null;
  onSelect: (number: number) => void;
}) {
  const s = strings.slovo;
  const done = words.filter((w) => statuses[w.id] === 'won' || statuses[w.id] === 'lost').length;
  return (
    <Modal open={open} onClose={onClose} title={s.allWords}>
      <p className={archiveStyles.intro}>
        {s.allWordsIntro} <strong>{s.allWordsProgress(done, words.length)}</strong>
      </p>
      <ul className={archiveStyles.list}>
        {words.map((w) => {
          const status = statuses[w.id];
          const finished = status === 'won' || status === 'lost';
          return (
            <li key={w.id}>
              <button
                type="button"
                className={`${archiveStyles.item} ${w.id === currentId ? archiveStyles.current : ''}`}
                onClick={() => onSelect(w.number)}
                aria-current={w.id === currentId || undefined}
              >
                <span className={archiveStyles.number}>{w.number}</span>
                <span className={archiveStyles.text}>
                  <span className={`${archiveStyles.date} ${finished ? styles.listWord : styles.listHidden}`}>
                    {finished ? displayLetter(w.answer) : s.hiddenWord}
                  </span>
                </span>
                <StatusBadge status={status} />
                <ChevronRightIcon size={18} className={archiveStyles.chevron} />
              </button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
