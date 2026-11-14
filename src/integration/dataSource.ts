// SINGLE INTEGRATION POINT with Bloco A (Integration 1).
// Scenarios: src/data/scenarios · Engine: src/engine (evaluate, pure) · Persistence: src/storage.

import type { AstronautState, Measurement } from '../types/contract';
import type { AstronautProfile, ScenarioFile } from '../types/scenario';
import { evaluate } from '../engine';
import { SCENARIOS as SCENARIO_FILES, getScenario } from '../data/scenarios';
import { MeasurementStore } from '../storage/measurementStore';

export type ScenarioId = string;

export interface ScenarioInfo {
  id: ScenarioId;
  number: number;
  label: string;
  description: string;
}

const SHORT_LABEL: Record<string, string> = {
  nominal: 'Nominal',
  'gradual-degradation': 'Gradual degradation',
  'critical-countermeasure': 'Critical with countermeasure',
};

/** English UI copy for each scenario (the scenario JSON descriptions belong to another team). */
const DESCRIPTION: Record<string, string> = {
  nominal:
    'All signals within baseline, exercise adherence above 90%, stable mass. Shows the system does not alarm without reason.',
  'gradual-degradation':
    'Three weeks of shorter sleep, falling HRV and rising resting HR. The composite rule recognises the overload pattern.',
  'critical-countermeasure':
    'Low exercise adherence, falling body mass and blood pressure drifting from baseline. Critical, with escalation to the medical officer.',
};

export const SCENARIOS: ScenarioInfo[] = SCENARIO_FILES.map((s, i) => ({
  id: s.id,
  number: i + 1,
  label: SHORT_LABEL[s.id] ?? s.title,
  description: DESCRIPTION[s.id] ?? s.description,
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

export function evaluateState(measurements: Measurement[], mission: MissionContext, asOf: string): AstronautState {
  return evaluate(measurements, mission.profile.astronautId, asOf, mission.profile);
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
