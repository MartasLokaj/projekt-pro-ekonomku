import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { evaluateGuess, hardModeIssue, keyboardStates, letters, normalizeWord, toLetter } from './logic';
import { restoreState, slovoReducer, type SlovoState } from './reducer';
import { buildSlovoShareText } from './share';
import { firstUnfinished, nextNumber } from './repository';
import { applySlovoResult, EMPTY_SLOVO_STATS } from './stats';
import type { SlovoResult } from './types';

const type = (s: SlovoState, word: string) =>
  letters(word).reduce((acc, letter) => slovoReducer(acc, { type: 'type', letter }), s);
const play = (s: SlovoState, word: string) => {
  const committed = slovoReducer(type(s, word), { type: 'commit' });
  const revealed = slovoReducer(committed, { type: 'revealDone' });
  return slovoReducer(revealed, { type: 'bounceDone' });
};

describe('evaluateGuess', () => {
  it('colours exact, misplaced and missing letters', () => {
    expect(evaluateGuess('waste', 'waste')).toEqual(Array(5).fill('correct'));
    expect(evaluateGuess('steam', 'waste')).toEqual(['present', 'present', 'present', 'present', 'absent']);
  });

  it('never uses the turquoise accent state for English words', () => {
    expect(evaluateGuess('green', 'reuse')).not.toContain('accent');
    expect(evaluateGuess('cycle', 'reuse')).not.toContain('accent');
  });

  it('handles repeated letters like Wordle', () => {
    // The answer's E's are both green → the extra E is grey.
    expect(evaluateGuess('geese', 'reuse')).toEqual(['absent', 'correct', 'absent', 'correct', 'correct']);
    // The unmatched R is yellow; the first E is grey because both E's are used by greens.
    expect(evaluateGuess('eerie', 'reuse')).toEqual(['absent', 'correct', 'present', 'absent', 'correct']);
    // The single A is used by the green match → the other A's are grey, not yellow.
    expect(evaluateGuess('ahaha', 'brand')).toEqual(['absent', 'absent', 'correct', 'absent', 'absent']);
  });
});

describe('input helpers', () => {
  it('accepts English letters only and normalises case', () => {
    expect(toLetter('A')).toBe('a');
    expect(toLetter('z')).toBe('z');
    expect(toLetter('é')).toBeNull();
    expect(toLetter('Č')).toBeNull();
    expect(toLetter('1')).toBeNull();
    expect(toLetter('Enter')).toBeNull();
    expect(normalizeWord(' WASTE ')).toBe('waste');
  });

  it('keeps the best state per keyboard key', () => {
    const { states, variants } = keyboardStates(
      ['steam', 'waste'],
      [evaluateGuess('steam', 'waste'), evaluateGuess('waste', 'waste')],
      'waste',
    );
    expect(states).toMatchObject({ w: 'correct', a: 'correct', s: 'correct', t: 'correct', e: 'correct', m: 'absent' });
    expect(variants.size).toBe(0);
  });
});

describe('hard mode', () => {
  it('requires yellow letters to be included', () => {
    expect(hardModeIssue('cycle', ['steam'], [evaluateGuess('steam', 'waste')])).toEqual({ kind: 'include', letter: 's' });
  });

  it('requires green letters to stay in place', () => {
    const evals = [evaluateGuess('paste', 'waste')];
    expect(hardModeIssue('reuse', ['paste'], evals)).toEqual({ kind: 'position', index: 1, letter: 'a' });
    expect(hardModeIssue('waste', ['paste'], evals)).toBeNull();
  });
});

describe('slovoReducer', () => {
  it('types, deletes and ignores a sixth letter', () => {
    let s = restoreState('waste', []);
    s = type(s, 'steam!');
    expect(s.current.join('')).toBe('steam');
    s = slovoReducer(s, { type: 'backspace' });
    expect(s.current.join('')).toBe('stea');
  });

  it('rejects without changing the board and counts feedback ids', () => {
    let s = type(restoreState('waste', []), 'wast');
    s = slovoReducer(s, { type: 'reject', reason: 'short' });
    s = slovoReducer(s, { type: 'reject', reason: 'short' });
    expect(s.feedback?.id).toBe(2);
    expect(s.guesses).toEqual([]);
  });

  it('reveals, then bounces on a win', () => {
    let s = slovoReducer(type(restoreState('waste', []), 'waste'), { type: 'commit' });
    expect(s.phase).toBe('revealing');
    expect(s.status).toBe('won');
    expect(s.revealedCount).toBe(0);
    s = slovoReducer(s, { type: 'type', letter: 'a' });
    expect(s.current).toEqual([]); // input locked during animation
    s = slovoReducer(s, { type: 'revealDone' });
    expect(s.phase).toBe('bouncing');
    expect(s.revealedCount).toBe(1);
  });

  it('loses after six wrong guesses and restores the same state', () => {
    let s = restoreState('waste', []);
    const words = ['steam', 'solar', 'cycle', 'green', 'scrap', 'reuse'];
    for (const w of words) s = play(s, w);
    expect(s.status).toBe('lost');
    const restored = restoreState('waste', [...words, 'waste']);
    expect(restored.status).toBe('lost');
    expect(restored.guesses).toEqual(words);
  });
});

describe('stats & share', () => {
  const result = (word: string, won: boolean, guessCount = 3): SlovoResult => ({
    puzzleId: `slovo-${word}`,
    puzzleNumber: 1,
    won,
    guessCount,
    evaluations: [],
    completedAt: '2026-10-02T10:00:00.000Z',
  });

  it('counts each word once and the streak as wins in a row', () => {
    let s = applySlovoResult(EMPTY_SLOVO_STATS, result('reuse', true, 3));
    s = applySlovoResult(s, result('reuse', true, 3));
    s = applySlovoResult(s, result('earth', true, 1));
    expect(s.played).toBe(2);
    expect(s.currentStreak).toBe(2);
    expect(s.guessDistribution).toEqual([1, 0, 1, 0, 0, 0]);
    s = applySlovoResult(s, result('glass', false));
    expect(s.currentStreak).toBe(0);
    expect(s.maxStreak).toBe(2);
    expect(s.lastPlayedDate).toBe('2026-10-02');
  });

  it('formats the share text', () => {
    const evals = [evaluateGuess('steam', 'waste'), evaluateGuess('waste', 'waste')];
    expect(buildSlovoShareText({ evaluations: evals, won: true, number: 3, dark: true })).toBe(
      'Circular Words\nWord #3 · 2/6\n\n🟨🟨🟨🟨⬛\n🟩🟩🟩🟩🟩',
    );
  });
});

describe('tasks', () => {
  const words = ['reuse', 'earth', 'glass'].map((answer, i) => ({ id: `slovo-${answer}`, number: i + 1, answer }));

  it('opens the first word the player has not finished', async () => {
    const saved: Record<string, 'playing' | 'won' | 'lost'> = { 'slovo-reuse': 'won', 'slovo-earth': 'playing' };
    expect(await firstUnfinished(words, async (id) => saved[id])).toBe(2);
    saved['slovo-earth'] = 'lost';
    expect(await firstUnfinished(words, async (id) => saved[id])).toBe(3);
    saved['slovo-glass'] = 'won';
    expect(await firstUnfinished(words, async (id) => saved[id])).toBe(1); // all done → start again
  });

  it('moves to the next word and wraps after the last one', () => {
    expect(nextNumber(1, 3)).toBe(2);
    expect(nextNumber(3, 3)).toBe(1);
  });
});

describe('word list (answers.json)', () => {
  const dir = fileURLToPath(new URL('../../public/data/slovo/', import.meta.url));
  const allowed = new Set(fs.readFileSync(dir + 'words.txt', 'utf8').split('\n').filter(Boolean));
  const file = JSON.parse(fs.readFileSync(dir + 'answers.json', 'utf8')) as {
    words: { word: string; type: string; meaning: string; circular: string }[];
  };

  it('has unique 5-letter answers that are all in the guess list', () => {
    const answers = file.words.map((w) => w.word);
    expect(answers.length).toBeGreaterThan(0);
    expect(new Set(answers).size).toBe(answers.length);
    for (const w of answers) {
      expect(w).toMatch(/^[a-z]{5}$/);
      expect(normalizeWord(w)).toBe(w);
      expect(allowed.has(w)).toBe(true);
    }
    expect(answers[0]).toBe('reuse');
  });

  it('explains every word in English', () => {
    for (const w of file.words) {
      expect(w.type.length, w.word).toBeGreaterThan(2);
      expect(w.meaning.length, w.word).toBeGreaterThan(10);
      expect(w.circular.length, w.word).toBeGreaterThan(30);
      expect(w.meaning + w.circular, w.word).not.toMatch(/[ěščřžůďťň]/i); // no Czech left by mistake (é is fine: café)
    }
  });
});
