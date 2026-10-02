import { describe, expect, it } from 'vitest';
import type { Puzzle } from '../types/puzzle';
import { evaluateGuess, initialBoard, moveToFront } from './gameLogic';
import { createInitialState, gameReducer, restoreState, type GameAction, type GameState } from './gameReducer';
import { buildResult, completedRows, guessColors } from './selectors';
import { buildShareText } from './share';

const puzzle: Puzzle = {
  id: 'test-1',
  date: '2026-09-23',
  categories: [
    { id: 'y', name: 'Trees', difficulty: 'yellow', words: ['Oak', 'Birch', 'Maple', 'Spruce'] },
    { id: 'g', name: 'Flowers', difficulty: 'green', words: ['Rose', 'Carnation', 'Violet', 'Iris'] },
    { id: 'b', name: 'Creatures', difficulty: 'blue', words: ['Devil', 'Goblin', 'Witch', 'Troll'] },
    { id: 'p', name: 'Bouquet', difficulty: 'purple', words: ['Water', 'Noon', 'Lily', 'Willow'] },
  ],
};

const words = (id: string) => puzzle.categories.find((c) => c.id === id)!.words;

const run = (state: GameState, ...actions: GameAction[]) => actions.reduce(gameReducer, state);

const select = (state: GameState, ws: string[]) =>
  ws.reduce((s, word) => gameReducer(s, { type: 'TOGGLE_WORD', word }), state);

/** Submits a guess and fast-forwards through every animation phase. */
function guess(state: GameState, ws: string[]): GameState {
  let s = gameReducer(select(gameReducer(state, { type: 'DESELECT_ALL' }), ws), { type: 'SUBMIT' });
  for (let i = 0; i < 20 && s.phase.name !== 'idle'; i++) {
    const p = s.phase;
    const next: GameAction =
      p.name === 'jumping'
        ? { type: 'RESOLVE_GUESS' }
        : p.name === 'solving'
          ? { type: 'FINISH_SOLVE' }
          : p.name === 'shaking'
            ? { type: 'FINISH_SHAKE' }
            : p.name === 'revealing' && p.categoryId === null
              ? { type: 'REVEAL_NEXT' }
              : { type: 'FINISH_REVEAL' };
    s = gameReducer(s, next);
  }
  return s;
}

const oneAway = ['Oak', 'Birch', 'Maple', 'Willow'];

describe('game rules', () => {
  it('evaluates correct, one-away and wrong guesses', () => {
    expect(evaluateGuess(puzzle, words('y')).outcome).toBe('correct');
    expect(evaluateGuess(puzzle, oneAway).outcome).toBe('one-away');
    expect(evaluateGuess(puzzle, ['Oak', 'Birch', 'Rose', 'Willow']).outcome).toBe('wrong');
  });

  it('builds a deterministic 16-word board without a give-away row', () => {
    const a = initialBoard(puzzle);
    expect(a).toEqual(initialBoard(puzzle));
    expect(new Set(a).size).toBe(16);
    for (let r = 0; r < 16; r += 4) {
      expect(evaluateGuess(puzzle, a.slice(r, r + 4)).outcome).not.toBe('correct');
    }
  });

  it('moveToFront swaps the group into the first four slots', () => {
    const board = initialBoard(puzzle);
    const moved = moveToFront(board, words('g'));
    expect(new Set(moved.slice(0, 4))).toEqual(new Set(words('g')));
    expect(new Set(moved)).toEqual(new Set(board));
    // Tiles that were not involved keep their slots.
    board.forEach((w, i) => {
      if (i >= 4 && !words('g').includes(w)) expect(moved[i]).toBe(w);
    });
  });
});

describe('gameReducer', () => {
  it('limits the selection to four tiles and toggles', () => {
    let s = select(createInitialState(puzzle), [...words('y'), 'Rose']);
    expect(s.selected).toEqual(words('y'));
    s = gameReducer(s, { type: 'TOGGLE_WORD', word: 'Oak' });
    expect(s.selected).not.toContain('Oak');
    s = gameReducer(s, { type: 'DESELECT_ALL' });
    expect(s.selected).toEqual([]);
  });

  it('ignores submit unless exactly four are selected', () => {
    const s = run(select(createInitialState(puzzle), ['Oak']), { type: 'SUBMIT' });
    expect(s.phase.name).toBe('idle');
  });

  it('solves a category: jump → solving (moved to front) → committed', () => {
    let s = run(select(createInitialState(puzzle), words('b')), { type: 'SUBMIT' });
    expect(s.phase.name).toBe('jumping');
    s = gameReducer(s, { type: 'RESOLVE_GUESS' });
    expect(s.phase).toEqual({ name: 'solving', categoryId: 'b' });
    expect(new Set(s.board.slice(0, 4))).toEqual(new Set(words('b')));
    s = gameReducer(s, { type: 'FINISH_SOLVE' });
    expect(s.solved).toEqual(['b']);
    expect(s.board).toHaveLength(12);
    expect(s.selected).toEqual([]);
    expect(s.mistakesRemaining).toBe(4);
  });

  it('one-away costs a life, raises feedback and keeps the selection', () => {
    let s = run(select(createInitialState(puzzle), oneAway), { type: 'SUBMIT' }, { type: 'RESOLVE_GUESS' });
    expect(s.phase).toEqual({ name: 'shaking', outcome: 'one-away' });
    expect(s.feedback?.kind).toBe('one-away');
    expect(s.mistakesRemaining).toBe(3);
    s = gameReducer(s, { type: 'FINISH_SHAKE' });
    expect(s.selected).toHaveLength(4);
  });

  it('a plain miss deselects after the shake', () => {
    const s = guess(createInitialState(puzzle), ['Oak', 'Rose', 'Devil', 'Willow']);
    expect(s.selected).toEqual([]);
    expect(s.guesses.at(-1)?.outcome).toBe('wrong');
  });

  it('flags an already-guessed combination without penalty', () => {
    let s = guess(createInitialState(puzzle), ['Oak', 'Rose', 'Devil', 'Willow']);
    s = run(select(s, ['Willow', 'Devil', 'Rose', 'Oak']), { type: 'SUBMIT' });
    expect(s.feedback?.kind).toBe('already-guessed');
    expect(s.phase.name).toBe('idle');
    expect(s.mistakesRemaining).toBe(3);
  });

  it('wins after four correct groups', () => {
    let s = createInitialState(puzzle);
    for (const id of ['p', 'y', 'b', 'g']) s = guess(s, words(id));
    expect(s.status).toBe('won');
    expect(s.board).toEqual([]);
    expect(completedRows(s).map((r) => r.category.id)).toEqual(['p', 'y', 'b', 'g']);
  });

  it('loses after four mistakes and reveals the rest easiest-first', () => {
    let s = guess(createInitialState(puzzle), words('p'));
    const wrong = [
      ['Oak', 'Rose', 'Devil', 'Troll'],
      ['Oak', 'Rose', 'Devil', 'Goblin'],
      ['Oak', 'Rose', 'Carnation', 'Goblin'],
      ['Birch', 'Rose', 'Carnation', 'Goblin'],
    ];
    for (const w of wrong) s = guess(s, w);
    expect(s.status).toBe('lost');
    expect(s.mistakesRemaining).toBe(0);
    expect(s.solved).toEqual(['p']);
    expect(s.revealed).toEqual(['y', 'g', 'b']);
    expect(s.board).toEqual([]);
    expect(s.phase.name).toBe('idle');
  });

  it('blocks input while animating', () => {
    const s = run(select(createInitialState(puzzle), words('y')), { type: 'SUBMIT' });
    expect(gameReducer(s, { type: 'DESELECT_ALL' })).toBe(s);
    expect(gameReducer(s, { type: 'SHUFFLE', seed: 1 })).toBe(s);
  });
});

describe('restore & share', () => {
  it('restores a game from its guess history', () => {
    const history = [oneAway, words('y'), words('p')];
    const s = restoreState(puzzle, history);
    expect(s.solved).toEqual(['y', 'p']);
    expect(s.mistakesRemaining).toBe(3);
    expect(s.board).toHaveLength(8);
    expect(s.phase.name).toBe('idle');
  });

  it('produces the emoji share grid in guess order', () => {
    let s = createInitialState(puzzle);
    s = guess(s, oneAway);
    for (const id of ['y', 'g', 'b', 'p']) s = guess(s, words(id));
    expect(guessColors(s)[0]).toEqual(['yellow', 'yellow', 'yellow', 'purple']);
    const result = buildResult(s)!;
    expect(result.won).toBe(true);
    expect(result.mistakes).toBe(1);
    expect(buildShareText(result.guessColors, 5)).toBe(
      ['Links', 'Puzzle #5', '🟨🟨🟨🟪', '🟨🟨🟨🟨', '🟩🟩🟩🟩', '🟦🟦🟦🟦', '🟪🟪🟪🟪'].join('\n'),
    );
  });
});
