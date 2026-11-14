/**
 * Gerador de dados SINTÉTICOS (spec §9.3–9.4) — determinístico (seed fixa).
 * Produz 120 dias × 7 variáveis para os três cenários de demo e grava em
 * src/data/scenarios/*.json. Toda medição sai com origin: 'synthetic'.
 *
 * Faixas: valores ilustrativos de adulto saudável, NÃO derivados de telemetria
 * de astronauta (não encontrada; ver docs/busca-de-dados.md). Prescrições de
 * sono e exercício vêm de src/engine/config/thresholds.ts (com fontes).
 *
 * Uso: npm run generate
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluate, ruleIdOf } from '../src/engine';
import { EXPECTED_UNITS, RULES } from '../src/engine/config/thresholds';
import type { Measurement, Severity, VariableId } from '../src/types/contract';
import type { ScenarioFile } from '../src/types/scenario';

const GENERATOR_VERSION = '1.0.0';
const DAYS = 120;
const PREFLIGHT_DAYS = 7;
const START = Date.UTC(2026, 6, 1); // 2026-07-01
const DAY_MS = 86_400_000;
/** Últimas 3 semanas: janela das histórias dos cenários 2 e 3. */
const STORY_START = DAYS - 21;

/** Perfil base do astronauta sintético (média, ruído diário). */
const BASE = {
  restingHeartRate: { mean: 58, sd: 2.0 },
  hrv: { mean: 55, sd: 5.0 },
  systolic: { mean: 118, sd: 3.5 },
  diastolic: { mean: 76, sd: 2.5 },
  sleepHours: { mean: 7.5, sd: 0.35 },
  sleepQuality: { mean: 4.0, sd: 0.5 },
  wellbeing: { mean: 4.0, sd: 0.2 },
  bodyMass: { mean: 75.0, sd: 0.2 },
  adherence: { mean: 0.96, sd: 0.04 },
};

/** Desvios aplicados pela história do cenário no dia i (0 = sem desvio). */
interface Drift {
  sleepHours?: number;
  hrv?: number;
  restingHeartRate?: number;
  systolic?: number;
  diastolic?: number;
  wellbeing?: number;
  bodyMassPct?: number;
  adherence?: number; // substitui a média de aderência
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rand: () => number) {
  const u = Math.max(rand(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const r1 = (x: number) => Math.round(x * 10) / 10;
/** Rampa linear 0→1 entre os dias a e b. */
const ramp = (i: number, a: number, b: number) => clamp((i - a) / (b - a), 0, 1);

function generate(scenarioId: string, astronautId: string, seed: number, drift: (i: number) => Drift): Measurement[] {
  const rand = mulberry32(seed);
  const n = () => gaussian(rand);
  const out: Measurement[] = [];
  const add = (i: number, hourUtc: number, variable: VariableId, value: number, method: string, secondaryValue?: number) => {
    out.push({
      id: `${scenarioId}-${variable}-${method.replace(/[^a-z]/gi, '')}-${i}`,
      astronautId,
      variable,
      value,
      ...(secondaryValue !== undefined ? { secondaryValue } : {}),
      unit: EXPECTED_UNITS[variable],
      timestamp: new Date(START + i * DAY_MS + hourUtc * 3_600_000).toISOString(),
      origin: 'synthetic',
      method,
    });
  };

  for (let i = 0; i < DAYS; i++) {
    const d = drift(i);
    const inFlight = i >= PREFLIGHT_DAYS;

    add(i, 6.0, 'sleep', r1(clamp(BASE.sleepHours.mean + (d.sleepHours ?? 0) + n() * BASE.sleepHours.sd, 3, 10)), 'wearable-actigraphy',
      Math.round(clamp(BASE.sleepQuality.mean + (d.sleepHours ?? 0) * 0.6 + n() * BASE.sleepQuality.sd, 1, 5)));
    add(i, 6.25, 'restingHeartRate', Math.round(BASE.restingHeartRate.mean + (d.restingHeartRate ?? 0) + n() * BASE.restingHeartRate.sd), 'wearable');
    add(i, 6.25, 'hrv', r1(clamp(BASE.hrv.mean + (d.hrv ?? 0) + n() * BASE.hrv.sd, 10, 200)), 'wearable');
    add(i, 7.0, 'bloodPressure',
      Math.round(BASE.systolic.mean + (d.systolic ?? 0) + n() * BASE.systolic.sd), 'cuff-manual',
      Math.round(BASE.diastolic.mean + (d.diastolic ?? 0) + n() * BASE.diastolic.sd));

    // Massa: diária no pré-voo; a cada 3 dias em voo (dispositivo de medição de massa).
    if (!inFlight || i % 3 === 0) {
      const m = BASE.bodyMass.mean * (1 + (d.bodyMassPct ?? 0) / 100) + n() * BASE.bodyMass.sd;
      add(i, 7.5, 'bodyMass', Math.round(m * 100) / 100, inFlight ? 'mass-measurement-device' : 'scale');
    }

    // Exercício: prescrição de RULES.exerciseLoad, 1 dia de descanso por semana.
    const prescribed = i % 7 === 6 ? 0 : RULES.exerciseLoad.prescribedMinutesPerDay;
    const ratio = clamp((d.adherence ?? BASE.adherence.mean) + n() * (d.adherence !== undefined ? 0.1 : BASE.adherence.sd), 0, 1);
    add(i, 18, 'exerciseLoad', Math.round((prescribed * ratio) / 5) * 5, 'exercise-log', prescribed);

    // Autorrelato: humor, estresse e fadiga (1–5) a partir de um bem-estar latente.
    const w = BASE.wellbeing.mean + (d.wellbeing ?? 0) + n() * BASE.wellbeing.sd;
    const likert = (x: number) => Math.round(clamp(x + n() * 0.35, 1, 5));
    add(i, 21, 'selfReport', likert(w), 'self-report:mood');
    add(i, 21, 'selfReport', likert(6 - w), 'self-report:stress');
    add(i, 21, 'selfReport', likert(6 - w), 'self-report:fatigue');
  }
  return out;
}

const ASTRONAUT = { astronautId: 'AST-01', name: 'Astronaut A (fictional)' };
const iso = (i: number, h = 0) => new Date(START + i * DAY_MS + h * 3_600_000).toISOString();
const NOTE =
  'SYNTHETIC data generated by scripts/generate-scenarios.ts. Illustrative healthy-adult ranges; not astronaut telemetry.';

interface Def {
  id: string;
  seed: number;
  title: string;
  description: string;
  storyline: string[];
  expected: { overall: Severity; ruleIds: string[] };
  drift: (i: number) => Drift;
}

const DEFS: Def[] = [
  {
    id: 'nominal',
    seed: 20261114,
    title: 'Scenario 1 — Nominal',
    description:
      'All signals within the baseline range, exercise adherence above 90% and stable mass. Shows the system does not raise alarms without reason.',
    storyline: [
      '113 flight days with no systematic deviation.',
      'Normal day-to-day noise raises no alert: zero false positives on every mission day.',
    ],
    expected: { overall: 'normal', ruleIds: [] },
    drift: () => ({}),
  },
  {
    id: 'gradual-degradation',
    seed: 20261115,
    title: 'Scenario 2 — Gradual degradation',
    description:
      'Three weeks of shrinking sleep, falling HRV and rising resting heart rate; blood pressure and mass stable. The composite rule recognizes the overload pattern.',
    storyline: [
      'Week 1: slightly shorter nights, HRV and heart rate fluctuating; no alert — no single signal justifies one.',
      'Around day 10–14: sleep, HRV and heart rate shift together in the same window — the composite rule names the pattern as overload.',
      'End of week 3: self-reported well-being also drops (mood ↓, stress and fatigue ↑).',
      'Blood pressure and mass remain stable: the alert comes from the fast cluster, not from deconditioning.',
    ],
    expected: { overall: 'attention', ruleIds: ['fast-cluster-overload'] },
    drift: (i) => {
      const k = ramp(i, STORY_START, DAYS - 1);
      return { sleepHours: -1.7 * k, hrv: -9 * k, restingHeartRate: 3.5 * k, wellbeing: -0.6 * k };
    },
  },
  {
    id: 'critical-countermeasure',
    seed: 20261116,
    title: 'Scenario 3 — Critical with countermeasure',
    description:
      'Exercise adherence at ~61% for three weeks, body mass down ~2% and blood pressure drifting from the individual baseline. Critical state with escalation.',
    storyline: [
      'Week 1: missed exercise sessions — adherence alert.',
      'Weeks 2–3: body mass drops; systolic pressure drifts from the individual pattern.',
      'End of week 3: mass ≈ −2% and adherence ≈ 61% in the same window — the system ASSOCIATES the two (without claiming causation).',
      'With blood pressure also deviating, the state turns critical and advises contacting the medical officer.',
    ],
    expected: { overall: 'critical', ruleIds: ['mass-exercise-association'] },
    drift: (i) => {
      const inStory = i >= STORY_START;
      return {
        adherence: inStory ? 0.61 : undefined,
        bodyMassPct: -2.6 * ramp(i, STORY_START, DAYS - 1),
        systolic: -14 * ramp(i, STORY_START + 4, DAYS - 1),
        diastolic: -6 * ramp(i, STORY_START + 4, DAYS - 1),
      };
    },
  },
];

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'src', 'data', 'scenarios');
mkdirSync(outDir, { recursive: true });

for (const def of DEFS) {
  const measurements = generate(def.id, ASTRONAUT.astronautId, def.seed, def.drift);
  const scenario: ScenarioFile = {
    id: def.id,
    title: def.title,
    description: def.description,
    storyline: def.storyline,
    profile: ASTRONAUT,
    launchDate: iso(PREFLIGHT_DAYS),
    asOf: iso(DAYS - 1, 23.999),
    generator: { seed: def.seed, version: GENERATOR_VERSION, days: DAYS, note: NOTE },
    expected: def.expected,
    measurements,
  };
  writeFileSync(join(outDir, `${def.id}.json`), JSON.stringify(scenario, null, 1) + '\n');

  // Relatório: severidade e alertas dia a dia nas últimas 4 semanas.
  console.log(`\n=== ${def.title} (${measurements.length} medições) ===`);
  let prev = '';
  for (let i = PREFLIGHT_DAYS; i < DAYS; i++) {
    const s = evaluate(measurements, ASTRONAUT.astronautId, iso(i, 23.999), ASTRONAUT);
    const line = `${s.overall.padEnd(9)} ${s.alerts.map(ruleIdOf).join(', ')}`;
    if (line !== prev) console.log(`dia de missão ${String(s.missionDay).padStart(3)} (story d${i - STORY_START + 1}): ${line}`);
    prev = line;
  }
}
