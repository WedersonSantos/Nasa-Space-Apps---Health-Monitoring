/**
 * Textos de orientação (interface em português), fora do código de lógica.
 * Regra de segurança clínica (spec §7.4): linguagem de possibilidade, nunca
 * diagnóstico; indicar explicitamente quando acionar o oficial médico.
 */

export const ESCALATION_TEXT =
  'Acione o oficial médico da tripulação (CMO) agora e registre o caso para o controle em Terra na próxima janela de comunicação.';

export const PERSISTENCE_TEXT =
  'Se o padrão persistir por mais 3 dias ou surgirem sintomas, acione o oficial médico da tripulação (CMO).';

export const DISCLAIMER =
  'Este sistema indica padrões nos seus próprios dados; não faz diagnóstico nem substitui avaliação médica.';

export const GUIDANCE = {
  restingHeartRate: {
    possibleCauseUp: 'fadiga acumulada, sono insuficiente, estresse ou descondicionamento cardiovascular',
    possibleCauseDown: 'variação de medição ou adaptação ao treino; vale confirmar a leitura',
    guidance: `Confirme a medição amanhã em repouso, no mesmo horário. Revise sono e carga de trabalho dos últimos dias. ${PERSISTENCE_TEXT}`,
  },
  hrv: {
    possibleCause: 'aumento de carga autonômica — estresse, sono ruim, carga de trabalho alta ou início de doença',
    guidance: `Priorize o período de sono agendado e reduza atividades não essenciais se a escala permitir. ${PERSISTENCE_TEXT}`,
  },
  bloodPressure: {
    possibleCause: 'redistribuição de fluidos em microgravidade (deslocamento cefálico) ou descondicionamento cardiovascular',
    guidance: `Repita a medição em repouso, sentado e no mesmo horário por 2 dias. Mantenha hidratação e exercício aeróbico prescritos. ${PERSISTENCE_TEXT}`,
  },
  sleep: {
    possibleCause: 'ruptura circadiana, ruído/temperatura do módulo ou eventos operacionais no período de sono',
    guidance: `Proteja a janela de sono agendada: reduza luz e telas antes de dormir, use protetor auricular/máscara e sinalize ao planejamento conflitos de agenda. ${PERSISTENCE_TEXT}`,
  },
  selfReport: {
    possibleCause: 'efeitos de isolamento e confinamento, carga de trabalho ou sono insuficiente',
    guidance: `Considere conversar com o oficial médico ou agendar a conferência privada de apoio psicológico com a Terra. Pausas e contato com a família ajudam. ${PERSISTENCE_TEXT}`,
  },
  bodyMass: {
    possibleCause: 'atrofia muscular, ingestão calórica abaixo do necessário ou perda de fluidos',
    guidance: `Revise ingestão calórica e hídrica dos últimos dias e a aderência ao exercício resistido. ${PERSISTENCE_TEXT}`,
  },
  exerciseLoad: {
    possibleCause: 'conflito de agenda, fadiga ou problema de equipamento',
    guidance:
      'A carga de exercício é a principal contramedida contra perda muscular, óssea e cardiovascular. Reagende as sessões perdidas (ARED, T2/CEVIS) e sinalize ao planejamento se a agenda não comportar a prescrição.',
  },
  composite: {
    patternName: 'sobrecarga',
    guidance: `Trate como sobrecarga, não como uma noite ruim: proteja o sono nas próximas 3 noites, reduza tarefas não essenciais e mantenha o exercício prescrito em intensidade moderada. ${PERSISTENCE_TEXT}`,
  },
  association: {
    guidance:
      'Revise a aderência ao protocolo de exercício (em especial resistido no ARED) e a ingestão calórica. Reagende as sessões perdidas com o planejamento da missão.',
    guidanceCritical: `Revise a aderência ao protocolo de exercício (ARED, T2/CEVIS) e a ingestão calórica e hídrica. ${ESCALATION_TEXT}`,
  },
} as const;
