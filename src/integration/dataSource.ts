// SINGLE INTEGRATION POINT with Bloco A (Integration 1).
// Scenarios: src/data/scenarios · Engine: src/engine (evaluate, pure) · Persistence: src/storage.

import type { AstronautState, Measurement } from '../types/contract';
import type { AstronautProfile, ScenarioFile } from '../types/scenario';
import { evaluate } from '../engine';
import { SCENARIOS as SCENARIO_FILES, getScenario } from '../data/scenarios';
import { MeasurementStore } from '../storage/measurementStore';
import type { L10n, Lang } from '../i18n';

export type ScenarioId = string;

export interface ScenarioInfo {
  id: ScenarioId;
  number: number;
  label: L10n;
  description: L10n;
}

const SHORT_LABEL: Record<string, L10n> = {
  nominal: { en: 'Nominal', pt: 'Nominal' },
  'gradual-degradation': { en: 'Gradual degradation', pt: 'Degradação gradual' },
  'critical-countermeasure': { en: 'Critical with countermeasure', pt: 'Crítico com contramedida' },
};

/** Bilingual UI copy for each scenario (the scenario JSON descriptions belong to another team). */
const DESCRIPTION: Record<string, L10n> = {
  nominal: {
    en: 'All signals within baseline, exercise adherence above 90%, stable mass. Shows the system does not alarm without reason.',
    pt: 'Todos os sinais dentro do baseline, aderência ao exercício acima de 90%, massa estável. Mostra que o sistema não alarma sem motivo.',
  },
  'gradual-degradation': {
    en: 'Three weeks of shorter sleep, falling HRV and rising resting HR. The composite rule recognises the overload pattern.',
    pt: 'Três semanas de sono mais curto, HRV em queda e FC de repouso em alta. A regra composta reconhece o padrão de sobrecarga.',
  },
  'critical-countermeasure': {
    en: 'Low exercise adherence, falling body mass and blood pressure drifting from baseline. Critical, with escalation to the medical officer.',
    pt: 'Baixa aderência ao exercício, massa corporal em queda e pressão arterial se afastando do baseline. Crítico, com escalonamento ao oficial médico.',
  },
};

export const SCENARIOS: ScenarioInfo[] = SCENARIO_FILES.map((s, i) => ({
  id: s.id,
  number: i + 1,
  label: SHORT_LABEL[s.id] ?? { en: s.title, pt: s.title },
  description: DESCRIPTION[s.id] ?? { en: s.description, pt: s.description },
}));

export const DEFAULT_SCENARIO: ScenarioId = SCENARIO_FILES[0].id;

export const store = new MeasurementStore();

export function scenarioFile(id: ScenarioId): ScenarioFile {
  const s = getScenario(id);
  if (!s) throw new Error(`Unknown scenario: ${id}`);
  return s;
}

/** Active scenario saved on the device, if it still exists. */
export function initialScenarioId(): ScenarioId {
  const saved = store.getActiveScenario();
  return saved && getScenario(saved) ? saved : DEFAULT_SCENARIO;
}

/** What the evaluation needs to know about the mission: who it is and when it launched. A ScenarioFile satisfies this type. */
export interface MissionContext {
  profile: AstronautProfile;
  launchDate: string;
}

export function evaluateState(
  measurements: Measurement[],
  mission: MissionContext,
  asOf: string,
  locale: Lang = 'en',
): AstronautState {
  return evaluate(measurements, mission.profile.astronautId, asOf, mission.profile, { locale });
}

// ---------- mission clock ----------

const DAY_MS = 86_400_000;

/** Mission day (1 = launch day; pre-flight ≤ 0). Same convention as the engine. */
export function missionDayOf(iso: string, launchDate: string): number {
  return Math.floor((Date.parse(iso) - Date.parse(launchDate)) / DAY_MS) + 1;
}

/** End of mission day `day` — used as asOf when navigating the timeline. */
export function endOfMissionDay(day: number, launchDate: string): string {
  return new Date(Date.parse(launchDate) + day * DAY_MS - 1000).toISOString();
}

/** Continuous position in mission days for the charts. */
export function missionPos(iso: string, launchDate: string): number {
  return (Date.parse(iso) - Date.parse(launchDate)) / DAY_MS + 1;
}
