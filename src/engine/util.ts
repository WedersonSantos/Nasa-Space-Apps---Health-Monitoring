/** Utilitários puros: datas (UTC, em número de dia) e formatação pt-BR. */

export const DAY_MS = 86_400_000;

/** Número do dia UTC (dias desde 1970-01-01) de um instante ISO 8601. */
export function dayNumber(iso: string): number {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) throw new Error(`Data inválida: ${iso}`);
  return Math.floor(ms / DAY_MS);
}

/** 'YYYY-MM-DD' do número de dia. */
export function dayToDate(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

/** ISO 8601 do início (00:00Z) do dia. */
export function dayToIso(day: number): string {
  return new Date(day * DAY_MS).toISOString();
}

/** 'dd/mm' para texto de interface. */
export function dayToShort(day: number): string {
  const d = dayToDate(day);
  return `${d.slice(8, 10)}/${d.slice(5, 7)}`;
}

export function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** Desvio padrão amostral (n − 1); 0 para n < 2. */
export function stdDev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1));
}

export function round(n: number, decimals = 1): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

/** Número em pt-BR com sinal de menos tipográfico: fmt(-2.14, 1) → '−2,1'. */
export function fmt(n: number, decimals = 1): string {
  const r = round(n, decimals);
  const s = (Object.is(r, -0) ? 0 : r).toFixed(decimals).replace('.', ',');
  return s.replace('-', '−');
}

/** Com sinal explícito: signed(1.5) → '+1,5'. */
export function signed(n: number, decimals = 1): string {
  return (round(n, decimals) > 0 ? '+' : '') + fmt(n, decimals);
}

/** Fração → porcentagem: pct(0.613) → '61%'. */
export function pct(fraction: number, decimals = 0): string {
  return `${fmt(fraction * 100, decimals)}%`;
}
