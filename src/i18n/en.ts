/**
 * All user-facing text lives here. To add another language, copy this file
 * (e.g. `cs.ts`), translate it, and point the imports at the new file.
 */

/** "without a single mistake", "with 1 mistake", "with 2 mistakes"… */
function withMistakes(n: number): string {
  if (n === 0) return 'without a single mistake';
  return n === 1 ? 'with 1 mistake' : `with ${n} mistakes`;
}

/** 1 → "1st", 2 → "2nd", 3 → "3rd", 4 → "4th"… */
function ordinal(n: number): string {
  const suffix = n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th';
  return `${n}${suffix}`;
}

export const strings = {
  appName: 'Links',
  tagline: 'A daily word puzzle',
  instructions: 'Create four groups of four!',
  puzzleNumber: (n: number) => `Puzzle #${n}`,
  board: 'Game board',

  // Controls
  shuffle: 'Shuffle',
  deselectAll: 'Deselect all',
  submit: 'Submit',
  viewResults: 'View results',
  share: 'Share',
  archiveBanner: 'From the archive',
  backToToday: 'Back to today',
  mistakesRemaining: 'Mistakes remaining:',
  mistakesAria: (n: number) => `Mistakes remaining: ${n} of 4`,

  // Feedback toasts
  oneAway: 'One away…',
  alreadyGuessed: 'Already guessed!',
  copied: 'Results copied to the clipboard',
  copyFailed: 'Copying failed',

  // End of game
  winHeadline: (mistakes: number) => ['Perfect!', 'Great!', 'Well done!', 'Phew, that was close!'][Math.min(mistakes, 3)],
  winMessage: (mistakes: number) => `You solved it ${withMistakes(mistakes)}.`,
  loseHeadline: 'Better luck next time!',
  loseMessage: 'You ran out of tries. Here is the solution.',
  shareTitle: 'Your results',
  copyResults: 'Copy results',
  copiedShort: 'Copied!',
  nextPuzzleIn: 'Next puzzle in',
  archiveNote: 'Archive games don’t count towards your stats.',
  close: 'Close',

  // Header & menu
  menu: 'Menu',
  howToPlay: 'How to play',
  stats: 'Statistics',
  archive: 'Archive',
  settings: 'Settings',
  signIn: 'Sign in',
  signInShort: 'Sign in',
  signInSoon: 'Signing in is coming soon',
  hint: 'Hint',
  hintIntro: 'Stuck? Reveal the theme of a group you haven’t found yet.',
  hintReveal: 'Reveal a theme',
  hintDone: 'All the groups are already on the board.',
  comingSoon: 'Coming soon',
  toggleTheme: 'Switch between light and dark mode',

  // Modes
  modeLabel: 'Difficulty',
  modeNames: { easy: 'Easy', hard: 'Hard' },
  modeTitles: { easy: 'Easy puzzle', hard: 'Hard puzzle' },
  modeSwitched: { easy: 'You’re playing the easy puzzle', hard: 'You’re playing the hard puzzle' },
  today: 'Today’s puzzle',

  // Stats
  statsPlayed: 'Played',
  statsWinPct: 'Win %',
  statsCurrentStreak: 'Current streak',
  statsMaxStreak: 'Max streak',
  statsDistribution: 'Wins by number of mistakes',
  statsMistakeLabel: (n: number) => (n === 0 ? 'No mistakes' : `${n} ${n === 1 ? 'mistake' : 'mistakes'}`),
  statsEmpty: 'No games played yet. Stats are based on the daily puzzles.',

  // Archive
  archiveIntro: 'Play earlier puzzles.',
  archiveSolved: 'Solved',
  archiveLost: 'Not solved',
  archiveInProgress: 'In progress',
  archiveEmpty: 'The archive is empty for now.',

  // Loading / errors
  loading: 'Loading the puzzle…',
  loadError: 'The puzzle could not be loaded.',
  retry: 'Try again',
  noPuzzle: 'There is no puzzle for this day yet.',
  fallbackNotice: (date: string) => `There is no puzzle for today yet, so you’re playing the latest one (${date}).`,

  // How to play
  howToPlayIntro: 'Find groups of four words that have something in common.',
  howToPlayRules: [
    'Select four words and press “Submit”.',
    'Each puzzle has exactly one solution. Watch out for words that seem to fit more than one group!',
    'You can make four mistakes. If three of your four words are right, the game tells you you’re “One away…”.',
  ],
  howToPlayExamplesTitle: 'Example groups',
  howToPlayExamples: [
    { name: 'Recyclable materials', words: 'Glass, Paper, Steel, Aluminium' },
    { name: '___ waste', words: 'Food, Zero, Plastic, Electronic' },
  ],
  howToPlayColors: 'Each group has a colour that shows its difficulty:',
  difficultyNames: {
    yellow: 'Easiest',
    green: 'Easy',
    blue: 'Harder',
    purple: 'Hardest',
  },
  howToPlayModesTitle: 'Two modes: switch in the bar at the top',
  howToPlayModes: {
    easy: 'More straightforward groups. Ideal for warming up or for beginners.',
    hard: 'Tricky groups, wordplay and words that pretend to belong somewhere else.',
  },
  howToPlayModesNote: 'Each mode has its own daily puzzle, archive and stats.',
  howToPlayFooter: 'Two new puzzles are waiting every day.',

  // ── Games (switched in the ☰ menu) ─────────────────────────────────────────
  gamesMenuTitle: 'Games',
  games: { spojeni: 'Links', slovo: 'Circular Words' },
  gameTaglines: { spojeni: 'Four groups of four', slovo: 'Guess the word in 6 tries' },

  // ── Welcome screen (shown when a game opens) ───────────────────────────────
  welcome: {
    subtitle: {
      spojeni: 'Group words that have something in common.',
      // Non-breaking spaces keep "5 letters" and "6 tries" on one line.
      slovo: 'Guess circular-economy words: 5\u00a0letters, 6\u00a0tries.',
    },
    playing: {
      spojeni: (done: number, total: number) =>
        done === 0
          ? 'You’ve started this puzzle. Keep going!'
          : `You’ve found ${done} of ${total} groups. Keep going!`,
      slovo: (done: number, total: number) => `You’ve used ${done} of ${total} tries. Keep going!`,
    },
    won: {
      spojeni: (isToday: boolean) =>
        isToday ? 'You’ve solved today’s puzzle. Great job!' : 'You’ve solved this puzzle. Great job!',
      slovo: () => 'You’ve guessed this word. Great job!',
    },
    lost: {
      spojeni: (isToday: boolean) =>
        isToday ? 'Not today. A new puzzle is waiting tomorrow.' : 'This puzzle didn’t work out this time.',
      slovo: () => 'This word didn’t work out this time. Try the next one!',
    },
    play: 'Play',
    continue: 'Continue',
    stats: 'Statistics',
    signIn: 'Sign in',
    mode: (label: string) => `Difficulty: ${label}`,
  },

  // ── Circular Words (Wordle-style) ──────────────────────────────────────────
  slovo: {
    wordNumber: (n: number) => `Word #${n}`,
    wordOf: (n: number, total: number) => `Word ${n} of ${total}`,
    board: 'Game board',
    keyboard: 'Keyboard',
    enter: 'Enter',
    backspace: 'Delete letter',
    rowLabel: (n: number) => `Guess ${n}`,
    tileLabel: (letter: string, state?: string) => (state ? `${letter}, ${state}` : letter),
    stateNames: {
      correct: 'in the right spot',
      present: 'in the word, wrong spot',
      accent: 'in the word with a different accent',
      absent: 'not in the word',
    },
    variantKey: 'this form is in the word',

    // Feedback toasts
    tooShort: 'Not enough letters',
    notInList: 'Not in the word list',
    hardPosition: (index: number, letter: string) => `${ordinal(index + 1)} letter must be ${letter}`,
    hardInclude: (letter: string) => `Your guess must contain ${letter}`,
    winToasts: ['Genius!', 'Amazing!', 'Impressive!', 'Great!', 'Nice work!', 'Phew, that was close!'],

    // End of game
    winMessage: (n: number) => (n === 1 ? 'You guessed the word on your first try.' : `You guessed the word in ${n} tries.`),
    loseHeadline: 'Better luck next time!',
    loseMessage: 'You ran out of tries this time.',
    answerWas: 'The word was',
    statsDistribution: 'Guess distribution',
    statsEmpty: 'No games played yet. Stats count every word you finish.',

    // After the game: explanation + next task
    explainTitle: 'What does it mean?',
    explainCircular: 'In the circular economy',
    nextWord: 'Next word',
    startAgain: 'Back to word 1',

    // All words (the list of tasks)
    allWords: 'All words',
    allWordsIntro: 'Pick any word. Words you have finished show their answer.',
    allWordsProgress: (done: number, total: number) => `${done} of ${total} finished`,
    /** Stands in for a word the player has not finished yet. */
    hiddenWord: '? ? ? ? ?',

    loading: 'Loading the word…',
    loadError: 'The word could not be loaded.',
    noWord: 'There is no word with this number.',

    // Hint (lightbulb)
    hintIntro: 'Stuck? Reveal one letter of the word, together with its position.',
    hintReveal: 'Reveal a letter',
    hintMax: 'That’s all the letters we’ll give away. You can do it!',
    hintNone: 'You already have all the letters in the right spots.',
    hintOver: 'The game is over.',
    hintLetter: (index: number, letter: string) => `The ${ordinal(index + 1)} letter is ${letter}`,

    // How to play
    helpIntro: 'Guess the hidden circular-economy word in 6 tries.',
    helpRules: [
      'Each guess must be a valid 5-letter English word. Press Enter to submit it.',
      'After each guess, the colours of the tiles show how close you were.',
      'When you finish, read what the word means, then press “Next word”.',
    ],
    helpExamplesTitle: 'Examples',
    helpExamples: [
      { word: 'waste', index: 0, state: 'correct', text: 'is in the word and in the right spot.' },
      { word: 'green', index: 1, state: 'present', text: 'is in the word but in the wrong spot.' },
      { word: 'solar', index: 2, state: 'absent', text: 'is not in the word in any spot.' },
    ],
    helpNote: 'Every answer is a word from the circular economy, but you can guess any English word.',
    helpFooter: 'The words come from the ET CASE handbooks. You can find all of them in the menu under “All words”.',
  },
} as const;
