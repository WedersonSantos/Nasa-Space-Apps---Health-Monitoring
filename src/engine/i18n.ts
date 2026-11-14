/**
 * Idioma do texto emitido pelo motor (en | pt). A lógica não depende do
 * idioma: só títulos, explicações, contas, rótulos e motivos mudam.
 */
import type { Locale } from '../types/contract';
import { dayToShort, fmt, pct, signed } from './util';

export type { Locale };
export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALES: readonly Locale[] = ['en', 'pt'];

/** Escolhe o texto do idioma. */
export const pick = <T>(locale: Locale, en: T, pt: T): T => (locale === 'pt' ? pt : en);

/** Formatadores já presos a um idioma, para uso dentro de templates. */
export function formatter(locale: Locale) {
  return {
    n: (x: number, decimals = 1) => fmt(x, decimals, locale),
    signed: (x: number, decimals = 1) => signed(x, decimals, locale),
    pct: (fraction: number, decimals = 0) => pct(fraction, decimals, locale),
    day: (day: number) => dayToShort(day, locale),
    t: <T>(en: T, pt: T) => pick(locale, en, pt),
  };
}
