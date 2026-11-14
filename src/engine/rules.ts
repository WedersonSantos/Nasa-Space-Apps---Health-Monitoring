/**
 * Regras determinísticas. Regra de ouro (spec §5): nenhum alerta existe sem
 * uma operação aritmética sobre números registrados, e a operação aparece no
 * texto do alerta (`arithmetic`). Cada regra é uma função pura do contexto em
 * um dia; o motor a chama no dia de avaliação e, para achar o início do
 * alerta, nos dias anteriores.
 */
import type { Baseline, Evidence, Severity, VariableId } from '../types/contract';
import { GUIDANCE } from './config/guidance';
import { sourceRefFor } from './config/sources';
import { RULES } from './config/thresholds';
import { consecutivePoints, pointsInWindow, streakLength, type DailyPoint, type DailySeries } from './series';
import { dayNumber, dayToShort, fmt, mean, pct, round, signed } from './util';

export type RuleId =
  | 'rhr-deviation'
  | 'hrv-drop'
  | 'bp-deviation'
  | 'sleep-deficit'
  | 'selfreport-decline'
  | 'mass-loss'
  | 'exercise-adherence'
  | 'fast-cluster-overload'
  | 'mass-exercise-association';

export interface RuleContext {
  series: DailySeries;
  preflight: Partial<Record<VariableId, Baseline>>;
  /** Dia (número de dia UTC) em que a regra é avaliada. */
  day: number;
}

export interface RuleHit {
  ruleId: RuleId;
  severity: Severity;
  variables: VariableId[];
  title: string;
  explanation: string;
  arithmetic: string;
  evidence: Evidence[];
  guidance: string;
  sourceRef: string;
  escalate: boolean;
}

export type Rule = (ctx: RuleContext) => RuleHit | null;

/** '[baseline pré-voo 01/07–07/07]' — todo alerta declara o baseline usado. */
function baselineTag(b: Baseline): string {
  return `[preflight baseline ${dayToShort(dayNumber(b.windowStart))}–${dayToShort(dayNumber(b.windowEnd))}]`;
}

const last = <T>(xs: T[]): T => xs[xs.length - 1];

// ---------------------------------------------------------------------------
// 1. FC de repouso — desvio > 1,5 DP do pré-voo por 3 dias consecutivos
// ---------------------------------------------------------------------------
export const restingHeartRateRule: Rule = (ctx) => {
  const cfg = RULES.restingHeartRate;
  const b = ctx.preflight.restingHeartRate;
  if (!b) return null;
  const s = ctx.series.restingHeartRate;
  const pts = consecutivePoints(s, ctx.day, cfg.consecutiveDays);
  if (!pts) return null;
  const sd = Math.max(b.stdDev, cfg.sdFloor);
  const z = (p: DailyPoint) => (p.value - b.mean) / sd;
  const dir = pts.every((p) => z(p) > cfg.zThreshold) ? 1 : pts.every((p) => z(p) < -cfg.zThreshold) ? -1 : 0;
  if (dir === 0) return null;

  const streak = streakLength(s, ctx.day, (p) => dir * z(p) > cfg.zThreshold);
  const cur = last(pts);
  const word = dir > 0 ? 'above' : 'below';
  return {
    ruleId: 'rhr-deviation',
    severity: 'attention',
    variables: ['restingHeartRate'],
    title: `Resting heart rate ${word} your baseline`,
    explanation:
      `Your resting heart rate has been ${word} your preflight baseline for ${streak} consecutive days ` +
      `(${fmt(cur.value, 0)} bpm today vs. a mean of ${fmt(b.mean)} bpm). This may be related to ` +
      `${dir > 0 ? GUIDANCE.restingHeartRate.possibleCauseUp : GUIDANCE.restingHeartRate.possibleCauseDown}.`,
    arithmetic:
      `z = (HR − mean) / SD = (${fmt(cur.value, 0)} − ${fmt(b.mean)}) / ${fmt(sd)} = ${signed(z(cur))}; ` +
      `|z| > ${fmt(cfg.zThreshold)} on ${streak} consecutive days (minimum ${cfg.consecutiveDays}) ${baselineTag(b)}`,
    evidence: [
      { label: 'Current resting HR', value: round(cur.value), unit: 'bpm', comparedTo: round(b.mean) },
      { label: 'Deviation (z)', value: round(z(cur), 2), unit: 'SD', comparedTo: dir * cfg.zThreshold },
      { label: 'Consecutive days deviating', value: streak, unit: 'days', comparedTo: cfg.consecutiveDays },
    ],
    guidance: GUIDANCE.restingHeartRate.guidance,
    sourceRef: sourceRefFor(['NASA_HRP_RISKS'], true),
    escalate: false,
  };
};

// ---------------------------------------------------------------------------
// 2. HRV — queda > 20% da média pré-voo por 3 dias consecutivos
// ---------------------------------------------------------------------------
export const hrvRule: Rule = (ctx) => {
  const cfg = RULES.hrv;
  const b = ctx.preflight.hrv;
  if (!b || b.mean <= 0) return null;
  const s = ctx.series.hrv;
  const pts = consecutivePoints(s, ctx.day, cfg.consecutiveDays);
  if (!pts) return null;
  const drop = (p: DailyPoint) => (b.mean - p.value) / b.mean;
  if (!pts.every((p) => drop(p) > cfg.dropFraction)) return null;

  const streak = streakLength(s, ctx.day, (p) => drop(p) > cfg.dropFraction);
  const cur = last(pts);
  return {
    ruleId: 'hrv-drop',
    severity: 'attention',
    variables: ['hrv'],
    title: 'HRV below your baseline',
    explanation:
      `Your heart rate variability (RMSSD) has been ${pct(drop(cur))} below your preflight mean ` +
      `for ${streak} consecutive days. This may indicate ${GUIDANCE.hrv.possibleCause}.`,
    arithmetic:
      `drop = (mean − HRV) / mean = (${fmt(b.mean)} − ${fmt(cur.value)}) / ${fmt(b.mean)} = ${pct(drop(cur), 1)}; ` +
      `> ${pct(cfg.dropFraction)} on ${streak} consecutive days (minimum ${cfg.consecutiveDays}) ${baselineTag(b)}`,
    evidence: [
      { label: 'Current HRV', value: round(cur.value), unit: 'ms', comparedTo: round(b.mean) },
      { label: 'Drop vs. preflight', value: round(drop(cur) * 100), unit: '%', comparedTo: cfg.dropFraction * 100 },
      { label: 'Consecutive days below', value: streak, unit: 'days', comparedTo: cfg.consecutiveDays },
    ],
    guidance: GUIDANCE.hrv.guidance,
    sourceRef: sourceRefFor(['NASA_HRP_RISKS', 'NASA_HRR_SLEEP'], true),
    escalate: false,
  };
};

// ---------------------------------------------------------------------------
// 3. Pressão arterial — desvio sistemático do baseline individual por 5 dias
// ---------------------------------------------------------------------------
export const bloodPressureRule: Rule = (ctx) => {
  const cfg = RULES.bloodPressure;
  const b = ctx.preflight.bloodPressure;
  if (!b) return null;
  const s = ctx.series.bloodPressure;
  const pts = consecutivePoints(s, ctx.day, cfg.consecutiveDays);
  if (!pts) return null;
  const sd = Math.max(b.stdDev, cfg.sdFloor);
  const limit = cfg.zThreshold * sd;
  const dev = (p: DailyPoint) => p.value - b.mean;
  const dir = pts.every((p) => dev(p) > limit) ? 1 : pts.every((p) => dev(p) < -limit) ? -1 : 0;
  if (dir === 0) return null;

  const streak = streakLength(s, ctx.day, (p) => dir * dev(p) > limit);
  const meanDev = mean(pts.map(dev));
  const cur = last(pts);
  const word = dir > 0 ? 'above' : 'below';
  return {
    ruleId: 'bp-deviation',
    severity: 'attention',
    variables: ['bloodPressure'],
    title: `Blood pressure ${word} your individual pattern`,
    explanation:
      `Your systolic pressure has been consistently ${word} your preflight baseline for ${streak} days ` +
      `(${fmt(cur.value, 0)}/${fmt(cur.secondaryValue ?? 0, 0)} mmHg today vs. a mean of ${fmt(b.mean)} mmHg). ` +
      `The value may still be within the normal clinical range; what matters is the shift away from your own pattern, ` +
      `which may be related to ${GUIDANCE.bloodPressure.possibleCause}.`,
    arithmetic:
      `mean systolic Δ (${cfg.consecutiveDays} days) = ${fmt(mean(pts.map((p) => p.value)))} − ${fmt(b.mean)} = ` +
      `${signed(meanDev)} mmHg; all ${cfg.consecutiveDays} days beyond ${dir > 0 ? '+' : '−'}${fmt(cfg.zThreshold)} SD ` +
      `(${dir > 0 ? '+' : '−'}${fmt(limit)} mmHg) ${baselineTag(b)}`,
    evidence: [
      { label: 'Current systolic', value: round(cur.value), unit: 'mmHg', comparedTo: round(b.mean) },
      { label: 'Current diastolic', value: round(cur.secondaryValue ?? 0), unit: 'mmHg' },
      { label: `Mean deviation (${cfg.consecutiveDays} days)`, value: round(meanDev), unit: 'mmHg', comparedTo: round(dir * limit) },
      { label: 'Consecutive days deviating', value: streak, unit: 'days', comparedTo: cfg.consecutiveDays },
    ],
    guidance: GUIDANCE.bloodPressure.guidance,
    sourceRef: sourceRefFor(['NASA_HRP_HAZARDS', 'NASA_HRP_RISKS'], true),
    escalate: false,
  };
};

// ---------------------------------------------------------------------------
// 4. Sono — déficit acumulado vs. prescrito em 7 dias
// ---------------------------------------------------------------------------
export function sleepDeficit(ctx: RuleContext) {
  const cfg = RULES.sleep;
  const pts = pointsInWindow(ctx.series.sleep, ctx.day, cfg.windowDays);
  if (pts.length < cfg.minNights) return null;
  const deficit = pts.reduce((a, p) => a + Math.max(0, cfg.prescribedHours - p.value), 0);
  const quality = pts.filter((p) => p.secondaryValue !== undefined).map((p) => p.secondaryValue!);
  return { pts, deficit, meanHours: mean(pts.map((p) => p.value)), meanQuality: quality.length ? mean(quality) : null };
}

export const sleepRule: Rule = (ctx) => {
  const cfg = RULES.sleep;
  const d = sleepDeficit(ctx);
  if (!d || d.deficit <= cfg.maxCumulativeDeficitHours) return null;
  const evidence: Evidence[] = [
    { label: 'Average sleep per night', value: round(d.meanHours), unit: 'h', comparedTo: cfg.prescribedHours },
    { label: `Cumulative deficit (${d.pts.length} nights)`, value: round(d.deficit), unit: 'h', comparedTo: cfg.maxCumulativeDeficitHours },
  ];
  if (d.meanQuality !== null) evidence.push({ label: 'Average sleep quality', value: round(d.meanQuality), unit: '1–5' });
  return {
    ruleId: 'sleep-deficit',
    severity: 'attention',
    variables: ['sleep'],
    title: 'Cumulative sleep deficit',
    explanation:
      `Over the last ${d.pts.length} nights you slept an average of ${fmt(d.meanHours)} h, against ${fmt(cfg.prescribedHours)} h ` +
      `recommended, building up a ${fmt(d.deficit)} h deficit. This may be related to ${GUIDANCE.sleep.possibleCause}.`,
    arithmetic:
      `deficit = Σ max(0, ${fmt(cfg.prescribedHours)} − hours) over ${d.pts.length} nights = ${fmt(d.deficit)} h ` +
      `> limit of ${fmt(cfg.maxCumulativeDeficitHours)} h [reference: ${fmt(cfg.prescribedHours)} h/night prescription]`,
    evidence,
    guidance: GUIDANCE.sleep.guidance,
    sourceRef: sourceRefFor(['NASA_HRR_SLEEP', 'NASA_AMES_SLEEP_FACT'], true),
    escalate: false,
  };
};

// ---------------------------------------------------------------------------
// 5. Autorrelato — tendência de queda em janela móvel de 5 dias
// ---------------------------------------------------------------------------
export const selfReportRule: Rule = (ctx) => {
  const cfg = RULES.selfReport;
  const s = ctx.series.selfReport;
  const cur = pointsInWindow(s, ctx.day, cfg.windowDays);
  const prev = pointsInWindow(s, ctx.day - cfg.windowDays, cfg.windowDays);
  if (cur.length < cfg.minDays || prev.length < cfg.minDays) return null;
  const mCur = mean(cur.map((p) => p.value));
  const mPrev = mean(prev.map((p) => p.value));
  const delta = mCur - mPrev;
  if (delta > -cfg.minDrop) return null;
  const b = ctx.preflight.selfReport;
  if (!b || b.mean - mCur < cfg.minBelowPreflight) return null;
  const evidence: Evidence[] = [
    { label: `Mean well-being (last ${cfg.windowDays} days)`, value: round(mCur, 2), unit: '1–5', comparedTo: round(mPrev, 2) },
    { label: 'Change between windows', value: round(delta, 2), unit: 'points', comparedTo: -cfg.minDrop },
  ];
  evidence.push({ label: 'Preflight mean well-being', value: round(b.mean, 2), unit: '1–5', comparedTo: round(b.mean - cfg.minBelowPreflight, 2) });
  return {
    ruleId: 'selfreport-decline',
    severity: 'attention',
    variables: ['selfReport'],
    title: 'Decline in self-reported well-being',
    explanation:
      `Your well-being index (mood, stress and fatigue) fell from ${fmt(mPrev, 2)} to ${fmt(mCur, 2)} between the last two ` +
      `${cfg.windowDays}-day periods. This may reflect ${GUIDANCE.selfReport.possibleCause}.`,
    arithmetic:
      `Δ = mean(current ${cfg.windowDays} days) − mean(previous ${cfg.windowDays} days) = ${fmt(mCur, 2)} − ${fmt(mPrev, 2)} = ` +
      `${signed(delta, 2)} ≤ −${fmt(cfg.minDrop)} and current mean ${fmt(mCur, 2)} ≤ preflight ${fmt(b.mean, 2)} − ${fmt(cfg.minBelowPreflight)} ` +
      `[rolling + preflight baseline; index = (mood + (6 − stress) + (6 − fatigue)) / 3]`,
    evidence,
    guidance: GUIDANCE.selfReport.guidance,
    sourceRef: sourceRefFor(['NASA_HRP_HAZARDS'], true),
    escalate: false,
  };
};

// ---------------------------------------------------------------------------
// 6. Massa corporal — %Δ do pré-voo
// ---------------------------------------------------------------------------
export function massChange(ctx: RuleContext) {
  const cfg = RULES.bodyMass;
  const b = ctx.preflight.bodyMass;
  if (!b) return null;
  const recent = pointsInWindow(ctx.series.bodyMass, ctx.day, cfg.recentWindowDays);
  if (!recent.length) return null;
  const current = mean(recent.map((p) => p.value));
  const earlierPts = pointsInWindow(ctx.series.bodyMass, ctx.day - cfg.comparisonDays, cfg.recentWindowDays);
  const earlier = earlierPts.length ? mean(earlierPts.map((p) => p.value)) : null;
  return {
    baseline: b,
    current,
    pctChange: ((current - b.mean) / b.mean) * 100,
    earlier,
    pctChangeVsEarlier: earlier === null ? null : ((current - earlier) / earlier) * 100,
  };
}

function massEvidence(m: NonNullable<ReturnType<typeof massChange>>): Evidence[] {
  const ev: Evidence[] = [
    { label: 'Current mass (7-day mean)', value: round(m.current, 2), unit: 'kg', comparedTo: round(m.baseline.mean, 2) },
    { label: 'Change vs. preflight', value: round(m.pctChange, 2), unit: '%', comparedTo: RULES.bodyMass.lossThresholdPct },
  ];
  if (m.pctChangeVsEarlier !== null)
    ev.push({ label: `Change over ${RULES.bodyMass.comparisonDays / 7} weeks`, value: round(m.pctChangeVsEarlier, 2), unit: '%' });
  return ev;
}

export const bodyMassRule: Rule = (ctx) => {
  const cfg = RULES.bodyMass;
  const m = massChange(ctx);
  if (!m || m.pctChange > cfg.lossThresholdPct) return null;
  return {
    ruleId: 'mass-loss',
    severity: 'attention',
    variables: ['bodyMass'],
    title: 'Body mass loss',
    explanation:
      `Your body mass is ${fmt(Math.abs(m.pctChange))}% below your preflight mean ` +
      `(${fmt(m.current, 1)} kg vs. ${fmt(m.baseline.mean, 1)} kg). This may be related to ${GUIDANCE.bodyMass.possibleCause}.`,
    arithmetic:
      `%Δ = (current mass − preflight) / preflight = (${fmt(m.current, 2)} − ${fmt(m.baseline.mean, 2)}) / ${fmt(m.baseline.mean, 2)} = ` +
      `${signed(m.pctChange, 2)}% ≤ ${fmt(cfg.lossThresholdPct)}% ${baselineTag(m.baseline)}`,
    evidence: massEvidence(m),
    guidance: GUIDANCE.bodyMass.guidance,
    sourceRef: sourceRefFor(['NASA_NUTRITION_BIOCHEM'], true),
    escalate: false,
  };
};

// ---------------------------------------------------------------------------
// 7. Exercício — aderência (completado ÷ prescrito) < 80% em 7 dias
// ---------------------------------------------------------------------------
export function adherenceOver(ctx: RuleContext, windowDays: number) {
  const pts = pointsInWindow(ctx.series.exerciseLoad, ctx.day, windowDays);
  const prescribed = pts.reduce((a, p) => a + (p.secondaryValue ?? 0), 0);
  const completed = pts.reduce((a, p) => a + p.value, 0);
  return { prescribed, completed, ratio: prescribed > 0 ? completed / prescribed : null, days: pts.length };
}

export const exerciseRule: Rule = (ctx) => {
  const cfg = RULES.exerciseLoad;
  const a = adherenceOver(ctx, cfg.windowDays);
  if (a.ratio === null || a.ratio >= cfg.minAdherence) return null;
  return {
    ruleId: 'exercise-adherence',
    severity: 'attention',
    variables: ['exerciseLoad'],
    title: 'Exercise adherence below prescription',
    explanation:
      `Over the last ${cfg.windowDays} days you completed ${pct(a.ratio)} of the prescribed exercise load ` +
      `(${fmt(a.prescribed - a.completed, 0)} min missing). Common reasons: ${GUIDANCE.exerciseLoad.possibleCause}.`,
    arithmetic:
      `adherence = completed / prescribed = ${fmt(a.completed, 0)} / ${fmt(a.prescribed, 0)} min = ${pct(a.ratio, 1)} ` +
      `< ${pct(cfg.minAdherence)} over ${cfg.windowDays} days [prescription: ${cfg.prescribedMinutesPerDay} min/day, ${cfg.trainingDaysPerWeek} days/week]`,
    evidence: [
      { label: `Adherence (${cfg.windowDays} days)`, value: round(a.ratio * 100), unit: '%', comparedTo: cfg.minAdherence * 100 },
      { label: 'Minutes completed', value: a.completed, unit: 'min', comparedTo: a.prescribed },
      { label: 'Minutes missing', value: a.prescribed - a.completed, unit: 'min' },
    ],
    guidance: GUIDANCE.exerciseLoad.guidance,
    sourceRef: sourceRefFor(['NASA_SP_2025_DECONDITIONING', 'NASA_ASTRONAUT_EXERCISE'], true),
    escalate: false,
  };
};

// ---------------------------------------------------------------------------
// Composta — cluster rápido (sono ↓, HRV ↓, FC ↑) em 5 dias
// ---------------------------------------------------------------------------
type FastSignal = 'sleep' | 'hrv' | 'restingHeartRate';
const FAST: { id: FastSignal; dir: 1 | -1; label: string; unit: string }[] = [
  { id: 'sleep', dir: -1, label: 'Sleep', unit: 'h' },
  { id: 'hrv', dir: -1, label: 'HRV', unit: 'ms' },
  { id: 'restingHeartRate', dir: 1, label: 'Resting HR', unit: 'bpm' },
];

export const compositeRule: Rule = (ctx) => {
  const cfg = RULES.composite;
  const rows: { sig: (typeof FAST)[number]; m: number; b: Baseline; z: number }[] = [];
  for (const sig of FAST) {
    const b = ctx.preflight[sig.id];
    const pts = pointsInWindow(ctx.series[sig.id], ctx.day, cfg.windowDays);
    if (!b || pts.length < cfg.minDaysPerSignal) continue;
    const m = mean(pts.map((p) => p.value));
    rows.push({ sig, m, b, z: (m - b.mean) / Math.max(b.stdDev, cfg.sdFloors[sig.id]) });
  }
  const flagged = rows.filter((r) => r.sig.dir * r.z >= cfg.zThreshold);
  const contradicting = rows.filter((r) => -r.sig.dir * r.z >= cfg.zThreshold);
  if (flagged.length < cfg.minSignals || contradicting.length > 0) return null;

  const arrow = (r: (typeof rows)[number]) => (r.sig.dir < 0 ? '↓' : '↑');
  const list = rows
    .map((r) => `${r.sig.label} ${fmt(r.m)} ${r.sig.unit} (baseline ${fmt(r.b.mean)} ${r.sig.unit})`)
    .join('; ');
  return {
    ruleId: 'fast-cluster-overload',
    severity: 'attention',
    variables: flagged.map((r) => r.sig.id),
    title: `${GUIDANCE.composite.patternName[0].toUpperCase()}${GUIDANCE.composite.patternName.slice(1)} pattern: ${flagged.map((r) => `${r.sig.label} ${arrow(r)}`).join(', ')}`,
    explanation:
      `${flagged.length} of 3 fast signals shifted together, in the expected direction, over the last ${cfg.windowDays} days: ${list}. ` +
      `None of them alone would justify a strong alert; the combined pattern is consistent with ${GUIDANCE.composite.patternName}, not a single bad night.`,
    arithmetic:
      `z(${cfg.windowDays}d) = (${cfg.windowDays}-day mean − preflight mean) / SD: ` +
      rows.map((r) => `${r.sig.label} ${signed(r.z, 2)}`).join('; ') +
      ` → ${flagged.length} signals with |z| ≥ ${fmt(cfg.zThreshold)} in the overload direction (minimum ${cfg.minSignals}) ${baselineTag(rows[0].b)}`,
    evidence: rows.map((r) => ({
      label: `${r.sig.label} (${cfg.windowDays}-day mean)`,
      value: round(r.m),
      unit: r.sig.unit,
      comparedTo: round(r.b.mean),
    })),
    guidance: GUIDANCE.composite.guidance,
    sourceRef: sourceRefFor(['NASA_HRR_SLEEP', 'NASA_HRP_RISKS'], true),
    escalate: false,
  };
};

// ---------------------------------------------------------------------------
// Associação — acumulador (massa) ↔ contramedida (exercício). Associar, nunca modelar.
// ---------------------------------------------------------------------------
export const associationRule: Rule = (ctx) => {
  const cfg = RULES.association;
  const m = massChange(ctx);
  const a = adherenceOver(ctx, cfg.windowDays);
  if (!m || m.pctChange > cfg.massLossThresholdPct || a.ratio === null || a.ratio >= cfg.minAdherence) return null;

  const bp = cfg.criticalWithBloodPressure ? bloodPressureRule(ctx) : null;
  const critical = bp !== null;
  const weeks = cfg.windowDays / 7;
  const massText =
    `Body mass ${signed(m.pctChange)}% relative to preflight (${fmt(m.baseline.mean)} → ${fmt(m.current)} kg)` +
    (m.pctChangeVsEarlier !== null ? `, ${signed(m.pctChangeVsEarlier)}% over the last ${weeks} weeks` : '');
  const adhText = `Over the same ${weeks}-week period, ${pct(a.ratio)} of the prescribed exercise load was completed (${fmt(a.completed, 0)} of ${fmt(a.prescribed, 0)} min).`;

  return {
    ruleId: 'mass-exercise-association',
    severity: critical ? 'critical' : 'attention',
    variables: critical ? ['bodyMass', 'exerciseLoad', 'bloodPressure'] : ['bodyMass', 'exerciseLoad'],
    title: critical
      ? 'Multi-system deconditioning with countermeasure below prescription'
      : 'Body mass loss associated with low exercise adherence',
    explanation:
      `${massText}. ${adhText} The two may be related — the system associates signals in the same window; it does not claim causation.` +
      (critical
        ? ` At the same time, blood pressure is drifting from your individual pattern: systolic ${fmt(bp!.evidence[0].value, 0)} mmHg vs. baseline ${fmt(bp!.evidence[0].comparedTo ?? 0)} mmHg. ` +
          `Three signals from different systems (musculoskeletal, cardiovascular and countermeasure) warrant a medical evaluation.`
        : ''),
    arithmetic:
      `mass: %Δ = (${fmt(m.current, 2)} − ${fmt(m.baseline.mean, 2)}) / ${fmt(m.baseline.mean, 2)} = ${signed(m.pctChange, 2)}% ≤ ${fmt(cfg.massLossThresholdPct)}%; ` +
      `${cfg.windowDays}d adherence = ${fmt(a.completed, 0)} / ${fmt(a.prescribed, 0)} = ${pct(a.ratio, 1)} < ${pct(cfg.minAdherence)}` +
      (critical ? `; blood pressure: ${bp!.arithmetic}` : ` ${baselineTag(m.baseline)}`),
    evidence: [
      ...massEvidence(m),
      { label: `Exercise adherence (${cfg.windowDays} days)`, value: round(a.ratio * 100), unit: '%', comparedTo: cfg.minAdherence * 100 },
      { label: `Minutes completed (${cfg.windowDays} days)`, value: a.completed, unit: 'min', comparedTo: a.prescribed },
      ...(critical ? bp!.evidence.slice(0, 1) : []),
    ],
    guidance: critical ? GUIDANCE.association.guidanceCritical : GUIDANCE.association.guidance,
    sourceRef: sourceRefFor(['NASA_NUTRITION_BIOCHEM', 'NASA_SP_2025_DECONDITIONING', 'NASA_ASTRONAUT_EXERCISE'], true),
    escalate: critical,
  };
};

/** Regras de variável única, na ordem de exibição. */
export const SINGLE_RULES: Record<Exclude<RuleId, 'fast-cluster-overload' | 'mass-exercise-association'>, Rule> = {
  'rhr-deviation': restingHeartRateRule,
  'hrv-drop': hrvRule,
  'bp-deviation': bloodPressureRule,
  'sleep-deficit': sleepRule,
  'selfreport-decline': selfReportRule,
  'mass-loss': bodyMassRule,
  'exercise-adherence': exerciseRule,
};

export const ALL_RULES: Record<RuleId, Rule> = {
  ...SINGLE_RULES,
  'fast-cluster-overload': compositeRule,
  'mass-exercise-association': associationRule,
};
