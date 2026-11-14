import type { DataOrigin, Severity } from '../types/contract';

interface IconProps {
  size?: number;
  className?: string;
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
});

export function CheckCircle({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="9.5" />
      <path d="m7.5 12.5 3 3 6-6.5" />
    </svg>
  );
}

export function Triangle({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 3.5 2.5 20h19L12 3.5Z" />
      <path d="M12 10v4.5M12 17.2v.1" />
    </svg>
  );
}

export function Octagon({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M8 2.5h8L21.5 8v8L16 21.5H8L2.5 16V8Z" />
      <path d="M12 7.5v6M12 16.6v.1" />
    </svg>
  );
}

export function SeverityIcon({ severity, size }: { severity: Severity; size?: number }) {
  if (severity === 'critical') return <Octagon size={size} />;
  if (severity === 'attention') return <Triangle size={size} />;
  return <CheckCircle size={size} />;
}

export function Beaker({ size = 14 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3" />
      <path d="M7.5 15h9" />
    </svg>
  );
}

export function Gauge({ size = 14 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 18a8 8 0 1 1 16 0" />
      <path d="m12 18 4-5" />
    </svg>
  );
}

export function Approx({ size = 14 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M5 9c2-2 4-2 7 0s5 2 7 0M5 15c2-2 4-2 7 0s5 2 7 0" />
    </svg>
  );
}

export function OriginIcon({ origin, size }: { origin: DataOrigin; size?: number }) {
  if (origin === 'synthetic') return <Beaker size={size} />;
  if (origin === 'estimated') return <Approx size={size} />;
  return <Gauge size={size} />;
}

export function Phone({ size = 18 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
    </svg>
  );
}

export function Satellite({ size = 16 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="m13 7 4 4-6 6-4-4z" />
      <path d="m16 4 4 4-2 2-4-4zM6 14l-2 2 4 4 2-2" />
      <path d="M19 15a5 5 0 0 1-4 4" />
    </svg>
  );
}

export function Sun({ size = 16 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

export function Moon({ size = 16 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
    </svg>
  );
}

export function ChevronLeft({ size = 16 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="m14.5 6-6 6 6 6" />
    </svg>
  );
}

export function ChevronRight({ size = 16, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="m9.5 6 6 6-6 6" />
    </svg>
  );
}

export function Play({ size = 16 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M7 5v14l12-7Z" />
    </svg>
  );
}

export function Pause({ size = 16 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M8 5v14M16 5v14" />
    </svg>
  );
}

export function Crosshair({ size = 16 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="7" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
    </svg>
  );
}

export function Link({ size = 13 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  );
}
