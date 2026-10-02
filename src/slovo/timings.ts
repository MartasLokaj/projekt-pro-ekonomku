/**
 * Animation timings (ms), shared by the hook (phase changes) and the
 * components (CSS animation durations and delays).
 */
export interface SlovoTimings {
  /** One tile flip: turns to its edge, changes colour, turns back. */
  flip: number;
  /** Delay between tiles in the reveal wave. */
  flipStagger: number;
  /** One tile jump in the winning row. */
  bounce: number;
  bounceStagger: number;
  /** Row shake for a rejected word. */
  shake: number;
  /** Letter "pop" when typed. */
  pop: number;
}

export const SLOVO_TIMINGS: SlovoTimings = {
  flip: 500,
  flipStagger: 300,
  bounce: 1000,
  bounceStagger: 100,
  shake: 600,
  pop: 100,
};

export const SLOVO_REDUCED_TIMINGS: SlovoTimings = {
  flip: 0,
  flipStagger: 0,
  bounce: 0,
  bounceStagger: 0,
  shake: 0,
  pop: 0,
};

export const revealTotal = (t: SlovoTimings, tiles = 5) => t.flip + (tiles - 1) * t.flipStagger;
export const bounceTotal = (t: SlovoTimings, tiles = 5) => t.bounce + (tiles - 1) * t.bounceStagger;
