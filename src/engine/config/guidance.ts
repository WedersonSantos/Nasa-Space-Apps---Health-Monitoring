/**
 * Guidance texts, in English and Portuguese, kept out of the logic code.
 * Clinical safety rule (spec §7.4): language of possibility, never a
 * diagnosis; say explicitly when to contact the crew medical officer.
 *
 * The plain exports (ESCALATION_TEXT, DISCLAIMER, GUIDANCE…) are English, for
 * compatibility. Use the *_BY_LOCALE records or `guidanceFor(locale)` for pt.
 */
import type { Locale } from '../../types/contract';

export const ESCALATION_TEXT_BY_LOCALE: Record<Locale, string> = {
  en: 'Contact the crew medical officer (CMO) now and log the case for ground control at the next communication window.',
  pt: 'Acione o oficial médico da tripulação (CMO) agora e registre o caso para o controle em Terra na próxima janela de comunicação.',
};

export const PERSISTENCE_TEXT_BY_LOCALE: Record<Locale, string> = {
  en: 'If the pattern persists for 3 more days or symptoms appear, contact the crew medical officer (CMO).',
  pt: 'Se o padrão persistir por mais 3 dias ou surgirem sintomas, acione o oficial médico da tripulação (CMO).',
};

export const DISCLAIMER_BY_LOCALE: Record<Locale, string> = {
  en: 'This system points out patterns in your own data; it does not diagnose and does not replace a medical evaluation.',
  pt: 'Este sistema indica padrões nos seus próprios dados; não faz diagnóstico nem substitui avaliação médica.',
};

export interface GuidanceTexts {
  restingHeartRate: { possibleCauseUp: string; possibleCauseDown: string; guidance: string };
  hrv: { possibleCause: string; guidance: string };
  bloodPressure: { possibleCause: string; guidance: string };
  sleep: { possibleCause: string; guidance: string };
  selfReport: { possibleCause: string; guidance: string };
  bodyMass: { possibleCause: string; guidance: string };
  exerciseLoad: { possibleCause: string; guidance: string };
  composite: { patternName: string; guidance: string };
  association: { guidance: string; guidanceCritical: string };
}

const P = PERSISTENCE_TEXT_BY_LOCALE;
const E = ESCALATION_TEXT_BY_LOCALE;

export const GUIDANCE_BY_LOCALE: Record<Locale, GuidanceTexts> = {
  en: {
    restingHeartRate: {
      possibleCauseUp: 'accumulated fatigue, insufficient sleep, stress or cardiovascular deconditioning',
      possibleCauseDown: 'measurement variation or training adaptation; worth confirming the reading',
      guidance: `Confirm the measurement tomorrow at rest, at the same time of day. Review sleep and workload over the last few days. ${P.en}`,
    },
    hrv: {
      possibleCause: 'increased autonomic load — stress, poor sleep, high workload or the onset of illness',
      guidance: `Prioritize the scheduled sleep period and cut non-essential activities if the schedule allows. ${P.en}`,
    },
    bloodPressure: {
      possibleCause: 'fluid redistribution in microgravity (headward fluid shift) or cardiovascular deconditioning',
      guidance: `Repeat the measurement at rest, seated and at the same time of day for 2 days. Keep up the prescribed hydration and aerobic exercise. ${P.en}`,
    },
    sleep: {
      possibleCause: 'circadian disruption, module noise/temperature or operational events during the sleep period',
      guidance: `Protect the scheduled sleep window: reduce light and screens before bed, use earplugs/eye mask and flag schedule conflicts to mission planning. ${P.en}`,
    },
    selfReport: {
      possibleCause: 'effects of isolation and confinement, workload or insufficient sleep',
      guidance: `Consider talking to the medical officer or scheduling the private psychological support conference with the ground. Breaks and contact with family help. ${P.en}`,
    },
    bodyMass: {
      possibleCause: 'muscle atrophy, caloric intake below requirements or fluid loss',
      guidance: `Review caloric and fluid intake over the last few days and adherence to resistance exercise. ${P.en}`,
    },
    exerciseLoad: {
      possibleCause: 'schedule conflicts, fatigue or equipment issues',
      guidance:
        'Exercise is the main countermeasure against muscle, bone and cardiovascular loss. Reschedule the missed sessions (ARED, T2/CEVIS) and flag to mission planning if the schedule cannot fit the prescription.',
    },
    composite: {
      patternName: 'overload',
      guidance: `Treat this as overload, not a single bad night: protect sleep for the next 3 nights, cut non-essential tasks and keep the prescribed exercise at moderate intensity. ${P.en}`,
    },
    association: {
      guidance:
        'Review adherence to the exercise protocol (especially resistance training on ARED) and caloric intake. Reschedule the missed sessions with mission planning.',
      guidanceCritical: `Review adherence to the exercise protocol (ARED, T2/CEVIS) and caloric and fluid intake. ${E.en}`,
    },
  },
  pt: {
    restingHeartRate: {
      possibleCauseUp: 'fadiga acumulada, sono insuficiente, estresse ou descondicionamento cardiovascular',
      possibleCauseDown: 'variação de medição ou adaptação ao treino; vale confirmar a leitura',
      guidance: `Confirme a medição amanhã em repouso, no mesmo horário. Revise sono e carga de trabalho dos últimos dias. ${P.pt}`,
    },
    hrv: {
      possibleCause: 'aumento de carga autonômica — estresse, sono ruim, carga de trabalho alta ou início de doença',
      guidance: `Priorize o período de sono agendado e reduza atividades não essenciais se a escala permitir. ${P.pt}`,
    },
    bloodPressure: {
      possibleCause: 'redistribuição de fluidos em microgravidade (deslocamento cefálico) ou descondicionamento cardiovascular',
      guidance: `Repita a medição em repouso, sentado e no mesmo horário por 2 dias. Mantenha hidratação e exercício aeróbico prescritos. ${P.pt}`,
    },
    sleep: {
      possibleCause: 'ruptura circadiana, ruído/temperatura do módulo ou eventos operacionais no período de sono',
      guidance: `Proteja a janela de sono agendada: reduza luz e telas antes de dormir, use protetor auricular/máscara e sinalize ao planejamento conflitos de agenda. ${P.pt}`,
    },
    selfReport: {
      possibleCause: 'efeitos de isolamento e confinamento, carga de trabalho ou sono insuficiente',
      guidance: `Considere conversar com o oficial médico ou agendar a conferência privada de apoio psicológico com a Terra. Pausas e contato com a família ajudam. ${P.pt}`,
    },
    bodyMass: {
      possibleCause: 'atrofia muscular, ingestão calórica abaixo do necessário ou perda de fluidos',
      guidance: `Revise ingestão calórica e hídrica dos últimos dias e a aderência ao exercício resistido. ${P.pt}`,
    },
    exerciseLoad: {
      possibleCause: 'conflito de agenda, fadiga ou problema de equipamento',
      guidance:
        'A carga de exercício é a principal contramedida contra perda muscular, óssea e cardiovascular. Reagende as sessões perdidas (ARED, T2/CEVIS) e sinalize ao planejamento se a agenda não comportar a prescrição.',
    },
    composite: {
      patternName: 'sobrecarga',
      guidance: `Trate como sobrecarga, não como uma noite ruim: proteja o sono nas próximas 3 noites, reduza tarefas não essenciais e mantenha o exercício prescrito em intensidade moderada. ${P.pt}`,
    },
    association: {
      guidance:
        'Revise a aderência ao protocolo de exercício (em especial resistido no ARED) e a ingestão calórica. Reagende as sessões perdidas com o planejamento da missão.',
      guidanceCritical: `Revise a aderência ao protocolo de exercício (ARED, T2/CEVIS) e a ingestão calórica e hídrica. ${E.pt}`,
    },
  },
};

export const guidanceFor = (locale: Locale): GuidanceTexts => GUIDANCE_BY_LOCALE[locale];

// Exports em inglês, compatíveis com o código existente.
export const ESCALATION_TEXT = ESCALATION_TEXT_BY_LOCALE.en;
export const PERSISTENCE_TEXT = PERSISTENCE_TEXT_BY_LOCALE.en;
export const DISCLAIMER = DISCLAIMER_BY_LOCALE.en;
export const GUIDANCE = GUIDANCE_BY_LOCALE.en;
