import type { Measurement, Severity } from './contract';

/** Perfil local do astronauta (sem PII: nomes fictícios). */
export interface AstronautProfile {
  astronautId: string;
  name: string;
}

/** Formato dos arquivos JSON de cenário em src/data/scenarios. */
export interface ScenarioFile {
  id: string;
  title: string;
  description: string;
  /** Roteiro da demo, em ordem. */
  storyline: string[];
  profile: AstronautProfile;
  /** Primeiro dia de voo (os 7 dias anteriores são o período pré-voo). */
  launchDate: string;
  /** Instante de avaliação sugerido para a demo. */
  asOf: string;
  generator: { seed: number; version: string; days: number; note: string };
  /** Resultado esperado em `asOf`, verificado pelos testes. */
  expected: { overall: Severity; ruleIds: string[] };
  measurements: Measurement[];
}
