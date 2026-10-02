import { describe, expect, it } from 'vitest';
import { strings } from '../../i18n/en';
import type { Puzzle } from '../../types/puzzle';
import { slovoProgress, spojeniProgress, welcomeCopy } from './progress';

/** The copy uses non-breaking spaces ("3 of 6 tries" stays on one line). */
const plain = (text: string) => text.replace(/\u00a0/g, ' ');

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
const group = (id: string) => puzzle.categories.find((c) => c.id === id)!.words;
const wrong = (n: number) => [group('y')[0], group('g')[0], group('b')[0], group('p')[n]];

describe('spojeniProgress', () => {
  it('is new without saved guesses', () => {
    expect(spojeniProgress(puzzle, [])).toEqual({ kind: 'new' });
  });

  it('counts the groups found so far', () => {
    expect(spojeniProgress(puzzle, [group('y'), wrong(0), group('b')])).toEqual({ kind: 'playing', done: 2, total: 4 });
    expect(spojeniProgress(puzzle, [wrong(0)])).toEqual({ kind: 'playing', done: 0, total: 4 });
  });

  it('recognises a finished game', () => {
    expect(spojeniProgress(puzzle, [group('p'), group('b'), group('g'), group('y')])).toEqual({ kind: 'won' });
    expect(spojeniProgress(puzzle, [wrong(0), wrong(1), wrong(2), wrong(3)])).toEqual({ kind: 'lost' });
  });

  it('ignores invalid saved guesses', () => {
    expect(spojeniProgress(puzzle, [['Oak', 'Oak', 'Oak', 'Oak']])).toEqual({ kind: 'new' });
  });
});

describe('slovoProgress', () => {
  it('is new without saved words', () => {
    expect(slovoProgress('waste', [])).toEqual({ kind: 'new' });
  });

  it('counts the guesses used', () => {
    expect(slovoProgress('waste', ['steam', 'solar'])).toEqual({ kind: 'playing', done: 2, total: 6 });
  });

  it('recognises a finished game', () => {
    expect(slovoProgress('waste', ['steam', 'waste'])).toEqual({ kind: 'won' });
    expect(slovoProgress('waste', Array(6).fill('steam'))).toEqual({ kind: 'lost' });
  });
});

describe('welcomeCopy', () => {
  it('pitches the game and offers "Play" before the first move', () => {
    expect(welcomeCopy('slovo', { kind: 'new' }, true)).toEqual({ message: strings.welcome.subtitle.slovo, action: 'play' });
    // Still loading → the same generic text.
    expect(welcomeCopy('spojeni', null, true)).toEqual({ message: strings.welcome.subtitle.spojeni, action: 'play' });
  });

  it('offers "Continue" with the progress mid-game', () => {
    const spojeni = welcomeCopy('spojeni', { kind: 'playing', done: 2, total: 4 }, true);
    expect(spojeni.action).toBe('continue');
    expect(plain(spojeni.message)).toBe('You’ve found 2 of 4 groups. Keep going!');
    expect(plain(welcomeCopy('slovo', { kind: 'playing', done: 3, total: 6 }, true).message)).toBe(
      'You’ve used 3 of 6 tries. Keep going!',
    );
    expect(welcomeCopy('spojeni', { kind: 'playing', done: 0, total: 4 }, true).message).toMatch(/started/);
  });

  it('points to the stats once the puzzle is finished', () => {
    expect(welcomeCopy('slovo', { kind: 'won' }, true)).toEqual({
      message: 'You’ve guessed this word. Great job!',
      action: 'stats',
    });
    expect(welcomeCopy('spojeni', { kind: 'lost' }, false).action).toBe('stats');
    expect(welcomeCopy('spojeni', { kind: 'won' }, false).message).not.toMatch(/today/);
  });
});
