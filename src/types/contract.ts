/**
 * CONTRATO CONGELADO entre Bloco A (dados e motor) e Bloco B (interface).
 * Transcrito da seção 8 da especificação. Qualquer mudança aqui exige
 * acordo explícito das duas pessoas.
 */

export type VariableId =
  | 'restingHeartRate'
  | 'hrv'
  | 'bloodPressure'
  | 'sleep'
  | 'selfReport'
  | 'bodyMass'
  | 'exerciseLoad';

export type DataOrigin = 'synthetic' | 'measured' | 'estimated';

export type Severity = 'normal' | 'attention' | 'critical';

/** ADIÇÃO (acordo Bloco A + B): idioma do texto emitido pelo motor. Padrão 'en'. */
export type Locale = 'en' | 'pt';

export interface Measurement {
  id: string;
  astronautId: string;
  variable: VariableId;
  value: number;
  secondaryValue?: number; // diastolica, qualidade do sono, minutos prescritos
  unit: string;
  timestamp: string; // ISO 8601
  origin: DataOrigin;
  method: string; // 'wearable' | 'manual' | 'self-report' | ...
}

export interface Baseline {
  variable: VariableId;
  mean: number;
  stdDev: number;
  windowStart: string;
  windowEnd: string;
  kind: 'preflight' | 'rolling';
}

export interface Evidence {
  label: string; // 'HRV atual'
  value: number;
  unit: string;
  comparedTo?: number; // o baseline
}

export interface Alert {
  id: string;
  astronautId: string;
  severity: Severity;
  variables: VariableId[]; // mais de um = alerta composto
  title: string;
  explanation: string; // o porque, em linguagem de possibilidade
  arithmetic: string; // a formula aplicada, legivel
  evidence: Evidence[]; // os numeros que sustentam o alerta
  guidance: string; // a acao recomendada
  sourceRef: string; // referencia NASA/CSA ou 'arbitrary-threshold'
  escalate: boolean; // acionar oficial medico / Terra
  raisedAt: string;
}

export interface AdherenceStatus {
  astronautId: string;
  prescribedMinutes: number;
  completedMinutes: number;
  /**
   * 0..1. Sem registro de exercício na janela (prescribedMinutes = 0) vale 1
   * por compatibilidade, mas NÃO significa 100% de aderência: nesse caso
   * coverage.exerciseLoad.status !== 'ok'.
   */
  adherenceRatio: number;
  windowDays: number;
}

/*
 * ADIÇÃO 14/11/2026 (acordo Bloco A + Bloco B): cobertura de dados por
 * variável. Ausência de alerta ≠ normal: uma variável só é "avaliada" quando
 * coverage[v].status === 'ok'. Campo opcional, nada do contrato anterior muda.
 */
export type DataStatus = 'ok' | 'no-data' | 'no-baseline' | 'stale';

export interface VariableCoverage {
  variable: VariableId;
  status: DataStatus;
  lastAt: string | null; // última medição VÁLIDA até asOf
  daysSinceLast: number | null; // dias inteiros entre lastAt e asOf
  validDays: number; // dias com dado válido na janela da regra
  reason: string; // pt-BR, uma linha
}

export interface AstronautState {
  astronautId: string;
  name: string;
  missionDay: number;
  overall: Severity;
  alerts: Alert[];
  baselines: Baseline[];
  adherence: AdherenceStatus;
  latest: Record<VariableId, Measurement | null>;
  coverage?: Record<VariableId, VariableCoverage>;
}

export const VARIABLE_IDS: readonly VariableId[] = [
  'restingHeartRate',
  'hrv',
  'bloodPressure',
  'sleep',
  'selfReport',
  'bodyMass',
  'exerciseLoad',
];
