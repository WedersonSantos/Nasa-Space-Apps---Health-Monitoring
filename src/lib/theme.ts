import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const KEY = 'vigilia-theme';

function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* storage unavailable: follow the system */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);
  return [theme, setTheme] as const;
}

/** Chart colors read from CSS tokens (Recharts SVG needs concrete values). */
export interface ChartColors {
  text: string;
  muted: string;
  grid: string;
  surface: string;
  accent: string;
  secondary: string;
  tertiary: string;
  band: string;
  preflight: string;
  normal: string;
  attention: string;
  critical: string;
}

export function readChartColors(): ChartColors {
  const s = getComputedStyle(document.documentElement);
  const v = (name: string) => s.getPropertyValue(name).trim();
  return {
    text: v('--ink'),
    muted: v('--muted'),
    grid: v('--grid'),
    surface: v('--surface'),
    accent: v('--series-1'),
    secondary: v('--series-2'),
    tertiary: v('--series-3'),
    band: v('--band'),
    preflight: v('--preflight'),
    normal: v('--normal'),
    attention: v('--attention'),
    critical: v('--critical'),
  };
}

export const ChartColorsContext = createContext<ChartColors | null>(null);

export function useChartColors(): ChartColors {
  const c = useContext(ChartColorsContext);
  if (!c) throw new Error('ChartColorsContext missing');
  return c;
}

export function useOnline(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}
