/**
 * Regras determinísticas. Regra de ouro (spec §5): nenhum alerta existe sem
 * uma operação aritmética sobre números registrados, e a operação aparece no
 * texto do alerta (`arithmetic`). Cada regra é uma função pura do contexto em
 * um dia; o motor a chama no dia de avaliação e, para achar o início do
 * alerta, nos dias anteriores. O texto sai no idioma de `ctx.locale` (en | pt);
 * a decisão da regra não depende do idioma.
 */
import type { Baseline, Evidence, Locale, Severity, VariableId } from '../types/contract';
import { guidanceFor } from './config/guidance';
import { sourceRefFor } from './config/sources';
import { RULES } from './config/thresholds';
import { formatter } from './i18n';
import { consecutivePoints, pointsInWindow, streakLength, type DailyPoint, type DailySeries } from './series';
import { dayNumber, mean, round } from './util';

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
  /** Idioma do texto emitido. Padrão 'en'. */
  locale?: Locale;
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

/** Formatadores, textos de orientação e unidades no idioma do contexto. */
function lang(ctx: RuleContext) {
  const locale = ctx.locale ?? 'en';
  const f = formatter(locale);
  return {
    ...f,
    locale,
    G: guidanceFor(locale),
    days: f.t('days', 'dias'),
    SD: f.t('SD', 'DP'),
    /** '[preflight baseline Jul 1–Jul 7]' — todo alerta declara o baseline usado. */
    tag: (b: Baseline) =>
      `[${f.t('preflight baseline', 'baseline pré-voo')} ${f.day(dayNumber(b.windowStart))}–${f.day(dayNumber(b.windowEnd))}]`,
  };
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

  const { n, signed, t, G, tag, days, SD } = lang(ctx);
  const streak = streakLength(s, ctx.day, (p) => dir * z(p) > cfg.zThreshold);
  const cur = last(pts);
  const up = dir > 0;
  const cause = up ? G.restingHeartRate.possibleCauseUp : G.restingHeartRate.possibleCauseDown;
  return {
    ruleId: 'rhr-deviation',
    severity: 'attention',
    variables: ['restingHeartRate'],
    title: t(`Resting heart rate ${up ? 'above' : 'below'} your baseline`, `FC de repouso ${up ? 'acima' : 'abaixo'} da sua linha de base`),
    explanation: t(
      `Your resting heart rate has been ${up ? 'above' : 'below'} your preflight baseline for ${streak} consecutive days ` +
        `(${n(cur.value, 0)} bpm today vs. a mean of ${n(b.mean)} bpm). This may be related to ${cause}.`,
      `Sua FC de repouso está ${up ? 'acima' : 'abaixo'} da sua linha de base pré-voo há ${streak} dias consecutivos ` +
        `(${n(cur.value, 0)} bpm hoje vs. média de ${n(b.mean)} bpm). Isso pode estar relacionado a ${cause}.`,
    ),
    arithmetic:
      t('z = (HR − mean) / SD', 'z = (FC − média) / DP') +
      ` = (${n(cur.value, 0)} − ${n(b.mean)}) / ${n(sd)} = ${signed(z(cur))}; ` +
      t(
        `|z| > ${n(cfg.zThreshold)} on ${streak} consecutive days (minimum ${cfg.consecutiveDays}) ${tag(b)}`,
        `|z| > ${n(cfg.zThreshold)} em ${streak} dias consecutivos (mínimo ${cfg.consecutiveDays}) ${tag(b)}`,
      ),
    evidence: [
      { label: t('Current resting HR', 'FC de repouso atual'), value: round(cur.value), unit: 'bpm', comparedTo: round(b.mean) },
      { label: t('Deviation (z)', 'Desvio (z)'), value: round(z(cur), 2), unit: SD, comparedTo: dir * cfg.zThreshold },
      { label: t('Consecutive days deviating', 'Dias consecutivos em desvio'), value: streak, unit: days, comparedTo: cfg.consecutiveDays },
    ],
    guidance: G.restingHeartRate.guidance,
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

  const { n, pct, t, G, tag, days } = lang(ctx);
  const streak = streakLength(s, ctx.day, (p) => drop(p) > cfg.dropFraction);
  const cur = last(pts);
  return {
    ruleId: 'hrv-drop',
    severity: 'attention',
    variables: ['hrv'],
    title: t('HRV below your baseline', 'HRV abaixo da sua linha de base'),
    explanation: t(
      `Your heart rate variability (RMSSD) has been ${pct(drop(cur))} below your preflight mean ` +
        `for ${streak} consecutive days. This may indicate ${G.hrv.possibleCause}.`,
      `Sua variabilidade da frequência cardíaca (RMSSD) está ${pct(drop(cur))} abaixo da média pré-voo ` +
        `há ${streak} dias consecutivos. Isso pode indicar ${G.hrv.possibleCause}.`,
    ),
    arithmetic:
      t('drop = (mean − HRV) / mean', 'queda = (média − HRV) / média') +
      ` = (${n(b.mean)} − ${n(cur.value)}) / ${n(b.mean)} = ${pct(drop(cur), 1)}; ` +
      t(
        `> ${pct(cfg.dropFraction)} on ${streak} consecutive days (minimum ${cfg.consecutiveDays}) ${tag(b)}`,
        `> ${pct(cfg.dropFraction)} em ${streak} dias consecutivos (mínimo ${cfg.consecutiveDays}) ${tag(b)}`,
      ),
    evidence: [
      { label: t('Current HRV', 'HRV atual'), value: round(cur.value), unit: 'ms', comparedTo: round(b.mean) },
      { label: t('Drop vs. preflight', 'Queda vs. pré-voo'), value: round(drop(cur) * 100), unit: '%', comparedTo: cfg.dropFraction * 100 },
      { label: t('Consecutive days below', 'Dias consecutivos em queda'), value: streak, unit: days, comparedTo: cfg.consecutiveDays },
    ],
    guidance: G.hrv.guidance,
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

  const { n, signed, t, G, tag, days, SD } = lang(ctx);
  const streak = streakLength(s, ctx.day, (p) => dir * dev(p) > limit);
  const meanDev = mean(pts.map(dev));
  const cur = last(pts);
  const up = dir > 0;
  const sign = up ? '+' : '−';
  const reading = `${n(cur.value, 0)}/${n(cur.secondaryValue ?? 0, 0)} mmHg`;
  const k = cfg.consecutiveDays;
  return {
    ruleId: 'bp-deviation',
    severity: 'attention',
    variables: ['bloodPressure'],
    title: t(`Blood pressure ${up ? 'above' : 'below'} your individual pattern`, `Pressão arterial ${up ? 'acima' : 'abaixo'} do seu padrão individual`),
    explanation: t(
      `Your systolic pressure has been consistently ${up ? 'above' : 'below'} your preflight baseline for ${streak} days ` +
        `(${reading} today vs. a mean of ${n(b.mean)} mmHg). ` +
        `The value may still be within the normal clinical range; what matters is the shift away from your own pattern, ` +
        `which may be related to ${G.bloodPressure.possibleCause}.`,
      `Sua pressão sistólica está sistematicamente ${up ? 'acima' : 'abaixo'} da sua linha de base pré-voo há ${streak} dias ` +
        `(${reading} hoje vs. média de ${n(b.mean)} mmHg). ` +
        `O valor ainda pode estar em faixa clínica normal; o que importa é o afastamento do seu próprio padrão, ` +
        `que pode estar relacionado a ${G.bloodPressure.possibleCause}.`,
    ),
    arithmetic:
      t(`mean systolic Δ (${k} days)`, `Δ sistólica média (${k} dias)`) +
      ` = ${n(mean(pts.map((p) => p.value)))} − ${n(b.mean)} = ${signed(meanDev)} mmHg; ` +
      t(`all ${k} days beyond`, `todos os ${k} dias além de`) +
      ` ${sign}${n(cfg.zThreshold)} ${SD} (${sign}${n(limit)} mmHg) ${tag(b)}`,
    evidence: [
      { label: t('Current systolic', 'Sistólica atual'), value: round(cur.value), unit: 'mmHg', comparedTo: round(b.mean) },
      { label: t('Current diastolic', 'Diastólica atual'), value: round(cur.secondaryValue ?? 0), unit: 'mmHg' },
      { label: t(`Mean deviation (${k} days)`, `Desvio médio (${k} dias)`), value: round(meanDev), unit: 'mmHg', comparedTo: round(dir * limit) },
      { label: t('Consecutive days deviating', 'Dias consecutivos em desvio'), value: streak, unit: days, comparedTo: k },
    ],
    guidance: G.bloodPressure.guidance,
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
  const { n, t, G } = lang(ctx);
  const nights = d.pts.length;
  const evidence: Evidence[] = [
    { label: t('Average sleep per night', 'Sono médio por noite'), value: round(d.meanHours), unit: 'h', comparedTo: cfg.prescribedHours },
    {
      label: t(`Cumulative deficit (${nights} nights)`, `Déficit acumulado (${nights} noites)`),
      value: round(d.deficit),
      unit: 'h',
      comparedTo: cfg.maxCumulativeDeficitHours,
    },
  ];
  if (d.meanQuality !== null)
    evidence.push({ label: t('Average sleep quality', 'Qualidade média do sono'), value: round(d.meanQuality), unit: '1–5' });
  return {
    ruleId: 'sleep-deficit',
    severity: 'attention',
    variables: ['sleep'],
    title: t('Cumulative sleep deficit', 'Déficit de sono acumulado'),
    explanation: t(
      `Over the last ${nights} nights you slept an average of ${n(d.meanHours)} h, against ${n(cfg.prescribedHours)} h ` +
        `recommended, building up a ${n(d.deficit)} h deficit. This may be related to ${G.sleep.possibleCause}.`,
      `Nas últimas ${nights} noites você dormiu em média ${n(d.meanHours)} h, contra ${n(cfg.prescribedHours)} h ` +
        `recomendadas, acumulando ${n(d.deficit)} h de déficit. Isso pode estar relacionado a ${G.sleep.possibleCause}.`,
    ),
    arithmetic: t(
      `deficit = Σ max(0, ${n(cfg.prescribedHours)} − hours) over ${nights} nights = ${n(d.deficit)} h ` +
        `> limit of ${n(cfg.maxCumulativeDeficitHours)} h [reference: ${n(cfg.prescribedHours)} h/night prescription]`,
      `déficit = Σ máx(0, ${n(cfg.prescribedHours)} − horas) em ${nights} noites = ${n(d.deficit)} h ` +
        `> limite de ${n(cfg.maxCumulativeDeficitHours)} h [referência: prescrição de ${n(cfg.prescribedHours)} h/noite]`,
    ),
    evidence,
    guidance: G.sleep.guidance,
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

  const { n, signed, t, G } = lang(ctx);
  const w = cfg.windowDays;
  const evidence: Evidence[] = [
    { label: t(`Mean well-being (last ${w} days)`, `Bem-estar médio (últimos ${w} dias)`), value: round(mCur, 2), unit: '1–5', comparedTo: round(mPrev, 2) },
    { label: t('Change between windows', 'Variação entre janelas'), value: round(delta, 2), unit: t('points', 'pontos'), comparedTo: -cfg.minDrop },
    {
      label: t('Preflight mean well-being', 'Bem-estar médio pré-voo'),
      value: round(b.mean, 2),
      unit: '1–5',
      comparedTo: round(b.mean - cfg.minBelowPreflight, 2),
    },
  ];
  return {
    ruleId: 'selfreport-decline',
    severity: 'attention',
    variables: ['selfReport'],
    title: t('Decline in self-reported well-being', 'Queda no bem-estar autorrelatado'),
    explanation: t(
      `Your well-being index (mood, stress and fatigue) fell from ${n(mPrev, 2)} to ${n(mCur, 2)} between the last two ` +
        `${w}-day periods. This may reflect ${G.selfReport.possibleCause}.`,
      `Seu índice de bem-estar (humor, estresse e fadiga) caiu de ${n(mPrev, 2)} para ${n(mCur, 2)} entre os dois ` +
        `últimos períodos de ${w} dias. Isso pode refletir ${G.selfReport.possibleCause}.`,
    ),
    arithmetic: t(
      `Δ = mean(current ${w} days) − mean(previous ${w} days) = ${n(mCur, 2)} − ${n(mPrev, 2)} = ` +
        `${signed(delta, 2)} ≤ −${n(cfg.minDrop)} and current mean ${n(mCur, 2)} ≤ preflight ${n(b.mean, 2)} − ${n(cfg.minBelowPreflight)} ` +
        `[rolling + preflight baseline; index = (mood + (6 − stress) + (6 − fatigue)) / 3]`,
      `Δ = média(${w} dias atuais) − média(${w} dias anteriores) = ${n(mCur, 2)} − ${n(mPrev, 2)} = ` +
        `${signed(delta, 2)} ≤ −${n(cfg.minDrop)} e média atual ${n(mCur, 2)} ≤ pré-voo ${n(b.mean, 2)} − ${n(cfg.minBelowPreflight)} ` +
        `[baseline móvel + pré-voo; índice = (humor + (6 − estresse) + (6 − fadiga)) / 3]`,
    ),
    evidence,
    guidance: G.selfReport.guidance,
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

function massEvidence(ctx: RuleContext, m: NonNullable<ReturnType<typeof massChange>>): Evidence[] {
  const { t } = lang(ctx);
  const weeks = RULES.bodyMass.comparisonDays / 7;
  const ev: Evidence[] = [
    { label: t('Current mass (7-day mean)', 'Massa atual (média 7 dias)'), value: round(m.current, 2), unit: 'kg', comparedTo: round(m.baseline.mean, 2) },
    { label: t('Change vs. preflight', 'Variação vs. pré-voo'), value: round(m.pctChange, 2), unit: '%', comparedTo: RULES.bodyMass.lossThresholdPct },
  ];
  if (m.pctChangeVsEarlier !== null)
    ev.push({ label: t(`Change over ${weeks} weeks`, `Variação em ${weeks} semanas`), value: round(m.pctChangeVsEarlier, 2), unit: '%' });
  return ev;
}

export const bodyMassRule: Rule = (ctx) => {
  const cfg = RULES.bodyMass;
  const m = massChange(ctx);
  if (!m || m.pctChange > cfg.lossThresholdPct) return null;
  const { n, signed, t, G, tag } = lang(ctx);
  return {
    ruleId: 'mass-loss',
    severity: 'attention',
    variables: ['bodyMass'],
    title: t('Body mass loss', 'Perda de massa corporal'),
    explanation: t(
      `Your body mass is ${n(Math.abs(m.pctChange))}% below your preflight mean ` +
        `(${n(m.current, 1)} kg vs. ${n(m.baseline.mean, 1)} kg). This may be related to ${G.bodyMass.possibleCause}.`,
      `Sua massa corporal está ${n(Math.abs(m.pctChange))}% abaixo da média pré-voo ` +
        `(${n(m.current, 1)} kg vs. ${n(m.baseline.mean, 1)} kg). Isso pode estar relacionado a ${G.bodyMass.possibleCause}.`,
    ),
    arithmetic:
      t('%Δ = (current mass − preflight) / preflight', '%Δ = (massa atual − pré-voo) / pré-voo') +
      ` = (${n(m.current, 2)} − ${n(m.baseline.mean, 2)}) / ${n(m.baseline.mean, 2)} = ` +
      `${signed(m.pctChange, 2)}% ≤ ${n(cfg.lossThresholdPct)}% ${tag(m.baseline)}`,
    evidence: massEvidence(ctx, m),
    guidance: G.bodyMass.guidance,
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
  const { n, pct, t, G } = lang(ctx);
  const w = cfg.windowDays;
  const missing = n(a.prescribed - a.completed, 0);
  return {
    ruleId: 'exercise-adherence',
    severity: 'attention',
    variables: ['exerciseLoad'],
    title: t('Exercise adherence below prescription', 'Aderência ao exercício abaixo da prescrição'),
    explanation: t(
      `Over the last ${w} days you completed ${pct(a.ratio)} of the prescribed exercise load ` +
        `(${missing} min missing). Common reasons: ${G.exerciseLoad.possibleCause}.`,
      `Nos últimos ${w} dias você completou ${pct(a.ratio)} da carga de exercício prescrita ` +
        `(faltaram ${missing} min). Motivos comuns: ${G.exerciseLoad.possibleCause}.`,
    ),
    arithmetic: t(
      `adherence = completed / prescribed = ${n(a.completed, 0)} / ${n(a.prescribed, 0)} min = ${pct(a.ratio, 1)} ` +
        `< ${pct(cfg.minAdherence)} over ${w} days [prescription: ${cfg.prescribedMinutesPerDay} min/day, ${cfg.trainingDaysPerWeek} days/week]`,
      `aderência = completado / prescrito = ${n(a.completed, 0)} / ${n(a.prescribed, 0)} min = ${pct(a.ratio, 1)} ` +
        `< ${pct(cfg.minAdherence)} em ${w} dias [prescrição: ${cfg.prescribedMinutesPerDay} min/dia, ${cfg.trainingDaysPerWeek} dias/semana]`,
    ),
    evidence: [
      { label: t(`Adherence (${w} days)`, `Aderência (${w} dias)`), value: round(a.ratio * 100), unit: '%', comparedTo: cfg.minAdherence * 100 },
      { label: t('Minutes completed', 'Minutos completados'), value: a.completed, unit: 'min', comparedTo: a.prescribed },
      { label: t('Minutes missing', 'Minutos faltantes'), value: a.prescribed - a.completed, unit: 'min' },
    ],
    guidance: G.exerciseLoad.guidance,
    sourceRef: sourceRefFor(['NASA_SP_2025_DECONDITIONING', 'NASA_ASTRONAUT_EXERCISE'], true),
    escalate: false,
  };
};

// ---------------------------------------------------------------------------
// Composta — cluster rápido (sono ↓, HRV ↓, FC ↑) em 5 dias
// ---------------------------------------------------------------------------
type FastSignal = 'sleep' | 'hrv' | 'restingHeartRate';
const FAST: { id: FastSignal; dir: 1 | -1; label: Record<Locale, string>; unit: string }[] = [
  { id: 'sleep', dir: -1, label: { en: 'Sleep', pt: 'Sono' }, unit: 'h' },
  { id: 'hrv', dir: -1, label: { en: 'HRV', pt: 'HRV' }, unit: 'ms' },
  { id: 'restingHeartRate', dir: 1, label: { en: 'Resting HR', pt: 'FC de repouso' }, unit: 'bpm' },
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

  const { n, signed, t, G, tag, locale } = lang(ctx);
  const w = cfg.windowDays;
  const label = (r: (typeof rows)[number]) => r.sig.label[locale];
  const arrow = (r: (typeof rows)[number]) => (r.sig.dir < 0 ? '↓' : '↑');
  const list = rows
    .map((r) => `${label(r)} ${n(r.m)} ${r.sig.unit} (${t('baseline', 'base')} ${n(r.b.mean)} ${r.sig.unit})`)
    .join('; ');
  const signals = flagged.map((r) => `${label(r)} ${arrow(r)}`).join(', ');
  const pattern = G.composite.patternName;
  return {
    ruleId: 'fast-cluster-overload',
    severity: 'attention',
    variables: flagged.map((r) => r.sig.id),
    title: t(`Overload pattern: ${signals}`, `Padrão de ${pattern}: ${signals}`),
    explanation: t(
      `${flagged.length} of 3 fast signals shifted together, in the expected direction, over the last ${w} days: ${list}. ` +
        `None of them alone would justify a strong alert; the combined pattern is consistent with ${pattern}, not a single bad night.`,
      `${flagged.length} de 3 sinais rápidos desviaram juntos, na direção esperada, nos últimos ${w} dias: ${list}. ` +
        `Nenhum deles isoladamente justificaria um alerta forte; o padrão conjunto é compatível com ${pattern}, não com uma noite ruim.`,
    ),
    arithmetic:
      t(`z(${w}d) = (${w}-day mean − preflight mean) / SD: `, `z(${w}d) = (média ${w} dias − média pré-voo) / DP: `) +
      rows.map((r) => `${label(r)} ${signed(r.z, 2)}`).join('; ') +
      t(
        ` → ${flagged.length} signals with |z| ≥ ${n(cfg.zThreshold)} in the overload direction (minimum ${cfg.minSignals}) `,
        ` → ${flagged.length} sinais com |z| ≥ ${n(cfg.zThreshold)} na direção de sobrecarga (mínimo ${cfg.minSignals}) `,
      ) +
      tag(rows[0].b),
    evidence: rows.map((r) => ({
      label: t(`${label(r)} (${w}-day mean)`, `${label(r)} (média ${w} dias)`),
      value: round(r.m),
      unit: r.sig.unit,
      comparedTo: round(r.b.mean),
    })),
    guidance: G.composite.guidance,
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
  const { n, signed, pct, t, G, tag } = lang(ctx);
  const weeks = cfg.windowDays / 7;
  const w = cfg.windowDays;
  const massText = t(
    `Body mass ${signed(m.pctChange)}% relative to preflight (${n(m.baseline.mean)} → ${n(m.current)} kg)` +
      (m.pctChangeVsEarlier !== null ? `, ${signed(m.pctChangeVsEarlier)}% over the last ${weeks} weeks` : ''),
    `Massa corporal ${signed(m.pctChange)}% em relação ao pré-voo (${n(m.baseline.mean)} → ${n(m.current)} kg)` +
      (m.pctChangeVsEarlier !== null ? `, ${signed(m.pctChangeVsEarlier)}% nas últimas ${weeks} semanas` : ''),
  );
  const minutes = `${n(a.completed, 0)} ${t('of', 'de')} ${n(a.prescribed, 0)} min`;
  const adhText = t(
    `Over the same ${weeks}-week period, ${pct(a.ratio)} of the prescribed exercise load was completed (${minutes}).`,
    `No mesmo período de ${weeks} semanas, ${pct(a.ratio)} da carga de exercício prescrita foi completada (${minutes}).`,
  );
  const bpNow = bp ? n(bp.evidence[0].value, 0) : '';
  const bpBase = bp ? n(bp.evidence[0].comparedTo ?? 0) : '';

  return {
    ruleId: 'mass-exercise-association',
    severity: critical ? 'critical' : 'attention',
    variables: critical ? ['bodyMass', 'exerciseLoad', 'bloodPressure'] : ['bodyMass', 'exerciseLoad'],
    title: critical
      ? t('Multi-system deconditioning with countermeasure below prescription', 'Descondicionamento em múltiplos sistemas com contramedida abaixo da prescrição')
      : t('Body mass loss associated with low exercise adherence', 'Perda de massa associada à baixa aderência ao exercício'),
    explanation:
      `${massText}. ${adhText} ` +
      t(
        'The two may be related — the system associates signals in the same window; it does not claim causation.',
        'Os dois podem estar relacionados — o sistema associa os sinais na mesma janela, não afirma causa.',
      ) +
      (critical
        ? t(
            ` At the same time, blood pressure is drifting from your individual pattern: systolic ${bpNow} mmHg vs. baseline ${bpBase} mmHg. ` +
              'Three signals from different systems (musculoskeletal, cardiovascular and countermeasure) warrant a medical evaluation.',
            ` Ao mesmo tempo, a pressão arterial se afasta do seu padrão individual: sistólica ${bpNow} mmHg vs. base ${bpBase} mmHg. ` +
              'Três sinais de sistemas diferentes (musculoesquelético, cardiovascular e contramedida) justificam avaliação médica.',
          )
        : ''),
    arithmetic:
      `${t('mass', 'massa')}: %Δ = (${n(m.current, 2)} − ${n(m.baseline.mean, 2)}) / ${n(m.baseline.mean, 2)} = ${signed(m.pctChange, 2)}% ≤ ${n(cfg.massLossThresholdPct)}%; ` +
      `${t(`${w}d adherence`, `aderência ${w}d`)} = ${n(a.completed, 0)} / ${n(a.prescribed, 0)} = ${pct(a.ratio, 1)} < ${pct(cfg.minAdherence)}` +
      (critical ? `; ${t('blood pressure', 'pressão')}: ${bp!.arithmetic}` : ` ${tag(m.baseline)}`),
    evidence: [
      ...massEvidence(ctx, m),
      { label: t(`Exercise adherence (${w} days)`, `Aderência ao exercício (${w} dias)`), value: round(a.ratio * 100), unit: '%', comparedTo: cfg.minAdherence * 100 },
      { label: t(`Minutes completed (${w} days)`, `Minutos completados (${w} dias)`), value: a.completed, unit: 'min', comparedTo: a.prescribed },
      ...(critical ? bp!.evidence.slice(0, 1) : []),
    ],
    guidance: critical ? G.association.guidanceCritical : G.association.guidance,
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
