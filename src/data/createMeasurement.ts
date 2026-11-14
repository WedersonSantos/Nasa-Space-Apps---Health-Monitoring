/**
 * Criação de medições a partir da entrada manual (formulário do Bloco B).
 * Garante rastreabilidade (spec §7.1): origem, unidade, horário e método
 * sempre preenchidos; valida antes de devolver.
 */
import type { DataOrigin, Locale, Measurement, VariableId } from '../types/contract';
import { checkMeasurement } from '../engine/validation';
import { EXPECTED_UNITS } from '../engine/config/thresholds';

export interface MeasurementInput {
  astronautId: string;
  variable: VariableId;
  value: number | string | null | undefined;
  secondaryValue?: number | string | null;
  /** ISO 8601. O chamador fornece (a UI usa o relógio; o motor nunca). */
  timestamp: string;
  method?: string;
  origin?: DataOrigin;
  /** Opcional; por padrão gerado a partir de variável, método e horário. */
  id?: string;
}

const SELF_REPORT_PT = { mood: 'humor', stress: 'estresse', fatigue: 'fadiga' } as const;

export type CreateResult = { ok: true; measurement: Measurement } | { ok: false; error: string };

const DEFAULT_METHOD: Record<VariableId, string> = {
  restingHeartRate: 'manual',
  hrv: 'manual',
  bloodPressure: 'cuff-manual',
  sleep: 'manual',
  selfReport: 'self-report',
  bodyMass: 'manual',
  exerciseLoad: 'exercise-log',
};

function toNumber(x: unknown): number | undefined {
  if (x === null || x === undefined || x === '') return undefined;
  const n = typeof x === 'number' ? x : Number(String(x).replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
}

export function createMeasurement(input: MeasurementInput, locale: Locale = 'en'): CreateResult {
  const value = toNumber(input.value);
  if (value === undefined) return { ok: false, error: locale === 'pt' ? 'Preencha o valor.' : 'Fill in the value.' };
  const secondaryValue = toNumber(input.secondaryValue);
  const method = input.method ?? DEFAULT_METHOD[input.variable];
  const m: Measurement = {
    id: input.id ?? `${input.astronautId}-${input.variable}-${method}-${input.timestamp}`,
    astronautId: input.astronautId,
    variable: input.variable,
    value,
    ...(secondaryValue !== undefined ? { secondaryValue } : {}),
    unit: EXPECTED_UNITS[input.variable],
    timestamp: input.timestamp,
    origin: input.origin ?? 'measured',
    method,
  };
  const error = checkMeasurement(m, locale);
  return error ? { ok: false, error } : { ok: true, measurement: m };
}

/**
 * Autorrelato do formulário: humor, estresse e fadiga (1–5) viram três
 * medições com method 'self-report:mood' | 'self-report:stress' | 'self-report:fatigue'.
 */
export function createSelfReport(
  astronautId: string,
  timestamp: string,
  scores: { mood: number | string; stress: number | string; fatigue: number | string },
  locale: Locale = 'en',
): { ok: true; measurements: Measurement[] } | { ok: false; error: string } {
  const out: Measurement[] = [];
  for (const c of ['mood', 'stress', 'fatigue'] as const) {
    const r = createMeasurement({ astronautId, variable: 'selfReport', value: scores[c], timestamp, method: `self-report:${c}` }, locale);
    const name = locale === 'pt' ? SELF_REPORT_PT[c] : c;
    if (!r.ok) return { ok: false, error: `${name}: ${r.error}` };
    if (!Number.isInteger(r.measurement.value)) return { ok: false, error: `${name}: ${locale === 'pt' ? 'use um inteiro de 1 a 5' : 'use a whole number from 1 to 5'}` };
    out.push(r.measurement);
  }
  return { ok: true, measurements: out };
}
