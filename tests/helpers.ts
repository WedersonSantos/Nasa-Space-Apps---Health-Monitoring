import type { Measurement, VariableId } from '../src/types/contract';
import { EXPECTED_UNITS } from '../src/engine/config/thresholds';

export const AST = 'T-01';
export const START = Date.UTC(2026, 0, 1);
const DAY = 86_400_000;

export const dayIso = (i: number, hour = 8) => new Date(START + i * DAY + hour * 3_600_000).toISOString();
export const asOfDay = (i: number) => new Date(START + i * DAY + 23.99 * 3_600_000).toISOString();

type Value = number | [number, number];
export type DayValues = Partial<Record<VariableId, Value>>;

/** Linha de base estável e "saudável" para todos os sinais. */
export const STABLE = {
  restingHeartRate: 58,
  hrv: 55,
  bloodPressure: [118, 76],
  sleep: [7.6, 4],
  selfReport: 4,
  bodyMass: 75,
  exerciseLoad: [150, 150],
};

/** Pequena oscilação determinística no pré-voo, para DP > 0. */
const wobble = (i: number) => [0, 1, -1, 0.5, -0.5, 1, -1][i % 7];

/**
 * Gera `days` dias de medições. `override(i)` substitui valores do dia i.
 * selfReport é gravado como índice direto (method 'self-report').
 */
export function buildDays(days: number, override: (i: number) => DayValues = () => ({})): Measurement[] {
  const out: Measurement[] = [];
  for (let i = 0; i < days; i++) {
    const w = i < 7 ? wobble(i) : 0;
    const base: DayValues = {
      restingHeartRate: STABLE.restingHeartRate + w,
      hrv: STABLE.hrv + w * 2,
      bloodPressure: [118 + w * 2, 76],
      sleep: [7.6 + w * 0.2, 4],
      selfReport: 4 + w * 0.1,
      bodyMass: 75 + w * 0.1,
      exerciseLoad: [150, 150],
      ...override(i),
    };
    for (const [variable, v] of Object.entries(base) as [VariableId, Value][]) {
      const [value, secondaryValue] = Array.isArray(v) ? v : [v, undefined];
      out.push({
        id: `${variable}-${i}`,
        astronautId: AST,
        variable,
        value,
        ...(secondaryValue !== undefined ? { secondaryValue } : {}),
        unit: EXPECTED_UNITS[variable],
        timestamp: dayIso(i),
        origin: 'synthetic',
        method: variable === 'selfReport' ? 'self-report' : 'test',
      });
    }
  }
  return out;
}
