# Links · Circular Words (circular economy)

**Projekt pro ekonomku.** Anglická slovní hra pro výuku cirkulární ekonomiky: žáci hádají slova o 5 písmenech (ve stylu Wordle) a po každém slově si přečtou, co znamená a kde se v cirkulární ekonomice používá. Slova pocházejí z příruček projektu ET CASE.

Spuštění: `npm install`, potom `npm run dev` a otevřít http://localhost:5173/?hra=slovo

English daily word games about the **circular economy**, built with React, TypeScript and Vite. This is the English copy of the Czech app *Spojení* (folder `cesky-connections`): the whole UI is in English and every puzzle word is about the circular economy. The site runs as a static site today and is set up so a database can be added later. Switch games in the ☰ menu (top left).

- **Links** (in the style of NYT *Connections*): find the four groups of four words. Each group has a difficulty colour: 🟨 easiest, then 🟩, 🟦, and 🟪 hardest. You can make 4 mistakes.
- **Circular Words** (in the style of *Wordle*): guess the 5-letter circular-economy word in 6 tries, read what it means, then go on to the next word. 🟩 right letter in the right place, 🟨 right letter in the wrong place, ⬜ letter not in the word.

Inside the code the two games keep their original ids: `spojeni` (Links) and `slovo` (Circular Words). The game names are set in one place, `strings.games` in `src/i18n/en.ts`.

Saved games use their own localStorage prefix (`circular:v1:`), so they never mix with the Czech app on the same address.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (game rules, stats, puzzle validation)
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build locally
```

You need Node **20.19+ or 22.12+**. `dist/` is a plain static site, so any static host works (Netlify, Vercel, GitHub Pages, S3, nginx). Assets use relative paths, so a sub-folder works too.

Useful URLs:

- `/`: today's Links puzzle in the selected mode. If today has no puzzle, the app shows the most recent one.
- `/?date=2026-10-02`: a puzzle from the archive. Archive games don't count towards stats.
- `/?hra=slovo`: Circular Words, the first word you have not finished. Add `&word=3` for word 3.

---

## Adding a new daily puzzle

Links has **two modes**, and each has its own daily puzzle, archive and stats: **Easy** and **Hard**. Players switch between them in the toolbar, and the choice is remembered. (Circular Words has no modes, see below.) If a mode has no puzzle yet, the app says so ("There is no puzzle for this day yet.").

**Add one JSON file per mode and day.** Nothing else needs to change.

```
public/data/puzzles/easy/2026-10-03.json   ← Easy
public/data/puzzles/hard/2026-10-03.json   ← Hard
```

```json
{
  "$schema": "../../puzzle.schema.json",
  "id": "hard-2026-10-03",
  "date": "2026-10-03",
  "categories": [
    { "id": "r-strategies", "name": "R strategies", "difficulty": "yellow", "words": ["Reduce", "Reuse", "Repair", "Recycle"] },
    { "id": "…",      "name": "…",             "difficulty": "green",  "words": ["…", "…", "…", "…"] },
    { "id": "…",      "name": "…",             "difficulty": "blue",   "words": ["…", "…", "…", "…"] },
    { "id": "…",      "name": "…",             "difficulty": "purple", "words": ["…", "…", "…", "…"] }
  ]
}
```

Rules. The build checks all of them and **fails if a puzzle is invalid**. `npm test` checks them too.

- The file name must be `YYYY-MM-DD.json` and must match `"date"`.
- The puzzle needs exactly 4 categories, one for each difficulty (`yellow`, `green`, `blue`, `purple`).
- Each category needs exactly 4 words. All 16 words must be unique (ignoring case).
- `id` must be unique across all puzzles.
- Write words in normal case. The UI converts them to upper case, so "Reuse" becomes "REUSE".
- Long words are fine. On narrow phones the tile text shrinks, and very long words get hyphenated at a syllable-like boundary (for example REMANU-/FACTURE).

`$schema` gives you autocomplete and inline validation in VS Code.

The puzzle list for each mode (`data/puzzles/<mode>/index.json`) is **generated automatically** by the Vite plugin in `scripts/puzzleManifestPlugin.ts`. The dev server serves it live, and the build writes it into `dist/`. Puzzle numbers ("Puzzle #6") come from the date order within each mode. Puzzle ids must be unique across both modes, and the build checks this.

> Static hosting cannot hide future puzzles: anyone can fetch `…/2026-12-24.json`. The app never *lists* future dates, but real secrecy needs the backend described below.

---

## Welcome screen

Opening a game (loading the page, or picking a game in the ☰ menu) first shows a full-screen welcome card, like the NYT games. It has:

- the game's mark, its title and a one-line pitch;
- two large buttons: **Sign in** (a placeholder, like the header button) and the main button;
- the puzzle's date and number, and for Links the difficulty.

The card changes with the player's progress on the puzzle:

| Progress | Text | Main button |
|---|---|---|
| Not started | the pitch ("Group words that have something in common.") | **Play** |
| In progress | "You’ve found 2 of 4 groups." / "You’ve used 3 of 6 tries." | **Continue** |
| Won or lost | "You’ve solved today’s puzzle. Great job!" … | **Statistics**: closes the card and opens the stats |

- The game loads underneath while the card is up. The page behind it is `inert`, and Circular Words ignores the physical keyboard.
- The rules ("How to play") open automatically after the player's first **Play** in each game.
- **Code:** `src/components/Welcome/`.
  - `WelcomeScreen.tsx`: the card.
  - `progress.ts`: `spojeniProgress` / `slovoProgress` rebuild the progress from the saved guesses, and `welcomeCopy` picks the text and the button (tested in `progress.test.ts`).
  - Each stage reports what it loaded through `onLoaded` (`StageLoaded` in `types/games.ts`).
- **Text:** `strings.welcome` in `i18n/en.ts`.
- **Backgrounds:** `--welcome-spojeni` (lavender) and `--welcome-slovo` (grey) in `styles/global.css`, with dark variants.

---

## Circular Words (Wordle-style game)

All code lives in `src/slovo/`. It shares the page shell with Links: the header, the big title, and the toolbar (💡 hint, stats, help; the mode switch is hidden).

**Tasks instead of days**

- The game is a numbered list of tasks: Word 1, Word 2 … Word 118, all playable at any time. There is no daily schedule and no countdown.
- `/?hra=slovo` opens the **first word the player has not finished** (word 1 when everything is done). `/?hra=slovo&word=3` opens word 3.
- After every game, won or lost, the player sees **“What does it mean?”**. It shows the word, its part of speech, a simple English meaning, and how the word is used in the circular economy (from the ET CASE handbooks). Below it is a green **Next word** button. After the last word, the button reads **Back to word 1**.
- The explanation and the button appear in the result modal and also under the board after the modal is closed.
- The ☰ menu item **All words** lists every task with its status. A finished word shows its answer; the others show `? ? ? ? ?`.
- The hero and the welcome screen show “Word 3 of 118” instead of a date. A small counter above the board shows the same.
- Progress is saved per word under the id `slovo-<word>`, so reordering the list keeps it. Every finished word counts once in the stats. The streak counts wins in a row and does not depend on days. Stats are stored under `slovo:stats:<user>:words`.

**Rules**

- English letters A–Z only. Every answer is a circular-economy word, but any valid English word can be guessed.
- The Czech app's **turquoise** tile (right letter, different diacritic) is still in `logic.ts` (`accent`), but it can never appear with English words.
- The rules are the same as in the real Wordle: any valid word can be guessed, and letters you have already found don't have to be reused.
- Wordle's optional *hard mode* (greens stay in place, yellows must be reused) is implemented in `logic.ts` (`hardModeIssue`). It is switched off; `useSlovoGame` accepts `hardMode: true` if a setting for it is added later.
- The 💡 hint reveals up to 2 letters, each with its position.

**Animations** follow Wordle:

- a typed letter pops;
- a submitted row flips tile by tile (the colour changes while the tile is edge-on);
- an invalid word shakes the row;
- a win bounces the row and shows a toast (Genius! … Phew, that was close!);
- a loss shows the answer.

The keyboard colours change only after the flip has finished. Everything is CSS keyframes driven by phases in a pure reducer (`reducer.ts`), with timings in `timings.ts`. *Reduce motion* turns the animations off.

**Keyboard**

- On screen it is English QWERTY (three rows, like Wordle).
- Physical keyboards work too; keys with diacritics are ignored.

**Word lists** (`public/data/slovo/`):

| File | Content |
|---|---|
| `answers.json` | `{ "words": [{ "word", "type", "meaning", "circular" }] }`: the 118 answers in play order (word *N* = task *N*), each with its English explanation. Add new words at the end; reordering changes the task numbers, but not the saved progress. |
| `words.txt` | About 12,700 allowed English guesses, one per line, lower case. Every answer can be guessed even if it is missing here. |

- The answers come from the two ET CASE handbooks (Teacher Handbook and Expert Transfer Handbook). The order starts with the clearest circular-economy words and mixes topics: core ideas, nature, materials, food, fashion and EU rules. Plurals and less common words come last.
- `npm test` checks every answer: 5 letters a–z, unique, in the guess list, the first word is REUSE, and every word has a type, a meaning and a circular-economy note in English.
- The guess list is every 5-letter word from [word-list](https://github.com/sindresorhus/word-list) (MIT) plus [SCOWL](http://wordlist.aspell.net/) up to size 70 via [wordlist-english](https://www.npmjs.com/package/wordlist-english) (US, UK, Canadian and Australian spellings).

**Backend switch points**

- `slovo/repository.ts`: `SlovoRepository` (`listWords`, `getPuzzle(number)`, `isAllowed`). Swap `StaticSlovoRepository` for an API that serves the words and checks guesses.
- `slovo/stats.ts`: `SlovoStatsStore` and `SlovoProgressStore`.
- `services/results.ts`: `saveSlovoResult()`.

---

## Project structure

```
public/data/
  puzzle.schema.json          JSON Schema for editors
  puzzles/easy/YYYY-MM-DD.json   Easy – one puzzle per day  ← add puzzles here
  puzzles/hard/YYYY-MM-DD.json   Hard – one puzzle per day
  slovo/answers.json          Circular Words – the answers + explanations, in play order
  slovo/words.txt             Circular Words – allowed guesses
scripts/
  puzzleManifestPlugin.ts     validates puzzles + generates index.json per mode
src/
  types/                      Puzzle, Category, GameResult, User …
  data/                       DATA ACCESS: puzzleRepository.ts, validatePuzzle.ts
  game/                       GAME LOGIC (no React/DOM except the hook)
    gameLogic.ts              pure rules: evaluateGuess, moveToFront, initialBoard
    gameReducer.ts            state machine incl. animation phases, restoreState()
    selectors.ts              derived data (rows, result, emoji colours)
    useConnectionsGame.ts     the single hook the UI uses
    share.ts, timings.ts, random.ts
  services/                   PERSISTENCE & ACCOUNTS (extension points)
    auth.ts                   getCurrentUser() – stub
    results.ts                saveResult(userId, result) – stub
    statsStore.ts             StatsStore interface + localStorage impl
    progressStore.ts          ProgressStore interface + localStorage impl
  hooks/                      app wiring (player, puzzle loading, theme, URL: useRoute)
  components/                 Header, PuzzleHero, Toolbar, Grid, Tile, ResultRow,
                              MistakeDots, Controls, Toast, Modal, WinLoseModal,
                              ShareModal, HintModal, HowToPlayModal, Stats,
                              ArchiveModal, Game, SpojeniStage (Links),
                              Welcome (welcome screen + progress.ts)
  slovo/                      CIRCULAR WORDS: logic.ts, reducer.ts, useSlovoGame.ts,
                              repository.ts, stats.ts, share.ts, components/
  i18n/en.ts                  all UI text (copy it to add another language)
  styles/global.css           design tokens, light + dark theme
```

### How the game logic is separated from the UI

- `gameReducer` is a **pure** state machine. It has no timers, DOM or storage. Animations are explicit phases (`jumping → solving | shaking → revealing`). The `useConnectionsGame` hook advances those phases on a timer, and the components only render the current state.
- The **guess history** is the whole game. `restoreState(puzzle, guesses)` rebuilds any game instantly. That makes syncing progress to a server simple: store `string[][]` per user and puzzle.
- The same rules (`evaluateGuess`, `validatePuzzle`) can run on a server later, for example to check results or reject cheating.

---

## Plugging in a real backend

Each concern has **one** switch point. Game logic and components don't change.

| Concern | Today | Where to switch |
|---|---|---|
| Puzzles | static JSON via `StaticJsonPuzzleRepository` | `src/data/puzzleRepository.ts`: set `puzzleRepository = new ApiPuzzleRepository()` (already sketched: `GET /api/puzzle?date=…`, `GET /api/puzzles`) |
| User accounts | everyone is a guest | `src/services/auth.ts`: implement `getCurrentUser()` / `signIn()` with Supabase Auth, Firebase Auth, etc. The "Sign in" menu item is a placeholder. |
| Finished games | only stats in localStorage | `src/services/results.ts`: `saveResult(userId, result)` (called for signed-in users) |
| Stats & streaks | `LocalStorageStatsStore` | `src/services/statsStore.ts`: implement `StatsStore { get(); save() }` against your API and return it from `createStatsStore()`. `applyResult()` is pure, so you can reuse it on the server. |
| In-progress games | `LocalStorageProgressStore` | `src/services/progressStore.ts`: implement `ProgressStore { load(); save() }` |

Everything is already namespaced by `user.id` (`'guest'` for anonymous players), so signed-in users get their own data automatically.

**Suggested tables (Postgres / Supabase):**

```sql
create table puzzles (
  id text primary key,
  date date not null,
  mode text not null check (mode in ('easy', 'hard')),
  categories jsonb not null,           -- same shape as the JSON files
  author text,
  created_at timestamptz default now(),
  unique (date, mode)
);

create table game_progress (
  user_id uuid references auth.users,
  puzzle_id text references puzzles,
  guesses jsonb not null,              -- string[][]
  status text not null,                -- playing | won | lost
  updated_at timestamptz default now(),
  primary key (user_id, puzzle_id)
);

create table results (
  user_id uuid references auth.users,
  puzzle_id text references puzzles,
  won boolean, mistakes int, guess_colors jsonb, completed_at timestamptz,
  primary key (user_id, puzzle_id)     -- makes saveResult idempotent
);
```

### Admin / puzzle editor (future)

- `PuzzleAdminRepository` in `puzzleRepository.ts` defines `savePuzzle` / `deletePuzzle`.
- `validatePuzzle()` returns readable error messages that are ready to show in a form.
- Until an editor exists, the folder is the editor: one file per day, validated on build.

---

## Details worth knowing

- **Animations** use [Motion](https://motion.dev). Selected tiles do a staggered jump on submit. A correct group glides into the top row and merges into a coloured bar, and the grid reflows with layout animations. A wrong guess shakes, and "One away…" appears when you're one word away. A loss reveals the remaining groups one by one. A win bounces the rows and fires confetti. With *Reduce motion* turned on in the OS, animations are shortened automatically.
- **Layout**:
  - a sticky site bar, where the ☰ menu switches games;
  - a big title with the game's name and the puzzle's date;
  - a sticky toolbar with the mode switch and three icons: 💡 hint, stats, and how to play.

  On load the page scrolls straight to the board, and you can scroll up to see the title.
- **Hints**: the lightbulb reveals the theme of a missing group, one group at a time and easiest first.
- **Fonts** (bundled, no external requests): *Libre Franklin* is an open Franklin Gothic, the same family as the original's text and tiles. *Rokkitt* is a condensed slab close to the original's title face.
- **Theme**: follows the system setting, and the header toggle overrides it. Tokens are in `styles/global.css`.
- **Accessibility**: tiles are real buttons with `aria-pressed`. The toast is a live region. Modals trap focus and close with Esc.
- **Share text** example:

  ```
  Links
  Puzzle #5
  🟨🟨🟨🟪
  🟨🟨🟨🟨
  …
  ```
