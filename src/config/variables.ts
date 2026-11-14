// Display metadata and explanatory copy for the 7 variables (section 4).
// UI copy only (bilingual); no alert threshold lives here — thresholds belong to the engine (Bloco A).

import type { VariableId } from '../types/contract';
import type { L10n } from '../i18n';

export type VariableClass = 'signal' | 'accumulator' | 'countermeasure';

export type Hazard = 'radiation' | 'isolation' | 'distance' | 'gravity' | 'environment';

export interface VariableMeta {
  id: VariableId;
  label: L10n;
  unit: string;
  secondaryLabel?: L10n;
  secondaryUnit?: string;
  decimals: number;
  varClass: VariableClass;
  hazards: Hazard[];
  nasaRisk: L10n;
  timeConstant: L10n;
  ruleSummary: L10n;
  whatItMeasures: L10n;
  whyItMatters: L10n;
  /** How to collect in flight: equipment, conditions and frequency. */
  howToMeasure: { equipment: L10n; conditions: L10n; frequency: L10n };
  sourceIds: string[];
}

export const CLASS_LABEL: Record<VariableClass, L10n> = {
  signal: { en: 'Signal', pt: 'Sinal' },
  accumulator: { en: 'Accumulator', pt: 'Acumulador' },
  countermeasure: { en: 'Countermeasure', pt: 'Contramedida' },
};

export const CLASS_ROLE: Record<VariableClass, L10n> = {
  signal: { en: 'Collect → interpret', pt: 'Coletar → interpretar' },
  accumulator: { en: 'Long-term consequence', pt: 'Consequência de longo prazo' },
  countermeasure: { en: 'Guide — closes the loop', pt: 'Orientar — fecha o ciclo' },
};

export const HAZARD_LABEL: Record<Hazard, L10n> = {
  radiation: { en: 'Space radiation', pt: 'Radiação espacial' },
  isolation: { en: 'Isolation and confinement', pt: 'Isolamento e confinamento' },
  distance: { en: 'Distance from Earth', pt: 'Distância da Terra' },
  gravity: { en: 'Altered gravity', pt: 'Alterações da gravidade' },
  environment: { en: 'Hostile, closed environments', pt: 'Ambientes fechados e hostis' },
};

const DAYS: L10n = { en: 'Days', pt: 'Dias' };
const WEEKS: L10n = { en: 'Weeks', pt: 'Semanas' };

export const VARIABLES: Record<VariableId, VariableMeta> = {
  restingHeartRate: {
    id: 'restingHeartRate',
    label: { en: 'Resting HR', pt: 'FC de repouso' },
    unit: 'bpm',
    decimals: 0,
    varClass: 'signal',
    hazards: ['gravity'],
    nasaRisk: { en: 'Cardiovascular deconditioning', pt: 'Descondicionamento cardiovascular' },
    timeConstant: DAYS,
    ruleSummary: {
      en: 'Deviation > 1.5 SD from the pre-flight baseline for 3 consecutive days',
      pt: 'Desvio > 1,5 DP do baseline pré-voo por 3 dias consecutivos',
    },
    whatItMeasures: {
      en: 'Beats per minute at rest, measured on waking.',
      pt: 'Batimentos por minuto em repouso, medidos ao acordar.',
    },
    whyItMatters: {
      en: 'In microgravity the heart works against less load and fluids shift. A persistent rise above the individual baseline may indicate deconditioning, stress or insufficient sleep.',
      pt: 'Em microgravidade o coração trabalha contra menos carga e os fluidos se redistribuem. Uma elevação persistente sobre o baseline individual pode indicar descondicionamento, estresse ou sono insuficiente.',
    },
    howToMeasure: {
      equipment: {
        en: 'Wearable heart monitor (chest strap or sensor shirt) or finger pulse oximeter.',
        pt: 'Monitor cardíaco vestível (cinta peitoral ou camiseta com sensores) ou oxímetro de dedo.',
      },
      conditions: {
        en: 'On waking, still in the sleeping bag, before coffee, talking or exercise. Stay still for 1 minute and log the average value.',
        pt: 'Ao acordar, ainda no saco de dormir, antes de café, conversa ou exercício. Fique 1 minuto imóvel e registre o valor médio.',
      },
      frequency: {
        en: 'Once a day, always at the same onboard time.',
        pt: '1 vez por dia, sempre no mesmo horário de bordo.',
      },
    },
    sourceIds: ['nasa-hrp-hazards', 'nasa-hrp-risks'],
  },
  hrv: {
    id: 'hrv',
    label: { en: 'Heart rate variability (HRV)', pt: 'Variabilidade da FC (HRV)' },
    unit: 'ms',
    decimals: 1,
    varClass: 'signal',
    hazards: ['isolation', 'environment'],
    nasaRisk: { en: 'Autonomic load, behavioral health', pt: 'Carga autônoma, saúde comportamental' },
    timeConstant: DAYS,
    ruleSummary: {
      en: 'Drop > 20% from the pre-flight baseline mean for 3 days',
      pt: 'Queda > 20% da média do baseline pré-voo por 3 dias',
    },
    whatItMeasures: {
      en: 'RMSSD: the variation between successive heartbeats, reflecting autonomic nervous system balance.',
      pt: 'RMSSD: variação entre batimentos sucessivos, reflexo do equilíbrio do sistema nervoso autônomo.',
    },
    whyItMatters: {
      en: 'A sustained drop in HRV often accompanies stress, fatigue and poor sleep. It is one of the fastest signs of overload.',
      pt: 'Queda sustentada da HRV costuma acompanhar estresse, fadiga e sono ruim. É um dos sinais mais rápidos de sobrecarga.',
    },
    howToMeasure: {
      equipment: {
        en: 'ECG chest strap, which records the interval between beats (a wrist watch is less accurate).',
        pt: 'Cinta peitoral com ECG, que registra o intervalo entre batimentos (relógio de pulso é menos preciso).',
      },
      conditions: {
        en: 'Together with resting HR: on waking, still, breathing naturally, a 2- to 5-minute recording in the same position every day. The logged value is RMSSD in ms.',
        pt: 'Junto com a FC de repouso: ao acordar, imóvel, respiração natural, gravação de 2 a 5 minutos na mesma posição todos os dias. O valor registrado é o RMSSD em ms.',
      },
      frequency: {
        en: 'Once a day, together with resting HR.',
        pt: '1 vez por dia, junto com a FC de repouso.',
      },
    },
    sourceIds: ['nasa-hrp-risks', 'nasa-hrp-research'],
  },
  bloodPressure: {
    id: 'bloodPressure',
    label: { en: 'Blood pressure', pt: 'Pressão arterial' },
    unit: 'mmHg',
    secondaryLabel: { en: 'Diastolic', pt: 'Diastólica' },
    secondaryUnit: 'mmHg',
    decimals: 0,
    varClass: 'signal',
    hazards: ['gravity'],
    nasaRisk: { en: 'Headward fluid shift', pt: 'Deslocamento cefálico de fluidos' },
    timeConstant: WEEKS,
    ruleSummary: {
      en: 'Systematic deviation from the individual baseline for 5 days (no clinical cutoff)',
      pt: 'Desvio sistemático do baseline individual por 5 dias (não usa corte clínico)',
    },
    whatItMeasures: { en: 'Systolic / diastolic pressure.', pt: 'Pressão sistólica / diastólica.' },
    whyItMatters: {
      en: 'Without gravity, fluids shift toward the head. The relevant signal is drift from one’s own baseline — a healthy astronaut rarely crosses the clinical hypertension cutoff.',
      pt: 'Sem gravidade, os fluidos se deslocam em direção à cabeça. O sinal relevante é o afastamento do próprio baseline — um astronauta saudável raramente cruza o corte clínico de hipertensão.',
    },
    howToMeasure: {
      equipment: {
        en: 'Automatic upper-arm cuff monitor from the onboard medical kit.',
        pt: 'Monitor automático de braço (manguito) do kit médico de bordo.',
      },
      conditions: {
        en: 'After 5 minutes of rest. In microgravity there is no “sitting”: keep your body stable (feet in the foot restraints or held by a strap), arm relaxed and supported at heart level, without talking. Take 2 readings 1 minute apart and log the average.',
        pt: 'Após 5 minutos de repouso. Em microgravidade não existe “sentado”: mantenha o corpo estável (pés presos aos apoios ou contido por uma faixa), braço relaxado e apoiado na altura do coração, sem falar. Faça 2 leituras com 1 minuto de intervalo e registre a média.',
      },
      frequency: {
        en: 'Once a day at the same time; twice a day while a blood pressure alert is active.',
        pt: '1 vez por dia no mesmo horário; 2 vezes por dia enquanto houver alerta de pressão.',
      },
    },
    sourceIds: ['nasa-hrp-hazards', 'nasa-hrp-risks'],
  },
  sleep: {
    id: 'sleep',
    label: { en: 'Sleep', pt: 'Sono' },
    unit: 'h',
    secondaryLabel: { en: 'Quality (1–5)', pt: 'Qualidade (1–5)' },
    secondaryUnit: '/5',
    decimals: 1,
    varClass: 'signal',
    hazards: ['isolation', 'environment'],
    nasaRisk: { en: 'Circadian disruption, closed environment', pt: 'Ruptura circadiana, ambiente fechado' },
    timeConstant: DAYS,
    ruleSummary: {
      en: 'Accumulated deficit vs. prescribed sleep above threshold over a 7-day window',
      pt: 'Déficit acumulado vs. prescrito acima do limiar em janela de 7 dias',
    },
    whatItMeasures: {
      en: 'Hours slept per night and perceived quality (1 to 5).',
      pt: 'Horas dormidas por noite e qualidade percebida (1 a 5).',
    },
    whyItMatters: {
      en: 'In low Earth orbit the light–dark cycle repeats about 16 times in 24 h; noise, light and confinement disturb the circadian rhythm. Sleep deficit degrades performance and mood.',
      pt: 'Em órbita baixa o dia claro-escuro se repete cerca de 16 vezes em 24 h; ruído, luz e confinamento perturbam o ritmo circadiano. Déficit de sono degrada desempenho e humor.',
    },
    howToMeasure: {
      equipment: {
        en: 'Wrist actigraph for hours slept; quality (1 to 5) is your own rating.',
        pt: 'Actígrafo de pulso para as horas dormidas; a qualidade (1 a 5) é a sua avaliação.',
      },
      conditions: {
        en: 'Log on waking, counting only the time in the sleeping bag. In orbit the light–dark cycle repeats about 16 times in 24 h: always use onboard time (GMT).',
        pt: 'Registre ao acordar, contando só o período no saco de dormir. Em órbita o dia claro-escuro se repete cerca de 16 vezes em 24 h: use sempre o horário de bordo (GMT).',
      },
      frequency: { en: 'Once a day, on waking.', pt: '1 vez por dia, ao acordar.' },
    },
    sourceIds: ['nasa-hrp-hazards', 'nasa-hrp-risks'],
  },
  selfReport: {
    id: 'selfReport',
    label: { en: 'Self-report', pt: 'Autorrelato' },
    unit: '/5',
    decimals: 1,
    varClass: 'signal',
    hazards: ['isolation', 'distance'],
    nasaRisk: { en: 'Isolation and confinement', pt: 'Isolamento e confinamento' },
    timeConstant: DAYS,
    ruleSummary: {
      en: 'Downward trend over a 5-day moving window',
      pt: 'Tendência de queda em janela móvel de 5 dias',
    },
    whatItMeasures: {
      en: 'Mood, stress and fatigue on a 1 to 5 scale, filled in by the astronaut.',
      pt: 'Humor, estresse e fadiga em escala de 1 a 5, preenchidos pelo próprio astronauta.',
    },
    whyItMatters: {
      en: 'Isolation, confinement and distance from Earth affect behavioral health. Self-report captures what sensors do not measure.',
      pt: 'Isolamento, confinamento e distância da Terra afetam a saúde comportamental. O autorrelato capta o que os sensores não medem.',
    },
    howToMeasure: {
      equipment: { en: 'No equipment: just this form.', pt: 'Nenhum equipamento: só este formulário.' },
      conditions: {
        en: 'Answer on your own and without overthinking, always at the same time of day (for example, before sleep).',
        pt: 'Responda sozinho e sem pensar demais, sempre no mesmo momento do dia (por exemplo, antes de dormir).',
      },
      frequency: { en: 'Once a day.', pt: '1 vez por dia.' },
    },
    sourceIds: ['nasa-hrp-hazards', 'nasa-hrp-risks'],
  },
  bodyMass: {
    id: 'bodyMass',
    label: { en: 'Body mass', pt: 'Massa corporal' },
    unit: 'kg',
    decimals: 1,
    varClass: 'accumulator',
    hazards: ['gravity'],
    nasaRisk: { en: 'Muscle atrophy, fluid loss', pt: 'Atrofia muscular, perda de fluidos' },
    timeConstant: WEEKS,
    ruleSummary: {
      en: '%Δ from the pre-flight baseline above threshold',
      pt: '%Δ do baseline pré-voo acima do limiar',
    },
    whatItMeasures: {
      en: 'Mass in kg and percent change since pre-flight.',
      pt: 'Massa em kg e variação percentual desde o pré-voo.',
    },
    whyItMatters: {
      en: 'Muscle and fluid loss build up over weeks. Body mass integrates these effects and shows the long-term consequence.',
      pt: 'Perda muscular e de fluidos se acumulam ao longo de semanas. A massa integra esses efeitos e mostra a consequência de longo prazo.',
    },
    howToMeasure: {
      equipment: {
        en: 'Scales do not work in microgravity. Mass is measured by a linear acceleration device (on the ISS, SLAMMD), which applies a known force and measures the body’s acceleration.',
        pt: 'Em microgravidade a balança não funciona. A massa é medida por um dispositivo de aceleração linear (na ISS, o SLAMMD), que aplica uma força conhecida e mede a aceleração do corpo.',
      },
      conditions: {
        en: 'Light clothing and empty pockets, before the first meal, body still during the measurement, following the device procedure.',
        pt: 'Roupa leve e bolsos vazios, antes da primeira refeição, corpo imóvel durante a medição, seguindo o procedimento do equipamento.',
      },
      frequency: {
        en: '1 to 3 times a week: mass changes over weeks, not days.',
        pt: '1 a 3 vezes por semana: a massa muda em semanas, não em dias.',
      },
    },
    sourceIds: ['nasa-hrp-hazards', 'nasa-hrp-risks'],
  },
  exerciseLoad: {
    id: 'exerciseLoad',
    label: { en: 'Exercise load', pt: 'Carga de exercício' },
    unit: 'min',
    secondaryLabel: { en: 'Prescribed', pt: 'Prescrito' },
    secondaryUnit: 'min',
    decimals: 0,
    varClass: 'countermeasure',
    hazards: ['gravity'],
    nasaRisk: {
      en: 'Countermeasure for muscle and cardiovascular loss',
      pt: 'Contramedida da perda muscular e cardiovascular',
    },
    timeConstant: { en: 'Daily, cumulative', pt: 'Diário, acumulado' },
    ruleSummary: {
      en: 'Adherence (completed ÷ prescribed) < 80% over 7 days',
      pt: 'Aderência (completado ÷ prescrito) < 80% em 7 dias',
    },
    whatItMeasures: {
      en: 'Exercise minutes completed versus prescribed (aerobic and resistance).',
      pt: 'Minutos de exercício completados versus prescritos (aeróbico e resistência).',
    },
    whyItMatters: {
      en: 'Daily exercise — treadmill, cycle ergometer and the ARED resistance device on the ISS — is the main countermeasure against muscle, bone and cardiovascular loss.',
      pt: 'Exercício diário — esteira, cicloergômetro e o aparelho de resistência ARED na ISS — é a principal contramedida contra perda muscular, óssea e cardiovascular.',
    },
    howToMeasure: {
      equipment: {
        en: 'Exercise device logs: resistance (on the ISS, ARED) and aerobic (T2 treadmill and CEVIS cycle ergometer).',
        pt: 'Registro dos aparelhos de exercício: resistência (na ISS, o ARED) e aeróbico (esteira T2 e cicloergômetro CEVIS).',
      },
      conditions: {
        en: 'At the end of the day, log the minutes completed and the minutes prescribed for the day.',
        pt: 'No fim do dia, registre os minutos completados e os minutos prescritos para o dia.',
      },
      frequency: { en: 'Daily.', pt: 'Diário.' },
    },
    sourceIds: ['nasa-hrp-risks', 'nasa-hrp-research'],
  },
};
