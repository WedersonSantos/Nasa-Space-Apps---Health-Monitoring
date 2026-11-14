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
    const since = daysSinceLast === null ? '' : daysSinceLast === 0 ? 'último registro hoje' : `último registro há ${plural(daysSinceLast, 'dia', 'dias')}`;

    if (last === null) {
      out[variable] = { ...base, status: 'no-data', reason: 'Nenhum registro válido até a data de avaliação' };
      continue;
    }

    if (asOfDay < launchDay) {
      const day = asOfDay - firstDay + 1;
      out[variable] = {
        ...base,
        status: 'no-baseline',
        reason: `Linha de base pré-voo em formação (dia ${day} de ${BASELINE.preflightDays}); as regras começam no 1º dia de voo`,
      };
      continue;
    }

    if (req.needsBaseline && !preflight[variable]) {
      const preDays = pointsInWindow(series[variable], firstDay + BASELINE.preflightDays - 1, BASELINE.preflightDays).length;
      out[variable] = {
        ...base,
        status: 'no-baseline',
        reason: `Sem linha de base pré-voo: ${preDays} de ${BASELINE.preflightDays} dias registrados (mínimo ${BASELINE.minDays})`,
      };
      continue;
    }

    const stale = staleReason(variable, series, asOfDay, validDays, since);
    out[variable] = stale
      ? { ...base, status: 'stale', reason: stale }
      : { ...base, status: 'ok', reason: `Avaliado: ${validDays} de ${req.windowDays} dias com registro na janela da regra` };
  }
  return out;
}

/** Motivo de dados insuficientes na janela da regra, ou null se a regra pôde avaliar. */
function staleReason(variable: VariableId, series: DailySeries, asOfDay: number, validDays: number, since: string): string | null {
  const req = COVERAGE[variable];
  const consecutive = req.minValidDays === req.windowDays && req.windowDays > 1;

  if (validDays < req.minValidDays) {
    if (variable === 'exerciseLoad')
      return `Sem registro de exercício nos últimos ${req.windowDays} dias (${since}); aderência não calculada`;
    if (req.minValidDays === 1) return `Sem registro nos últimos ${req.windowDays} dias (${since})`;
    if (consecutive)
      return `${validDays} de ${req.windowDays} dias registrados; a regra exige ${req.windowDays} dias consecutivos até a data de avaliação (${since})`;
    return `${validDays} de ${req.windowDays} dias registrados na janela (mínimo ${req.minValidDays}; ${since})`;
  }

  if (variable === 'selfReport') {
    const cfg = RULES.selfReport;
    const prev = pointsInWindow(series.selfReport, asOfDay - cfg.windowDays, cfg.windowDays).length;
    if (prev < cfg.minDays)
      return `Janela anterior de ${cfg.windowDays} dias com ${prev} dias registrados (mínimo ${cfg.minDays}); tendência não calculada`;
  }
  return null;
}
