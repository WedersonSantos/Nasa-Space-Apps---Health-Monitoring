/**
 * Cobertura de dados por variável: ausência de alerta ≠ normal. Uma variável
 * só tem status 'ok' quando a regra dela teve dados (e baseline, se precisar)
 * para avaliar na data de avaliação. Pura, como o resto do motor.
 *
 * Prioridade: 'no-data' > 'no-baseline' > 'stale' > 'ok'.
 */
import { VARIABLE_IDS, type Baseline, type Measurement, type VariableCoverage, type VariableId } from '../types/contract';
import { BASELINE, COVERAGE, RULES } from './config/thresholds';
import { pointsInWindow, type DailySeries } from './series';
import { dayNumber } from './util';

export interface CoverageInput {
  series: DailySeries;
  preflight: Partial<Record<VariableId, Baseline>>;
  /** Medições válidas até asOf, ordenadas por horário. */
  valid: readonly Measurement[];
  asOfDay: number;
  firstDay: number;
  launchDay: number;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const days = (n: number) => plural(n, 'day', 'days');

export function computeCoverage(input: CoverageInput): Record<VariableId, VariableCoverage> {
  const { series, preflight, valid, asOfDay, firstDay, launchDay } = input;
  const lastAt = {} as Record<VariableId, string | null>;
  for (const v of VARIABLE_IDS) lastAt[v] = null;
  for (const m of valid) lastAt[m.variable] = m.timestamp;

  const out = {} as Record<VariableId, VariableCoverage>;
  for (const variable of VARIABLE_IDS) {
    const req = COVERAGE[variable];
    const last = lastAt[variable];
    const daysSinceLast = last === null ? null : asOfDay - dayNumber(last);
    const pts = pointsInWindow(series[variable], asOfDay, req.windowDays);
    // Exercício: só conta dia com minutos prescritos (sem prescrição não há aderência).
    const validDays = variable === 'exerciseLoad' ? pts.filter((p) => (p.secondaryValue ?? 0) > 0).length : pts.length;
    const base = { variable, lastAt: last, daysSinceLast, validDays };
    const since = daysSinceLast === null ? '' : daysSinceLast === 0 ? 'last record today' : `last record ${days(daysSinceLast)} ago`;

    if (last === null) {
      out[variable] = { ...base, status: 'no-data', reason: 'No valid record up to the evaluation date' };
      continue;
    }

    if (asOfDay < launchDay) {
      const day = asOfDay - firstDay + 1;
      out[variable] = {
        ...base,
        status: 'no-baseline',
        reason: `Preflight baseline still forming (day ${day} of ${BASELINE.preflightDays}); rules start on flight day 1`,
      };
      continue;
    }

    if (req.needsBaseline && !preflight[variable]) {
      const preDays = pointsInWindow(series[variable], firstDay + BASELINE.preflightDays - 1, BASELINE.preflightDays).length;
      out[variable] = {
        ...base,
        status: 'no-baseline',
        reason: `No preflight baseline: ${preDays} of ${BASELINE.preflightDays} days recorded (minimum ${BASELINE.minDays})`,
      };
      continue;
    }

    const stale = staleReason(variable, series, asOfDay, validDays, since);
    out[variable] = stale
      ? { ...base, status: 'stale', reason: stale }
      : { ...base, status: 'ok', reason: `Evaluated: ${validDays} of ${req.windowDays} days recorded in the rule window` };
  }
  return out;
}

/** Motivo de dados insuficientes na janela da regra, ou null se a regra pôde avaliar. */
function staleReason(variable: VariableId, series: DailySeries, asOfDay: number, validDays: number, since: string): string | null {
  const req = COVERAGE[variable];
  const consecutive = req.minValidDays === req.windowDays && req.windowDays > 1;

  if (validDays < req.minValidDays) {
    if (variable === 'exerciseLoad')
      return `No exercise record in the last ${days(req.windowDays)} (${since}); adherence not computed`;
    if (req.minValidDays === 1) return `No record in the last ${days(req.windowDays)} (${since})`;
    if (consecutive)
      return `${validDays} of ${req.windowDays} days recorded; the rule needs ${req.windowDays} consecutive days up to the evaluation date (${since})`;
    return `${validDays} of ${req.windowDays} days recorded in the window (minimum ${req.minValidDays}; ${since})`;
  }

  if (variable === 'selfReport') {
    const cfg = RULES.selfReport;
    const prev = pointsInWindow(series.selfReport, asOfDay - cfg.windowDays, cfg.windowDays).length;
    if (prev < cfg.minDays)
      return `Previous ${cfg.windowDays}-day window has ${days(prev)} recorded (minimum ${cfg.minDays}); trend not computed`;
  }
  return null;
}
