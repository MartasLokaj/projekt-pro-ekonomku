import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 24, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const MenuIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);

export const HelpIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.3-2.4 3.8" />
    <path d="M12 17.2h.01" strokeWidth={2.6} />
  </Svg>
);

/** Podium-style bar chart (three joined bars). */
export const StatsIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={1.9}>
    <path d="M3.5 20.5V11h5.5V3.5h6V14h5.5v6.5z" />
    <path d="M9 11v9.5M15 14v6.5" />
  </Svg>
);

export const BulbIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={1.9}>
    <path d="M12 2.8a6.2 6.2 0 0 0-3.6 11.25c.7.5 1.1 1.25 1.1 2.1v1.35h5v-1.35c0-.85.4-1.6 1.1-2.1A6.2 6.2 0 0 0 12 2.8Z" />
    <path d="M9.8 20.6h4.4" />
  </Svg>
);

/** Easy — "light as a feather". */
export const FeatherIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={1.9}>
    <path d="M20.5 3.5c-7.6 0-13 4.3-13.9 11.7L6.5 18h3c7-.7 11-6.4 11-14.5Z" />
    <path d="M3 21 13.8 10.2" />
    <path d="M9.4 14.6h5.2" />
  </Svg>
);

/** Hard — hot / spicy. */
export const FlameIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={1.9}>
    <path d="M12 21.5c-3.9 0-6.8-2.7-6.8-6.4 0-2.7 1.5-4.6 3.1-6.4.3 1.8 1.2 3 2.4 3.5.1-3.5 1.6-6.4 4.3-8.7.3 3 1.8 4.9 3.1 6.6 1 1.3 1.7 3 1.7 4.9 0 3.7-3 6.5-7.8 6.5Z" />
    <path d="M12 21.5c-1.7 0-2.9-1.2-2.9-2.8 0-1.5 1-2.6 2.2-3.6.2 1 .7 1.6 1.4 1.8.2-1.3.8-2.3 1.8-3 .5 1.4 1.4 2.4 1.4 3.9 0 2.2-1.7 3.7-3.9 3.7Z" />
  </Svg>
);

export const SunIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
  </Svg>
);

export const MoonIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
  </Svg>
);

export const CloseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const ArchiveIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15" rx="2" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Svg>
);

export const SettingsIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
  </Svg>
);

export const UserIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </Svg>
);

export const CheckIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
);

export const CopyIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
    <path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" />
  </Svg>
);

export const ChevronRightIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m9.5 6 6 6-6 6" />
  </Svg>
);

/** Brand mark: four rounded squares in the category colours. */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect x="2" y="2" width="13" height="13" rx="3.5" fill="var(--yellow)" />
      <rect x="17" y="2" width="13" height="13" rx="3.5" fill="var(--green)" />
      <rect x="2" y="17" width="13" height="13" rx="3.5" fill="var(--blue)" />
      <rect x="17" y="17" width="13" height="13" rx="3.5" fill="var(--purple)" />
    </svg>
  );
}

export const BackspaceIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={1.9}>
    <path d="M8.5 5.5H20a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H8.5L2.5 12z" />
    <path d="m11.5 9.5 5 5M16.5 9.5l-5 5" />
  </Svg>
);

/** Brand mark for Circular Words: four letter tiles in the Wordle colours. */
export function SlovoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect x="2" y="2" width="13" height="13" rx="2" fill="var(--sl-absent)" />
      <rect x="17" y="2" width="13" height="13" rx="2" fill="var(--sl-present)" />
      <rect x="2" y="17" width="13" height="13" rx="2" fill="var(--sl-correct)" />
      <rect x="17" y="17" width="13" height="13" rx="2" fill="var(--sl-correct)" />
    </svg>
  );
}
