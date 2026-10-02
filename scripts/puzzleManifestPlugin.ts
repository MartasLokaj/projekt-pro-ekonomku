import fs from 'node:fs';
import path from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';
import { parsePuzzle } from '../src/data/validatePuzzle.ts';
import { PUZZLE_MODES, type PuzzleMode, type PuzzleSummary } from '../src/types/puzzle.ts';

/**
 * Makes "add a puzzle" = "drop a JSON file into public/data/puzzles/<mode>/".
 *
 *   public/data/puzzles/easy/YYYY-MM-DD.json   ← Easy
 *   public/data/puzzles/hard/YYYY-MM-DD.json   ← Hard
 *
 *  • validates every puzzle (the build fails on a broken one)
 *  • checks that puzzle ids are unique across both modes
 *  • generates `data/puzzles/<mode>/index.json` — the list of puzzles per mode —
 *    served live by the dev server and emitted into `dist/` on build.
 */
const FILE_RE = /^(\d{4}-\d{2}-\d{2})\.json$/;
const MANIFEST_RE = /\/data\/puzzles\/(easy|hard)\/index\.json$/;

/** Manifest for one mode folder. */
export function buildManifest(dir: string): PuzzleSummary[] {
  if (!fs.existsSync(dir)) return [];
  const files = fs
    .readdirSync(dir)
    .filter((f) => FILE_RE.test(f))
    .sort();

  return files.map((file, index) => {
    const raw: unknown = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    const where = `${path.basename(dir)}/${file}`;
    const puzzle = parsePuzzle(raw, where);
    const dateFromName = file.match(FILE_RE)![1];
    if (puzzle.date !== dateFromName) {
      throw new Error(`${where}: "date" is ${puzzle.date} but the file name says ${dateFromName}`);
    }
    return { id: puzzle.id, date: puzzle.date, number: index + 1 };
  });
}

/** Manifests for all modes (throws on duplicate ids anywhere). */
export function buildAllManifests(root: string): Record<PuzzleMode, PuzzleSummary[]> {
  const out = {} as Record<PuzzleMode, PuzzleSummary[]>;
  const seen = new Map<string, string>();
  for (const mode of PUZZLE_MODES) {
    out[mode] = buildManifest(path.join(root, mode));
    for (const p of out[mode]) {
      const other = seen.get(p.id);
      if (other) throw new Error(`duplicate puzzle id "${p.id}" (${other} and ${mode}/${p.date}.json)`);
      seen.set(p.id, `${mode}/${p.date}.json`);
    }
  }
  return out;
}

export function puzzleManifestPlugin(options: { dir?: string } = {}): Plugin {
  let root = '';

  return {
    name: 'spojeni:puzzle-manifest',

    configResolved(config) {
      root = path.resolve(config.root, options.dir ?? 'public/data/puzzles');
    },

    configureServer(server: ViteDevServer) {
      const report = () => {
        try {
          buildAllManifests(root);
        } catch (err) {
          server.config.logger.error(`[puzzles] ${(err as Error).message}`);
        }
      };
      report();
      server.watcher.add(root);
      server.watcher.on('all', (_event, file) => {
        if (file.startsWith(root)) report();
      });

      server.middlewares.use((req, res, next) => {
        const match = (req.url ?? '').split('?')[0].match(MANIFEST_RE);
        if (!match) return next();
        try {
          const manifests = buildAllManifests(root);
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store');
          res.end(JSON.stringify(manifests[match[1] as PuzzleMode]));
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: (err as Error).message }));
        }
      });
    },

    generateBundle() {
      try {
        const manifests = buildAllManifests(root);
        for (const mode of PUZZLE_MODES) {
          this.emitFile({
            type: 'asset',
            fileName: `data/puzzles/${mode}/index.json`,
            source: `${JSON.stringify(manifests[mode], null, 2)}\n`,
          });
        }
      } catch (err) {
        this.error(`[puzzles] ${(err as Error).message}`);
      }
    },
  };
}
