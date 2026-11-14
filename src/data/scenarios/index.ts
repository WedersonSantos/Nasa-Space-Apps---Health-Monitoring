/**
 * Os três cenários de demo (spec §12), gerados por `npm run generate`.
 * Não editar os JSON à mão: altere scripts/generate-scenarios.ts e regenere.
 */
import type { ScenarioFile } from '../../types/scenario';
import nominal from './nominal.json';
import gradualDegradation from './gradual-degradation.json';
import criticalCountermeasure from './critical-countermeasure.json';

export const SCENARIOS: ScenarioFile[] = [
  nominal as ScenarioFile,
  gradualDegradation as ScenarioFile,
  criticalCountermeasure as ScenarioFile,
];

export function getScenario(id: string): ScenarioFile | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
