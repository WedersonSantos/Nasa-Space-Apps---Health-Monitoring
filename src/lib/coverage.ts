// Reads the engine's data coverage (AstronautState.coverage).
// No alert is not "normal": a variable is only "Normal" when the engine was able to assess it.

import type { AstronautState, DataStatus, Severity, VariableCoverage, VariableId } from '../types/contract';
import { VARIABLE_IDS } from '../types/contract';

/** Displayed status per variable: the alert severity, or "not assessed" when data is missing. */
export type DisplayStatus = Severity | 'unassessed';

export const DATA_STATUS_LABEL: Record<DataStatus, string> = {
  ok: 'Enough data',
  'no-data': 'No data',
  'no-baseline': 'Baseline forming',
  stale: 'Not enough data',
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

/** Alerts always win; with no alert, the variable is only "normal" if the engine assessed it. */
export function displayStatus(state: AstronautState, v: VariableId): DisplayStatus {
  const sev = severityOfVariable(state, v);
  if (sev !== 'normal') return sev;
  const c = coverageOf(state, v);
  return c && c.status !== 'ok' ? 'unassessed' : 'normal';
}

export interface AssessmentSummary {
  /** Variables the engine could not assess. */
  unassessed: VariableCoverage[];
  /** No variable could be assessed. */
  none: boolean;
}

export function assessmentSummary(state: AstronautState): AssessmentSummary {
  if (!state.coverage) return { unassessed: [], none: false };
  const unassessed = VARIABLE_IDS.map((v) => state.coverage![v]).filter((c) => c && c.status !== 'ok');
  return { unassessed, none: unassessed.length === VARIABLE_IDS.length };
}
