/**
 * ARQUIVO ÚNICO DE LIMIARES DO MOTOR DE ALERTAS (versionado).
 *
 * Regra de fundamentação (spec §7.3): todo limiar tem comentário citando a
 * fonte, ou está marcado como ARBITRÁRIO. Os arbitrários são parâmetros
 * iniciais sujeitos a validação clínica e aparecem como tal na interface
 * (Alert.sourceRef começa com 'arbitrary-threshold').
 *
 * Mudou um valor? Incremente ENGINE_CONFIG_VERSION.
 */
import type { VariableId } from '../../types/contract';

export const ENGINE_CONFIG_VERSION = '1.1.0';

export const BASELINE = {
  /** Spec §5: baseline pré-voo = primeiros 7 dias de registro, congelados. */
  preflightDays: 7,
  /** Spec §5: baseline móvel = últimos 7 dias. */
  rollingDays: 7,
  /** ARBITRÁRIO: mínimo de dias válidos para um baseline existir. */
  minDays: 3,
} as const;

export const RULES = {
  restingHeartRate: {
    /** Spec §5 (parâmetro inicial) — ARBITRÁRIO: desvio > 1,5 DP do baseline pré-voo. */
    zThreshold: 1.5,
    /** Spec §5 — ARBITRÁRIO: por 3 dias consecutivos. */
    consecutiveDays: 3,
    /** ARBITRÁRIO: piso do DP (bpm), evita z inflado quando 7 dias de pré-voo têm pouca variação. */
    sdFloor: 2.5,
  },
  hrv: {
    /** Spec §5 — ARBITRÁRIO: queda > 20% da média pré-voo. */
    dropFraction: 0.2,
    /** Spec §5 — ARBITRÁRIO: por 3 dias consecutivos. */
    consecutiveDays: 3,
  },
  bloodPressure: {
    /**
     * Spec §5 — ARBITRÁRIO: desvio sistemático do baseline INDIVIDUAL (nunca o
     * corte clínico 140/90, que um astronauta saudável não cruza). Usa a sistólica.
     */
    zThreshold: 1.5,
    /** Spec §5: por 5 dias consecutivos, mesma direção. */
    consecutiveDays: 5,
    /** ARBITRÁRIO: piso do DP (mmHg). */
    sdFloor: 4.0,
  },
  sleep: {
    /** NASA HRR Sleep Evidence Report: 8 h recomendadas (NASA-STD-3001 Vol. 1). */
    prescribedHours: 8.0,
    /** Spec §5: janela de 7 dias. */
    windowDays: 7,
    /** ARBITRÁRIO: déficit acumulado máximo tolerado na janela (≈ 1 h/noite). */
    maxCumulativeDeficitHours: 7.0,
    /** ARBITRÁRIO: noites registradas mínimas na janela para avaliar. */
    minNights: 5,
  },
  selfReport: {
    /** Spec §5: janela móvel de 5 dias (atual) vs. 5 dias anteriores. */
    windowDays: 5,
    /** ARBITRÁRIO: dias mínimos registrados em cada janela. */
    minDays: 3,
    /** ARBITRÁRIO: queda mínima do índice de bem-estar (escala 1–5) entre janelas. */
    minDrop: 0.5,
    /**
     * ARBITRÁRIO: a média atual também precisa estar ao menos 0,5 ponto abaixo
     * da média pré-voo — queda real vs. o próprio padrão, não só oscilação.
     */
    minBelowPreflight: 0.5,
  },
  bodyMass: {
    /** ARBITRÁRIO: média das pesagens dos últimos 7 dias representa a massa atual. */
    recentWindowDays: 7,
    /**
     * ARBITRÁRIO: alerta a partir de −2,0% vs. pré-voo. Contexto: perda típica
     * de 1–5% em voo longo (NASA — Nutritional Biochemistry of Space Flight).
     */
    lossThresholdPct: -2.0,
    /** Spec §12: comparação adicional com 3 semanas atrás (evidência). */
    comparisonDays: 21,
  },
  exerciseLoad: {
    /** NASA/SP-20250000273: prescrição de 2,5 h/dia... */
    prescribedMinutesPerDay: 150,
    /** ...6 dias por semana. */
    trainingDaysPerWeek: 6,
    /** Spec §5: janela de 7 dias. */
    windowDays: 7,
    /** Spec §5 — ARBITRÁRIO: aderência mínima de 80%. */
    minAdherence: 0.8,
  },
  /** Regra composta do cluster rápido (sono, HRV, FC). Spec §5. */
  composite: {
    /** Spec §5: mesma janela de 5 dias. */
    windowDays: 5,
    /** ARBITRÁRIO: dias mínimos com dado de cada sinal na janela. */
    minDaysPerSignal: 3,
    /**
     * ARBITRÁRIO: desvio da MÉDIA de 5 dias ≥ 1,0 DP pré-voo. Mais sensível que
     * as regras isoladas de propósito: nenhum sinal sozinho justifica alerta
     * forte; o padrão conjunto justifica.
     */
    zThreshold: 1.0,
    /** Spec §5: dois ou mais dos três sinais. */
    minSignals: 2,
    /** ARBITRÁRIO: pisos de DP por sinal. */
    sdFloors: { sleep: 0.3, hrv: 3.0, restingHeartRate: 2.0 } as Record<
      'sleep' | 'hrv' | 'restingHeartRate',
      number
    >,
  },
  /** Associação acumulador (massa) ↔ contramedida (exercício). Spec §5 "associar, nunca modelar". */
  association: {
    /** Spec §12: janela de 3 semanas. */
    windowDays: 21,
    /** Reusa RULES.exerciseLoad.minAdherence (ARBITRÁRIO, 80%). */
    minAdherence: 0.8,
    /** Reusa RULES.bodyMass.lossThresholdPct (ARBITRÁRIO, −2,0%). */
    massLossThresholdPct: -2.0,
    /**
     * ARBITRÁRIO: associação + desvio de pressão arterial simultâneos = dois
     * sistemas (musculoesquelético e cardiovascular) mais contramedida falhando
     * → estado crítico com escalonamento ao oficial médico.
     */
    criticalWithBloodPressure: true,
  },
} as const;

export interface CoverageRequirement {
  /** Janela (dias, terminando na data de avaliação) que a regra da variável lê. */
  windowDays: number;
  /** Dias com dado válido exigidos nessa janela para a regra poder avaliar. */
  minValidDays: number;
  /** A regra compara com o baseline pré-voo (sono e exercício usam a prescrição). */
  needsBaseline: boolean;
}

/**
 * Cobertura de dados (AstronautState.coverage). NENHUM limiar novo: cada valor
 * é derivado da regra isolada da variável, para que coverage 'ok' signifique
 * exatamente "a regra teve dados para avaliar".
 */
export const COVERAGE: Record<VariableId, CoverageRequirement> = {
  // Regras de N dias consecutivos: todos os N dias até a data de avaliação.
  restingHeartRate: { windowDays: RULES.restingHeartRate.consecutiveDays, minValidDays: RULES.restingHeartRate.consecutiveDays, needsBaseline: true },
  hrv: { windowDays: RULES.hrv.consecutiveDays, minValidDays: RULES.hrv.consecutiveDays, needsBaseline: true },
  bloodPressure: { windowDays: RULES.bloodPressure.consecutiveDays, minValidDays: RULES.bloodPressure.consecutiveDays, needsBaseline: true },
  sleep: { windowDays: RULES.sleep.windowDays, minValidDays: RULES.sleep.minNights, needsBaseline: false },
  // Autorrelato: a mesma exigência vale também para a janela anterior (checada no motor).
  selfReport: { windowDays: RULES.selfReport.windowDays, minValidDays: RULES.selfReport.minDays, needsBaseline: true },
  // Massa: ao menos uma pesagem na janela recente (em voo, pesagem a cada ~3 dias).
  bodyMass: { windowDays: RULES.bodyMass.recentWindowDays, minValidDays: 1, needsBaseline: true },
  // Exercício: ao menos um registro com minutos prescritos na janela.
  exerciseLoad: { windowDays: RULES.exerciseLoad.windowDays, minValidDays: 1, needsBaseline: false },
};

/** Unidade esperada por variável (validação de entrada). */
export const EXPECTED_UNITS: Record<VariableId, string> = {
  restingHeartRate: 'bpm',
  hrv: 'ms',
  bloodPressure: 'mmHg',
  sleep: 'h',
  selfReport: 'score 1-5',
  bodyMass: 'kg',
  exerciseLoad: 'min',
};

export interface PlausibleRange {
  min: number;
  max: number;
  /** Faixa do secondaryValue; `required` = medição inválida sem ele. */
  secondary?: { min: number; max: number; required: boolean };
}

/**
 * ARBITRÁRIO: faixas de plausibilidade fisiológica/instrumental. Servem só
 * para rejeitar erro de digitação/sensor, nunca para gerar alerta.
 */
export const PLAUSIBLE_RANGES: Record<VariableId, PlausibleRange> = {
  restingHeartRate: { min: 30, max: 130 },
  hrv: { min: 5, max: 250 },
  bloodPressure: { min: 70, max: 220, secondary: { min: 35, max: 140, required: true } }, // sistólica / diastólica
  sleep: { min: 0, max: 14, secondary: { min: 1, max: 5, required: false } }, // horas / qualidade
  selfReport: { min: 1, max: 5 }, // índice de bem-estar
  bodyMass: { min: 35, max: 160 },
  exerciseLoad: { min: 0, max: 360, secondary: { min: 0, max: 360, required: true } }, // completado / prescrito
};
