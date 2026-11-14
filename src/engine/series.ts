/**
 * Agregação diária. Regras trabalham sobre um valor por variável por dia (UTC):
 * média das leituras do dia; para exerciseLoad, soma (minutos completados e
 * prescritos).
 */
import { VARIABLE_IDS, type Measurement, type VariableId } from '../types/contract';
import { dayNumber, dayToDate } from './util';

export interface DailyPoint {
  day: number;
  date: string; // YYYY-MM-DD
  value: number;
  secondaryValue?: number;
  count: number;
}

export type DailySeries = Record<VariableId, Map<number, DailyPoint>>;

/** Constrói as séries diárias. Espera medições JÁ validadas. */
export function buildDailySeries(valid: readonly Measurement[]): DailySeries {
  const acc = {} as Record<VariableId, Map<number, { v: number[]; s: number[] }>>;
  for (const id of VARIABLE_IDS) acc[id] = new Map();

  for (const m of valid) {
    const day = dayNumber(m.timestamp);
    const bucket = acc[m.variable].get(day) ?? { v: [], s: [] };
    bucket.v.push(m.value);
    if (m.secondaryValue !== undefined) bucket.s.push(m.secondaryValue);
    acc[m.variable].set(day, bucket);
  }

  const series = {} as DailySeries;
  series.selfReport = buildSelfReportSeries(valid);
  for (const id of VARIABLE_IDS) {
    if (id === 'selfReport') continue;
    const out = new Map<number, DailyPoint>();
    const days = [...acc[id].keys()].sort((a, b) => a - b);
    for (const day of days) {
      const { v, s } = acc[id].get(day)!;
      const agg = id === 'exerciseLoad' ? sum : avg;
      out.set(day, {
        day,
        date: dayToDate(day),
        value: agg(v),
        secondaryValue: s.length ? agg(s) : undefined,
        count: v.length,
      });
    }
    series[id] = out;
  }
  return series;
}

/** Componente do autorrelato a partir do método ('self-report:mood' etc.). */
export type SelfReportComponent = 'mood' | 'stress' | 'fatigue' | 'index';

export function selfReportComponent(method: string): SelfReportComponent {
  const c = method.split(':')[1];
  return c === 'mood' || c === 'stress' || c === 'fatigue' ? c : 'index';
}

/**
 * Índice diário de bem-estar (1–5, maior = melhor) a partir dos componentes:
 * (humor + (6 − estresse) + (6 − fadiga)) / 3. Componentes ausentes saem da
 * média; um registro 'self-report' sem componente é tratado como o índice.
 */
export function wellbeingIndex(c: { mood?: number; stress?: number; fatigue?: number }): number | null {
  const parts: number[] = [];
  if (c.mood !== undefined) parts.push(c.mood);
  if (c.stress !== undefined) parts.push(6 - c.stress);
  if (c.fatigue !== undefined) parts.push(6 - c.fatigue);
  return parts.length ? avg(parts) : null;
}

function buildSelfReportSeries(valid: readonly Measurement[]): Map<number, DailyPoint> {
  const byDay = new Map<number, Record<SelfReportComponent, number[]>>();
  for (const m of valid) {
    if (m.variable !== 'selfReport') continue;
    const day = dayNumber(m.timestamp);
    const b = byDay.get(day) ?? { mood: [], stress: [], fatigue: [], index: [] };
    b[selfReportComponent(m.method)].push(m.value);
    byDay.set(day, b);
  }
  const out = new Map<number, DailyPoint>();
  for (const day of [...byDay.keys()].sort((a, b) => a - b)) {
    const b = byDay.get(day)!;
    const fromComponents = wellbeingIndex({
      mood: b.mood.length ? avg(b.mood) : undefined,
      stress: b.stress.length ? avg(b.stress) : undefined,
      fatigue: b.fatigue.length ? avg(b.fatigue) : undefined,
    });
    const values = [...b.index, ...(fromComponents === null ? [] : [fromComponents])];
    if (!values.length) continue;
    out.set(day, {
      day,
      date: dayToDate(day),
      value: avg(values),
      count: b.mood.length + b.stress.length + b.fatigue.length + b.index.length,
    });
  }
  return out;
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const avg = (xs: number[]) => sum(xs) / xs.length;

/** Pontos existentes nos `days` dias que terminam em `endDay` (inclusive). */
export function pointsInWindow(s: Map<number, DailyPoint>, endDay: number, days: number): DailyPoint[] {
  const out: DailyPoint[] = [];
  for (let d = endDay - days + 1; d <= endDay; d++) {
    const p = s.get(d);
    if (p) out.push(p);
  }
  return out;
}

/** Os `days` pontos consecutivos terminando em `endDay`, ou null se faltar algum dia. */
export function consecutivePoints(s: Map<number, DailyPoint>, endDay: number, days: number): DailyPoint[] | null {
  const pts = pointsInWindow(s, endDay, days);
  return pts.length === days ? pts : null;
}

/** Quantos dias consecutivos, recuando de `endDay`, satisfazem `pred`. */
export function streakLength(
  s: Map<number, DailyPoint>,
  endDay: number,
  pred: (p: DailyPoint) => boolean,
  max = 400,
): number {
  let n = 0;
  for (let d = endDay; n < max; d--) {
    const p = s.get(d);
    if (!p || !pred(p)) break;
    n++;
  }
  return n;
}

/**
 * Série diária pronta para gráfico (helper para o Bloco B): um ponto por dia
 * até `asOf`, já validada e agregada.
 */
export function chartSeries(valid: readonly Measurement[], variable: VariableId): DailyPoint[] {
  return [...buildDailySeries(valid)[variable].values()];
}
