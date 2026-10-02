/**
 * Animation timings (ms). The hook uses them to advance game phases and the
 * components use the same numbers for their motion transitions, so logic and
 * visuals always stay in sync.
 */
export interface GameTimings {
  /** Delay between consecutive tiles in the submit "jump" wave. */
  jumpStagger: number;
  /** Duration of a single tile jump. */
  jumpDuration: number;
  /** Pause after the jump wave before the guess is judged. */
  jumpSettle: number;
  /** Tiles gliding to the top row. */
  move: number;
  /** Wrong-guess shake. */
  shake: number;
  /** Pause between revealed rows after a loss. */
  revealGap: number;
}

export const DEFAULT_TIMINGS: GameTimings = {
  jumpStagger: 90,
  jumpDuration: 300,
  jumpSettle: 120,
  move: 520,
  shake: 460,
  revealGap: 420,
};

/** Near-instant timings for users who prefer reduced motion. */
export const REDUCED_TIMINGS: GameTimings = {
  jumpStagger: 0,
  jumpDuration: 0,
  jumpSettle: 60,
  move: 120,
  shake: 250,
  revealGap: 250,
};

export const jumpTotal = (t: GameTimings) => t.jumpDuration + 3 * t.jumpStagger + t.jumpSettle;

export const ms = (n: number) => n / 1000;
