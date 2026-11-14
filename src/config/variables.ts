// Display metadata and explanatory copy for the 7 variables (section 4).
// UI copy only; no alert threshold lives here — thresholds belong to the engine (Bloco A).

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
  /** How to collect in flight: equipment, conditions and frequency. */
  howToMeasure: { equipment: string; conditions: string; frequency: string };
  sourceIds: string[];
}

export const CLASS_LABEL: Record<VariableClass, string> = {
  signal: 'Signal',
  accumulator: 'Accumulator',
  countermeasure: 'Countermeasure',
};

export const CLASS_ROLE: Record<VariableClass, string> = {
  signal: 'Collect → interpret',
  accumulator: 'Long-term consequence',
  countermeasure: 'Guide — closes the loop',
};

export const HAZARD_LABEL: Record<Hazard, string> = {
  radiation: 'Space radiation',
  isolation: 'Isolation and confinement',
  distance: 'Distance from Earth',
  gravity: 'Altered gravity',
  environment: 'Hostile, closed environments',
};

export const VARIABLES: Record<VariableId, VariableMeta> = {
  restingHeartRate: {
    id: 'restingHeartRate',
    label: 'Resting HR',
    unit: 'bpm',
    decimals: 0,
    varClass: 'signal',
    hazards: ['gravity'],
    nasaRisk: 'Cardiovascular deconditioning',
    timeConstant: 'Days',
    ruleSummary: 'Deviation > 1.5 SD from the pre-flight baseline for 3 consecutive days',
    whatItMeasures: 'Beats per minute at rest, measured on waking.',
    whyItMatters:
      'In microgravity the heart works against less load and fluids shift. A persistent rise above the individual baseline may indicate deconditioning, stress or insufficient sleep.',
    howToMeasure: {
      equipment: 'Wearable heart monitor (chest strap or sensor shirt) or finger pulse oximeter.',
      conditions: 'On waking, still in the sleeping bag, before coffee, talking or exercise. Stay still for 1 minute and log the average value.',
      frequency: 'Once a day, always at the same onboard time.',
    },
    sourceIds: ['nasa-hrp-hazards', 'nasa-hrp-risks'],
  },
  hrv: {
    id: 'hrv',
    label: 'Heart rate variability (HRV)',
    unit: 'ms',
    decimals: 1,
    varClass: 'signal',
    hazards: ['isolation', 'environment'],
    nasaRisk: 'Autonomic load, behavioral health',
    timeConstant: 'Days',
    ruleSummary: 'Drop > 20% from the pre-flight baseline mean for 3 days',
    whatItMeasures: 'RMSSD: the variation between successive heartbeats, reflecting autonomic nervous system balance.',
    whyItMatters:
      'A sustained drop in HRV often accompanies stress, fatigue and poor sleep. It is one of the fastest signs of overload.',
    howToMeasure: {
      equipment: 'ECG chest strap, which records the interval between beats (a wrist watch is less accurate).',
      conditions: 'Together with resting HR: on waking, still, breathing naturally, a 2- to 5-minute recording in the same position every day. The logged value is RMSSD in ms.',
      frequency: 'Once a day, together with resting HR.',
    },
    sourceIds: ['nasa-hrp-risks', 'nasa-hrp-research'],
  },
  bloodPressure: {
    id: 'bloodPressure',
    label: 'Blood pressure',
    unit: 'mmHg',
    secondaryLabel: 'Diastolic',
    secondaryUnit: 'mmHg',
    decimals: 0,
    varClass: 'signal',
    hazards: ['gravity'],
    nasaRisk: 'Headward fluid shift',
    timeConstant: 'Weeks',
    ruleSummary: 'Systematic deviation from the individual baseline for 5 days (no clinical cutoff)',
    whatItMeasures: 'Systolic / diastolic pressure.',
    whyItMatters:
      'Without gravity, fluids shift toward the head. The relevant signal is drift from one’s own baseline — a healthy astronaut rarely crosses the clinical hypertension cutoff.',
    howToMeasure: {
      equipment: 'Automatic upper-arm cuff monitor from the onboard medical kit.',
      conditions: 'After 5 minutes of rest. In microgravity there is no “sitting”: keep your body stable (feet in the foot restraints or held by a strap), arm relaxed and supported at heart level, without talking. Take 2 readings 1 minute apart and log the average.',
      frequency: 'Once a day at the same time; twice a day while a blood pressure alert is active.',
    },
    sourceIds: ['nasa-hrp-hazards', 'nasa-hrp-risks'],
  },
  sleep: {
    id: 'sleep',
    label: 'Sleep',
    unit: 'h',
    secondaryLabel: 'Quality (1–5)',
    secondaryUnit: '/5',
    decimals: 1,
    varClass: 'signal',
    hazards: ['isolation', 'environment'],
    nasaRisk: 'Circadian disruption, closed environment',
    timeConstant: 'Days',
    ruleSummary: 'Accumulated deficit vs. prescribed sleep above threshold over a 7-day window',
    whatItMeasures: 'Hours slept per night and perceived quality (1 to 5).',
    whyItMatters:
      'In low Earth orbit the light–dark cycle repeats about 16 times in 24 h; noise, light and confinement disturb the circadian rhythm. Sleep deficit degrades performance and mood.',
    howToMeasure: {
      equipment: 'Wrist actigraph for hours slept; quality (1 to 5) is your own rating.',
      conditions: 'Log on waking, counting only the time in the sleeping bag. In orbit the light–dark cycle repeats about 16 times in 24 h: always use onboard time (GMT).',
      frequency: 'Once a day, on waking.',
    },
    sourceIds: ['nasa-hrp-hazards', 'nasa-hrp-risks'],
  },
  selfReport: {
    id: 'selfReport',
    label: 'Self-report',
    unit: '/5',
    decimals: 1,
    varClass: 'signal',
    hazards: ['isolation', 'distance'],
    nasaRisk: 'Isolation and confinement',
    timeConstant: 'Days',
    ruleSummary: 'Downward trend over a 5-day moving window',
    whatItMeasures: 'Mood, stress and fatigue on a 1 to 5 scale, filled in by the astronaut.',
    whyItMatters:
      'Isolation, confinement and distance from Earth affect behavioral health. Self-report captures what sensors do not measure.',
    howToMeasure: {
      equipment: 'No equipment: just this form.',
      conditions: 'Answer on your own and without overthinking, always at the same time of day (for example, before sleep).',
      frequency: 'Once a day.',
    },
    sourceIds: ['nasa-hrp-hazards', 'nasa-hrp-risks'],
  },
  bodyMass: {
    id: 'bodyMass',
    label: 'Body mass',
    unit: 'kg',
    decimals: 1,
    varClass: 'accumulator',
    hazards: ['gravity'],
    nasaRisk: 'Muscle atrophy, fluid loss',
    timeConstant: 'Weeks',
    ruleSummary: '%Δ from the pre-flight baseline above threshold',
    whatItMeasures: 'Mass in kg and percent change since pre-flight.',
    whyItMatters:
      'Muscle and fluid loss build up over weeks. Body mass integrates these effects and shows the long-term consequence.',
    howToMeasure: {
      equipment: 'Scales do not work in microgravity. Mass is measured by a linear acceleration device (on the ISS, SLAMMD), which applies a known force and measures the body’s acceleration.',
      conditions: 'Light clothing and empty pockets, before the first meal, body still during the measurement, following the device procedure.',
      frequency: '1 to 3 times a week: mass changes over weeks, not days.',
    },
    sourceIds: ['nasa-hrp-hazards', 'nasa-hrp-risks'],
  },
  exerciseLoad: {
    id: 'exerciseLoad',
    label: 'Exercise load',
    unit: 'min',
    secondaryLabel: 'Prescribed',
    secondaryUnit: 'min',
    decimals: 0,
    varClass: 'countermeasure',
    hazards: ['gravity'],
    nasaRisk: 'Countermeasure for muscle and cardiovascular loss',
    timeConstant: 'Daily, cumulative',
    ruleSummary: 'Adherence (completed ÷ prescribed) < 80% over 7 days',
    whatItMeasures: 'Exercise minutes completed versus prescribed (aerobic and resistance).',
    whyItMatters:
      'Daily exercise — treadmill, cycle ergometer and the ARED resistance device on the ISS — is the main countermeasure against muscle, bone and cardiovascular loss.',
    howToMeasure: {
      equipment: 'Exercise device logs: resistance (on the ISS, ARED) and aerobic (T2 treadmill and CEVIS cycle ergometer).',
      conditions: 'At the end of the day, log the minutes completed and the minutes prescribed for the day.',
      frequency: 'Daily.',
    },
    sourceIds: ['nasa-hrp-risks', 'nasa-hrp-research'],
  },
};
