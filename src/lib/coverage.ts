// Leitura da cobertura de dados do motor (AstronautState.coverage).
// Ausência de alerta não é "normal": uma variável só é "Normal" quando o motor conseguiu avaliá-la.

import type { AstronautState, DataStatus, Severity, VariableCoverage, VariableId } from '../types/contract';
import { VARIABLE_IDS } from '../types/contract';

/** Estado exibido por variável: a gravidade dos alertas, ou "não avaliado" quando faltam dados. */
export type DisplayStatus = Severity | 'unassessed';

export const DATA_STATUS_LABEL: Record<DataStatus, string> = {
  ok: 'Dados suficientes',
  'no-data': 'Sem dados',
  'no-baseline': 'Baseline em formação',
  stale: 'Dados insuficientes',
};

export function coverageOf(state: AstronautState, v: VariableId): VariableCoverage | null {
  return state.coverage?.[v] ?? null;
}

export function severityOfVariable(state: AstronautState, v: VariableId): Severity {
  const related = state.alerts.filter((a) => a.variables.includes(v));
  if (related.some((a) => a.severity === 'critical')) return 'critical';
  if (related.some((a) => a.severity === 'attention')) return 'attention';
  return 'normal';
}

/** Alertas sempre vencem; sem alerta, a variável só é "normal" se o motor a avaliou. */
export function displayStatus(state: AstronautState, v: VariableId): DisplayStatus {
  const sev = severityOfVariable(state, v);
  if (sev !== 'normal') return sev;
  const c = coverageOf(state, v);
  return c && c.status !== 'ok' ? 'unassessed' : 'normal';
}

export interface AssessmentSummary {
  /** Variáveis que o motor não conseguiu avaliar. */
  unassessed: VariableCoverage[];
  /** Nenhuma variável pôde ser avaliada. */
  none: boolean;
}

export function assessmentSummary(state: AstronautState): AssessmentSummary {
  if (!state.coverage) return { unassessed: [], none: false };
  const unassessed = VARIABLE_IDS.map((v) => state.coverage![v]).filter((c) => c && c.status !== 'ok');
  return { unassessed, none: unassessed.length === VARIABLE_IDS.length };
}
