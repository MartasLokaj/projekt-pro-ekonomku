import confetti from 'canvas-confetti';

/** Reads the current theme's category colours so confetti matches the board. */
function categoryColors(): string[] {
  const styles = getComputedStyle(document.documentElement);
  return ['--yellow', '--green', '--blue', '--purple']
    .map((v) => styles.getPropertyValue(v).trim())
    .filter(Boolean);
}

/** Two side cannons + a centre burst. No-op for reduced-motion users. */
export function celebrate(): void {
  const colors = categoryColors();
  const base = { colors, disableForReducedMotion: true, ticks: 220, scalar: 1.05, zIndex: 40 } as const;

  confetti({ ...base, particleCount: 70, angle: 60, spread: 60, origin: { x: 0, y: 0.75 }, startVelocity: 55 });
  confetti({ ...base, particleCount: 70, angle: 120, spread: 60, origin: { x: 1, y: 0.75 }, startVelocity: 55 });
  window.setTimeout(() => {
    confetti({ ...base, particleCount: 90, spread: 100, origin: { x: 0.5, y: 0.35 }, startVelocity: 38, gravity: 0.9 });
  }, 250);
}
