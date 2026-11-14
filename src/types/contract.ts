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
  adherenceRatio: number; // 0..1
  windowDays: number;
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
