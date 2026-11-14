// Metadados de exibição e textos explicativos das 7 variáveis (seção 4).
// Textos de interface em português; nenhum limiar de alerta mora aqui — limiares são do motor (Bloco A).

import type { VariableId } from '../types/contract';

export type VariableClass = 'signal' | 'accumulator' | 'countermeasure';

export type Hazard = 'radiation' | 'isolation' | 'distance' | 'gravity' | 'environment';

export interface VariableMeta {
  id: VariableId;
  label: string;
  unit: string;
  secondaryLabel?: string;
  secondaryUnit?: string;
  decimals: number;
  varClass: VariableClass;
  hazards: Hazard[];
  nasaRisk: string;
  timeConstant: string;
  ruleSummary: string;
  whatItMeasures: string;
  whyItMatters: string;
  sourceIds: string[];
}

export const CLASS_LABEL: Record<VariableClass, string> = {
  signal: 'Sinal',
  accumulator: 'Acumulador',
  countermeasure: 'Contramedida',
};

export const CLASS_ROLE: Record<VariableClass, string> = {
  signal: 'Coletar → interpretar',
  accumulator: 'Consequência de longo prazo',
  countermeasure: 'Orientar — fecha o ciclo',
};

export const HAZARD_LABEL: Record<Hazard, string> = {
  radiation: 'Radiação espacial',
  isolation: 'Isolamento e confinamento',
  distance: 'Distância da Terra',
  gravity: 'Alterações da gravidade',
  environment: 'Ambientes fechados e hostis',
};

export const VARIABLES: Record<VariableId, VariableMeta> = {
  restingHeartRate: {
    id: 'restingHeartRate',
    label: 'FC de repouso',
    unit: 'bpm',
    decimals: 0,
    varClass: 'signal',
    hazards: ['gravity'],
    nasaRisk: 'Descondicionamento cardiovascular',
    timeConstant: 'Dias',
    ruleSummary: 'Desvio > 1,5 DP do baseline pré-voo por 3 dias consecutivos',
    whatItMeasures: 'Batimentos por minuto em repouso, medidos ao acordar.',
    whyItMatters:
      'Em microgravidade o coração trabalha contra menos carga e os fluidos se redistribuem. Uma elevação persistente sobre o baseline individual pode indicar descondicionamento, estresse ou sono insuficiente.',
    sourceIds: ['nasa-hrp-hazards', 'nasa-hrp-risks'],
  },
  hrv: {
    id: 'hrv',
    label: 'Variabilidade da FC (HRV)',
    unit: 'ms',
    decimals: 1,
    varClass: 'signal',
    hazards: ['isolation', 'environment'],
    nasaRisk: 'Carga autônoma, saúde comportamental',
    timeConstant: 'Dias',
    ruleSummary: 'Queda > 20% da média do baseline pré-voo por 3 dias',
    whatItMeasures: 'RMSSD: variação entre batimentos sucessivos, reflexo do equilíbrio do sistema nervoso autônomo.',
    whyItMatters:
      'Queda sustentada da HRV costuma acompanhar estresse, fadiga e sono ruim. É um dos sinais mais rápidos de sobrecarga.',
    sourceIds: ['nasa-hrp-risks', 'nasa-hrp-research'],
  },
  bloodPressure: {
    id: 'bloodPressure',
    label: 'Pressão arterial',
    unit: 'mmHg',
    secondaryLabel: 'Diastólica',
    secondaryUnit: 'mmHg',
    decimals: 0,
    varClass: 'signal',
    hazards: ['gravity'],
    nasaRisk: 'Deslocamento cefálico de fluidos',
    timeConstant: 'Semanas',
    ruleSummary: 'Desvio sistemático do baseline individual por 5 dias (não usa corte clínico)',
    whatItMeasures: 'Pressão sistólica / diastólica.',
    whyItMatters:
      'Sem gravidade, os fluidos se deslocam em direção à cabeça. O sinal relevante é o afastamento do próprio baseline — um astronauta saudável raramente cruza o corte clínico de hipertensão.',
    sourceIds: ['nasa-hrp-hazards', 'nasa-hrp-risks'],
  },
  sleep: {
    id: 'sleep',
    label: 'Sono',
    unit: 'h',
    secondaryLabel: 'Qualidade (1–5)',
    secondaryUnit: '/5',
    decimals: 1,
    varClass: 'signal',
    hazards: ['isolation', 'environment'],
    nasaRisk: 'Ruptura circadiana, ambiente fechado',
    timeConstant: 'Dias',
    ruleSummary: 'Déficit acumulado vs. prescrito acima do limiar em janela de 7 dias',
    whatItMeasures: 'Horas dormidas por noite e qualidade percebida (1 a 5).',
    whyItMatters:
      'Em órbita baixa o dia claro-escuro se repete cerca de 16 vezes em 24 h; ruído, luz e confinamento perturbam o ritmo circadiano. Déficit de sono degrada desempenho e humor.',
    sourceIds: ['nasa-hrp-hazards', 'nasa-hrp-risks'],
  },
  selfReport: {
    id: 'selfReport',
    label: 'Autorrelato',
    unit: '/5',
    decimals: 1,
    varClass: 'signal',
    hazards: ['isolation', 'distance'],
    nasaRisk: 'Isolamento e confinamento',
    timeConstant: 'Dias',
    ruleSummary: 'Tendência de queda em janela móvel de 5 dias',
    whatItMeasures: 'Humor, estresse e fadiga em escala de 1 a 5, preenchidos pelo próprio astronauta.',
    whyItMatters:
      'Isolamento, confinamento e distância da Terra afetam a saúde comportamental. O autorrelato capta o que os sensores não medem.',
    sourceIds: ['nasa-hrp-hazards', 'nasa-hrp-risks'],
  },
  bodyMass: {
    id: 'bodyMass',
    label: 'Massa corporal',
    unit: 'kg',
    decimals: 1,
    varClass: 'accumulator',
    hazards: ['gravity'],
    nasaRisk: 'Atrofia muscular, perda de fluidos',
    timeConstant: 'Semanas',
    ruleSummary: '%Δ do baseline pré-voo acima do limiar',
    whatItMeasures: 'Massa em kg e variação percentual desde o pré-voo.',
    whyItMatters:
      'Perda muscular e de fluidos se acumulam ao longo de semanas. A massa integra esses efeitos e mostra a consequência de longo prazo.',
    sourceIds: ['nasa-hrp-hazards', 'nasa-hrp-risks'],
  },
  exerciseLoad: {
    id: 'exerciseLoad',
    label: 'Carga de exercício',
    unit: 'min',
    secondaryLabel: 'Prescrito',
    secondaryUnit: 'min',
    decimals: 0,
    varClass: 'countermeasure',
    hazards: ['gravity'],
    nasaRisk: 'Contramedida da perda muscular e cardiovascular',
    timeConstant: 'Diário, acumulado',
    ruleSummary: 'Aderência (completado ÷ prescrito) < 80% em 7 dias',
    whatItMeasures: 'Minutos de exercício completados versus prescritos (aeróbico e resistência).',
    whyItMatters:
      'Exercício diário — esteira, cicloergômetro e o aparelho de resistência ARED na ISS — é a principal contramedida contra perda muscular, óssea e cardiovascular.',
    sourceIds: ['nasa-hrp-risks', 'nasa-hrp-research'],
  },
};
