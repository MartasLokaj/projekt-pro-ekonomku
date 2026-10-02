import { describe, expect, it } from 'vitest';
import { breakCandidates } from './fitText';

const split = (w: string, i: number) => `${w.slice(0, i)}|${w.slice(i)}`;
const splits = (w: string) => breakCandidates(w).map((i) => split(w, i));

describe('tile hyphenation', () => {
  it.each([
    ['RECYCLE', 'RE|CYCLE'],
    ['RECLAIM', 'RE|CLAIM'],
    ['CARBON', 'CAR|BON'],
    ['REMANUFACTURE', 'REMANU|FACTURE'],
  ])('%s can break as %s', (word, expected) => {
    expect(splits(word)).toContain(expected);
  });

  it('never splits digraphs like CH, SH or TH', () => {
    expect(splits('PURCHASE')).not.toContain('PURC|HASE');
    expect(splits('WASHING')).not.toContain('WAS|HING');
    expect(splits('ANOTHER')).not.toContain('ANOT|HER');
  });

  it('keeps at least two letters on each line', () => {
    for (const i of breakCandidates('REUSE')) {
      expect(i).toBeGreaterThanOrEqual(2);
      expect('REUSE'.length - i).toBeGreaterThanOrEqual(2);
    }
  });
});
