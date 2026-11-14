// Number and date formatting that follows the interface language (set by the i18n provider).
import type { Lang } from '../i18n';

let currentLang: Lang = 'en';
const LOCALE: Record<Lang, string> = { en: 'en-US', pt: 'pt-BR' };

/** Called by the language provider whenever the language changes. */
export function setFormatLang(lang: Lang) {
  currentLang = lang;
}

const cache = new Map<string, Intl.NumberFormat>();

function nf(decimals: number) {
  const key = `${currentLang}:${decimals}`;
  let f = cache.get(key);
  if (!f) {
    f = new Intl.NumberFormat(LOCALE[currentLang], { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    cache.set(key, f);
  }
  return f;
}

export function fmt(value: number, decimals = 1): string {
  return nf(decimals).format(value);
}

/** 0.238 -> "23.8%" (en) / "23,8%" (pt); signed: -0.021 -> "−2.1%" */
export function fmtPct(ratio: number, signed = false): string {
  const pct = ratio * 100;
  const body = nf(Math.abs(pct) >= 10 ? 0 : 1).format(Math.abs(pct)) + '%';
  if (!signed) return (pct < 0 ? '−' : '') + body;
  return (pct < 0 ? '−' : pct > 0 ? '+' : '') + body;
}

export function fmtSigned(value: number, decimals = 1): string {
  const s = nf(decimals).format(Math.abs(value));
  return (value < 0 ? '−' : value > 0 ? '+' : '±') + s;
}

/** "Oct 28" (en) / "28/10" (pt) */
export function fmtDate(iso: string): string {
  return currentLang === 'pt'
    ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })
    : new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

/** "Oct 28, 23:59 UTC" (en) / "28/10, 23:59 UTC" (pt) */
export function fmtDateTime(iso: string): string {
  const opts: Intl.DateTimeFormatOptions =
    currentLang === 'pt'
      ? { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC' }
      : { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC' };
  return new Date(iso).toLocaleString(LOCALE[currentLang], opts) + ' UTC';
}
