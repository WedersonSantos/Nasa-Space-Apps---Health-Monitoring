/**
 * Baseline individual, nunca faixa populacional (spec §5).
 * - pré-voo: média e DP dos primeiros 7 dias de registro, congelados;
 * - móvel: média e DP dos últimos 7 dias até a data de avaliação.
 * Para pressão arterial, o baseline é da sistólica (`value`).
 */
import { VARIABLE_IDS, type Baseline, type VariableId } from '../types/contract';
import { BASELINE } from './config/thresholds';
import type { DailySeries } from './series';
import { pointsInWindow } from './series';
import { dayToIso, mean, stdDev } from './util';

export function computeBaseline(
  series: DailySeries,
  variable: VariableId,
  startDay: number,
  endDay: number,
  kind: Baseline['kind'],
): Baseline | null {
  if (endDay < startDay) return null;
  const pts = pointsInWindow(series[variable], endDay, endDay - startDay + 1);
  if (pts.length < BASELINE.minDays) return null;
  const values = pts.map((p) => p.value);
  return {
    variable,
    mean: mean(values),
    stdDev: stdDev(values),
    windowStart: dayToIso(startDay),
    windowEnd: dayToIso(endDay),
    kind,
  };
}

/** Baselines pré-voo: janela [firstDay, firstDay + 6], limitada a `asOfDay`. */
export function preflightBaselines(
  series: DailySeries,
  firstDay: number,
  asOfDay: number,
): Partial<Record<VariableId, Baseline>> {
  const end = Math.min(firstDay + BASELINE.preflightDays - 1, asOfDay);
  const out: Partial<Record<VariableId, Baseline>> = {};
  for (const v of VARIABLE_IDS) {
    const b = computeBaseline(series, v, firstDay, end, 'preflight');
    if (b) out[v] = b;
  }
  return out;
}

/** Baselines móveis: últimos 7 dias até `asOfDay`. */
export function rollingBaselines(series: DailySeries, asOfDay: number): Partial<Record<VariableId, Baseline>> {
  const out: Partial<Record<VariableId, Baseline>> = {};
  for (const v of VARIABLE_IDS) {
    const b = computeBaseline(series, v, asOfDay - BASELINE.rollingDays + 1, asOfDay, 'rolling');
    if (b) out[v] = b;
  }
  return out;
}
