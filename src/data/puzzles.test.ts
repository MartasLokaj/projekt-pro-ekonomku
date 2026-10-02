import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildAllManifests } from '../../scripts/puzzleManifestPlugin';
import { PUZZLE_MODES } from '../types/puzzle';
import { parsePuzzle, validatePuzzle } from './validatePuzzle';

const root = fileURLToPath(new URL('../../public/data/puzzles', import.meta.url));
const files = PUZZLE_MODES.flatMap((mode) =>
  (fs.existsSync(path.join(root, mode)) ? fs.readdirSync(path.join(root, mode)) : [])
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .map((f) => `${mode}/${f}`),
);

describe('sample puzzles', () => {
  it('ships at least one puzzle', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('%s is a valid puzzle', (file) => {
    const raw = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
    expect(validatePuzzle(raw)).toEqual([]);
    expect(parsePuzzle(raw).date).toBe(path.basename(file, '.json'));
  });

  it('builds numbered manifests with ids unique across modes', () => {
    const manifests = buildAllManifests(root);
    for (const mode of PUZZLE_MODES) {
      expect(manifests[mode].map((m) => m.number)).toEqual(manifests[mode].map((_, i) => i + 1));
    }
    const ids = PUZZLE_MODES.flatMap((m) => manifests[m].map((p) => p.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('validatePuzzle', () => {
  const good = {
    id: 'x',
    date: '2026-01-01',
    categories: (['yellow', 'green', 'blue', 'purple'] as const).map((d, i) => ({
      id: d,
      name: d,
      difficulty: d,
      words: [0, 1, 2, 3].map((j) => `w${i}${j}`),
    })),
  };

  it('accepts a well-formed puzzle', () => {
    expect(validatePuzzle(good)).toEqual([]);
  });

  it('rejects duplicate words (case-insensitive) and difficulties', () => {
    const bad = structuredClone(good);
    bad.categories[1].words[0] = 'W00';
    bad.categories[2].difficulty = 'green';
    const issues = validatePuzzle(bad);
    expect(issues.some((i) => i.includes('appears more than once'))).toBe(true);
    expect(issues.some((i) => i.includes('used more than once'))).toBe(true);
  });

  it('rejects wrong shapes', () => {
    expect(validatePuzzle({ ...good, date: '2026-02-30' })).not.toEqual([]);
    expect(validatePuzzle({ ...good, categories: good.categories.slice(0, 3) })).not.toEqual([]);
  });
});
