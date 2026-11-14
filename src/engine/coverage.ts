/**
 * Cobertura de dados por variável: ausência de alerta ≠ normal. Uma variável
 * só tem status 'ok' quando a regra dela teve dados (e baseline, se precisar)
 * para avaliar na data de avaliação. Pura, como o resto do motor.
 *
 * Prioridade: 'no-data' > 'no-baseline' > 'stale' > 'ok'.
 * O status não depende do idioma; só `reason` muda (en | pt).
 */
import { VARIABLE_IDS, type Baseline, type Locale, type Measurement, type VariableCoverage, type VariableId } from '../types/contract';
import { BASELINE, COVERAGE, RULES } from './config/thresholds';
import { pick } from './i18n';
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
  /** Idioma de `reason`. Padrão 'en'. */
  locale?: Locale;
}

/** Textos dos motivos, por idioma. */
function texts(locale: Locale) {
  const t = <T,>(en: T, pt: T) => pick(locale, en, pt);
  const days = (n: number) => `${n} ${n === 1 ? t('day', 'dia') : t('days', 'dias')}`;
  return {
    since: (d: number) => (d === 0 ? t('last record today', 'último registro hoje') : t(`last record ${days(d)} ago`, `último registro há ${days(d)}`)),
    noData: t('No valid record up to the evaluation date', 'Nenhum registro válido até a data de avaliação'),
    forming: (day: number, of: number) =>
      t(
        `Preflight baseline still forming (day ${day} of ${of}); rules start on flight day 1`,
        `Linha de base pré-voo em formação (dia ${day} de ${of}); as regras começam no 1º dia de voo`,
      ),
    noBaseline: (got: number, of: number, min: number) =>
      t(`No preflight baseline: ${got} of ${of} days recorded (minimum ${min})`, `Sem linha de base pré-voo: ${got} de ${of} dias registrados (mínimo ${min})`),
    ok: (got: number, of: number) =>
      t(`Evaluated: ${got} of ${of} days recorded in the rule window`, `Avaliado: ${got} de ${of} dias com registro na janela da regra`),
    noExercise: (w: number, since: string) =>
      t(
        `No exercise record in the last ${days(w)} (${since}); adherence not computed`,
        `Sem registro de exercício nos últimos ${days(w)} (${since}); aderência não calculada`,
      ),
    noRecent: (w: number, since: string) => t(`No record in the last ${days(w)} (${since})`, `Sem registro nos últimos ${days(w)} (${since})`),
    notConsecutive: (got: number, w: number, since: string) =>
      t(
        `${got} of ${w} days recorded; the rule needs ${w} consecutive days up to the evaluation date (${since})`,
        `${got} de ${w} dias registrados; a regra exige ${w} dias consecutivos até a data de avaliação (${since})`,
      ),
    tooFew: (got: number, w: number, min: number, since: string) =>
      t(
        `${got} of ${w} days recorded in the window (minimum ${min}; ${since})`,
        `${got} de ${w} dias registrados na janela (mínimo ${min}; ${since})`,
      ),
    prevWindow: (w: number, got: number, min: number) =>
      t(
        `Previous ${w}-day window has ${days(got)} recorded (minimum ${min}); trend not computed`,
        `Janela anterior de ${w} dias com ${days(got)} registrados (mínimo ${min}); tendência não calculada`,
      ),
  };
}

export function computeCoverage(input: CoverageInput): Record<VariableId, VariableCoverage> {
  const { series, preflight, valid, asOfDay, firstDay, launchDay } = input;
  const T = texts(input.locale ?? 'en');
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

    if (last === null || daysSinceLast === null) {
      out[variable] = { ...base, status: 'no-data', reason: T.noData };
      continue;
    }

    if (asOfDay < launchDay) {
      out[variable] = { ...base, status: 'no-baseline', reason: T.forming(asOfDay - firstDay + 1, BASELINE.preflightDays) };
      continue;
    }

    if (req.needsBaseline && !preflight[variable]) {
      const preDays = pointsInWindow(series[variable], firstDay + BASELINE.preflightDays - 1, BASELINE.preflightDays).length;
      out[variable] = { ...base, status: 'no-baseline', reason: T.noBaseline(preDays, BASELINE.preflightDays, BASELINE.minDays) };
      continue;
    }

    const stale = staleReason(T, variable, series, asOfDay, validDays, T.since(daysSinceLast));
    out[variable] = stale
      ? { ...base, status: 'stale', reason: stale }
      : { ...base, status: 'ok', reason: T.ok(validDays, req.windowDays) };
  }
  return out;
}

/** Motivo de dados insuficientes na janela da regra, ou null se a regra pôde avaliar. */
function staleReason(
  T: ReturnType<typeof texts>,
  variable: VariableId,
  series: DailySeries,
  asOfDay: number,
  validDays: number,
  since: string,
): string | null {
  const req = COVERAGE[variable];
  const consecutive = req.minValidDays === req.windowDays && req.windowDays > 1;

  if (validDays < req.minValidDays) {
    if (variable === 'exerciseLoad') return T.noExercise(req.windowDays, since);
    if (req.minValidDays === 1) return T.noRecent(req.windowDays, since);
    if (consecutive) return T.notConsecutive(validDays, req.windowDays, since);
    return T.tooFew(validDays, req.windowDays, req.minValidDays, since);
  }

  if (variable === 'selfReport') {
    const cfg = RULES.selfReport;
    const prev = pointsInWindow(series.selfReport, asOfDay - cfg.windowDays, cfg.windowDays).length;
    if (prev < cfg.minDays) return T.prevWindow(cfg.windowDays, prev, cfg.minDays);
  }
  return null;
}
