// PONTO ÚNICO DE INTEGRAÇÃO com o Bloco A (Integração 1).
// Cenários: src/data/scenarios · Motor: src/engine (evaluate, puro) · Persistência: src/storage.

import type { AstronautState, Measurement } from '../types/contract';
import type { ScenarioFile } from '../types/scenario';
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
  'gradual-degradation': 'Degradação gradual',
  'critical-countermeasure': 'Crítico com contramedida',
};

export const SCENARIOS: ScenarioInfo[] = SCENARIO_FILES.map((s, i) => ({
  id: s.id,
  number: i + 1,
  label: SHORT_LABEL[s.id] ?? s.title,
  description: s.description,
}));

export const DEFAULT_SCENARIO: ScenarioId = SCENARIO_FILES[0].id;

export const store = new MeasurementStore();

export function scenarioFile(id: ScenarioId): ScenarioFile {
  const s = getScenario(id);
  if (!s) throw new Error(`Cenário desconhecido: ${id}`);
  return s;
}

/** Cenário ativo gravado no dispositivo, se ainda existir. */
export function initialScenarioId(): ScenarioId {
  const saved = store.getActiveScenario();
  return saved && getScenario(saved) ? saved : DEFAULT_SCENARIO;
}

export function evaluateState(measurements: Measurement[], scenario: ScenarioFile, asOf: string): AstronautState {
  return evaluate(measurements, scenario.profile.astronautId, asOf, scenario.profile);
}

// ---------- relógio de missão ----------

const DAY_MS = 86_400_000;

/** Dia de missão (1 = dia do lançamento; pré-voo ≤ 0). Mesma convenção do motor. */
export function missionDayOf(iso: string, launchDate: string): number {
  return Math.floor((Date.parse(iso) - Date.parse(launchDate)) / DAY_MS) + 1;
}

/** Fim do dia de missão `day` — usado como asOf ao navegar pela linha do tempo. */
export function endOfMissionDay(day: number, launchDate: string): string {
  return new Date(Date.parse(launchDate) + day * DAY_MS - 1000).toISOString();
}

/** Posição contínua em dias de missão para os gráficos. */
export function missionPos(iso: string, launchDate: string): number {
  return (Date.parse(iso) - Date.parse(launchDate)) / DAY_MS + 1;
}
