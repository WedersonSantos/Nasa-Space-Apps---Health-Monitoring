/**
 * Guidance texts (UI in English, required by Space Apps 2026), kept out of the logic code.
 * Clinical safety rule (spec §7.4): language of possibility, never a
 * diagnosis; say explicitly when to contact the crew medical officer.
 */

export const ESCALATION_TEXT =
  'Contact the crew medical officer (CMO) now and log the case for ground control at the next communication window.';

export const PERSISTENCE_TEXT =
  'If the pattern persists for 3 more days or symptoms appear, contact the crew medical officer (CMO).';

export const DISCLAIMER =
  'This system points out patterns in your own data; it does not diagnose and does not replace a medical evaluation.';

export const GUIDANCE = {
  restingHeartRate: {
    possibleCauseUp: 'accumulated fatigue, insufficient sleep, stress or cardiovascular deconditioning',
    possibleCauseDown: 'measurement variation or training adaptation; worth confirming the reading',
    guidance: `Confirm the measurement tomorrow at rest, at the same time of day. Review sleep and workload over the last few days. ${PERSISTENCE_TEXT}`,
  },
  hrv: {
    possibleCause: 'increased autonomic load — stress, poor sleep, high workload or the onset of illness',
    guidance: `Prioritize the scheduled sleep period and cut non-essential activities if the schedule allows. ${PERSISTENCE_TEXT}`,
  },
  bloodPressure: {
    possibleCause: 'fluid redistribution in microgravity (headward fluid shift) or cardiovascular deconditioning',
    guidance: `Repeat the measurement at rest, seated and at the same time of day for 2 days. Keep up the prescribed hydration and aerobic exercise. ${PERSISTENCE_TEXT}`,
  },
  sleep: {
    possibleCause: 'circadian disruption, module noise/temperature or operational events during the sleep period',
    guidance: `Protect the scheduled sleep window: reduce light and screens before bed, use earplugs/eye mask and flag schedule conflicts to mission planning. ${PERSISTENCE_TEXT}`,
  },
  selfReport: {
    possibleCause: 'effects of isolation and confinement, workload or insufficient sleep',
    guidance: `Consider talking to the medical officer or scheduling the private psychological support conference with the ground. Breaks and contact with family help. ${PERSISTENCE_TEXT}`,
  },
  bodyMass: {
    possibleCause: 'muscle atrophy, caloric intake below requirements or fluid loss',
    guidance: `Review caloric and fluid intake over the last few days and adherence to resistance exercise. ${PERSISTENCE_TEXT}`,
  },
  exerciseLoad: {
    possibleCause: 'schedule conflicts, fatigue or equipment issues',
    guidance:
      'Exercise is the main countermeasure against muscle, bone and cardiovascular loss. Reschedule the missed sessions (ARED, T2/CEVIS) and flag to mission planning if the schedule cannot fit the prescription.',
  },
  composite: {
    patternName: 'overload',
    guidance: `Treat this as overload, not a single bad night: protect sleep for the next 3 nights, cut non-essential tasks and keep the prescribed exercise at moderate intensity. ${PERSISTENCE_TEXT}`,
  },
  association: {
    guidance:
      'Review adherence to the exercise protocol (especially resistance training on ARED) and caloric intake. Reschedule the missed sessions with mission planning.',
    guidanceCritical: `Review adherence to the exercise protocol (ARED, T2/CEVIS) and caloric and fluid intake. ${ESCALATION_TEXT}`,
  },
} as const;
