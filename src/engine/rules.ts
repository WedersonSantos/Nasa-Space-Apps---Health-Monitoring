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
  return `[baseline pré-voo ${dayToShort(dayNumber(b.windowStart))}–${dayToShort(dayNumber(b.windowEnd))}]`;
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
  const word = dir > 0 ? 'acima' : 'abaixo';
  return {
    ruleId: 'rhr-deviation',
    severity: 'attention',
    variables: ['restingHeartRate'],
    title: `FC de repouso ${word} da sua linha de base`,
    explanation:
      `Sua FC de repouso está ${word} da sua linha de base pré-voo há ${streak} dias consecutivos ` +
      `(${fmt(cur.value, 0)} bpm hoje vs. média de ${fmt(b.mean)} bpm). Isso pode estar relacionado a ` +
      `${dir > 0 ? GUIDANCE.restingHeartRate.possibleCauseUp : GUIDANCE.restingHeartRate.possibleCauseDown}.`,
    arithmetic:
      `z = (FC − média) / DP = (${fmt(cur.value, 0)} − ${fmt(b.mean)}) / ${fmt(sd)} = ${signed(z(cur))}; ` +
      `|z| > ${fmt(cfg.zThreshold)} em ${streak} dias consecutivos (mínimo ${cfg.consecutiveDays}) ${baselineTag(b)}`,
    evidence: [
      { label: 'FC de repouso atual', value: round(cur.value), unit: 'bpm', comparedTo: round(b.mean) },
      { label: 'Desvio (z)', value: round(z(cur), 2), unit: 'DP', comparedTo: dir * cfg.zThreshold },
      { label: 'Dias consecutivos em desvio', value: streak, unit: 'dias', comparedTo: cfg.consecutiveDays },
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
    title: 'HRV abaixo da sua linha de base',
    explanation:
      `Sua variabilidade da frequência cardíaca (RMSSD) está ${pct(drop(cur))} abaixo da média pré-voo ` +
      `há ${streak} dias consecutivos. Isso pode indicar ${GUIDANCE.hrv.possibleCause}.`,
    arithmetic:
      `queda = (média − HRV) / média = (${fmt(b.mean)} − ${fmt(cur.value)}) / ${fmt(b.mean)} = ${pct(drop(cur), 1)}; ` +
      `> ${pct(cfg.dropFraction)} em ${streak} dias consecutivos (mínimo ${cfg.consecutiveDays}) ${baselineTag(b)}`,
    evidence: [
      { label: 'HRV atual', value: round(cur.value), unit: 'ms', comparedTo: round(b.mean) },
      { label: 'Queda vs. pré-voo', value: round(drop(cur) * 100), unit: '%', comparedTo: cfg.dropFraction * 100 },
      { label: 'Dias consecutivos em queda', value: streak, unit: 'dias', comparedTo: cfg.consecutiveDays },
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
  const word = dir > 0 ? 'acima' : 'abaixo';
  return {
    ruleId: 'bp-deviation',
    severity: 'attention',
    variables: ['bloodPressure'],
    title: `Pressão arterial ${word} do seu padrão individual`,
    explanation:
      `Sua pressão sistólica está sistematicamente ${word} da sua linha de base pré-voo há ${streak} dias ` +
      `(${fmt(cur.value, 0)}/${fmt(cur.secondaryValue ?? 0, 0)} mmHg hoje vs. média de ${fmt(b.mean)} mmHg). ` +
      `O valor ainda pode estar em faixa clínica normal; o que importa é o afastamento do seu próprio padrão, ` +
      `que pode estar relacionado a ${GUIDANCE.bloodPressure.possibleCause}.`,
    arithmetic:
      `Δ sistólica média (${cfg.consecutiveDays} dias) = ${fmt(mean(pts.map((p) => p.value)))} − ${fmt(b.mean)} = ` +
      `${signed(meanDev)} mmHg; todos os ${cfg.consecutiveDays} dias além de ${dir > 0 ? '+' : '−'}${fmt(cfg.zThreshold)} DP ` +
      `(${dir > 0 ? '+' : '−'}${fmt(limit)} mmHg) ${baselineTag(b)}`,
    evidence: [
      { label: 'Sistólica atual', value: round(cur.value), unit: 'mmHg', comparedTo: round(b.mean) },
      { label: 'Diastólica atual', value: round(cur.secondaryValue ?? 0), unit: 'mmHg' },
      { label: `Desvio médio (${cfg.consecutiveDays} dias)`, value: round(meanDev), unit: 'mmHg', comparedTo: round(dir * limit) },
      { label: 'Dias consecutivos em desvio', value: streak, unit: 'dias', comparedTo: cfg.consecutiveDays },
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
    { label: 'Sono médio por noite', value: round(d.meanHours), unit: 'h', comparedTo: cfg.prescribedHours },
    { label: `Déficit acumulado (${d.pts.length} noites)`, value: round(d.deficit), unit: 'h', comparedTo: cfg.maxCumulativeDeficitHours },
  ];
  if (d.meanQuality !== null) evidence.push({ label: 'Qualidade média do sono', value: round(d.meanQuality), unit: '1–5' });
  return {
    ruleId: 'sleep-deficit',
    severity: 'attention',
    variables: ['sleep'],
    title: 'Déficit de sono acumulado',
    explanation:
      `Nas últimas ${d.pts.length} noites você dormiu em média ${fmt(d.meanHours)} h, contra ${fmt(cfg.prescribedHours)} h ` +
      `recomendadas, acumulando ${fmt(d.deficit)} h de déficit. Isso pode estar relacionado a ${GUIDANCE.sleep.possibleCause}.`,
    arithmetic:
      `déficit = Σ máx(0, ${fmt(cfg.prescribedHours)} − horas) em ${d.pts.length} noites = ${fmt(d.deficit)} h ` +
      `> limite de ${fmt(cfg.maxCumulativeDeficitHours)} h [referência: prescrição de ${fmt(cfg.prescribedHours)} h/noite]`,
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
    { label: `Bem-estar médio (últimos ${cfg.windowDays} dias)`, value: round(mCur, 2), unit: '1–5', comparedTo: round(mPrev, 2) },
    { label: 'Variação entre janelas', value: round(delta, 2), unit: 'pontos', comparedTo: -cfg.minDrop },
  ];
  evidence.push({ label: 'Bem-estar médio pré-voo', value: round(b.mean, 2), unit: '1–5', comparedTo: round(b.mean - cfg.minBelowPreflight, 2) });
  return {
    ruleId: 'selfreport-decline',
    severity: 'attention',
    variables: ['selfReport'],
    title: 'Queda no bem-estar autorrelatado',
    explanation:
      `Seu índice de bem-estar (humor, estresse e fadiga) caiu de ${fmt(mPrev, 2)} para ${fmt(mCur, 2)} entre os dois ` +
      `últimos períodos de ${cfg.windowDays} dias. Isso pode refletir ${GUIDANCE.selfReport.possibleCause}.`,
    arithmetic:
      `Δ = média(${cfg.windowDays} dias atuais) − média(${cfg.windowDays} dias anteriores) = ${fmt(mCur, 2)} − ${fmt(mPrev, 2)} = ` +
      `${signed(delta, 2)} ≤ −${fmt(cfg.minDrop)} e média atual ${fmt(mCur, 2)} ≤ pré-voo ${fmt(b.mean, 2)} − ${fmt(cfg.minBelowPreflight)} ` +
      `[baseline móvel + pré-voo; índice = (humor + (6 − estresse) + (6 − fadiga)) / 3]`,
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
    { label: 'Massa atual (média 7 dias)', value: round(m.current, 2), unit: 'kg', comparedTo: round(m.baseline.mean, 2) },
    { label: 'Variação vs. pré-voo', value: round(m.pctChange, 2), unit: '%', comparedTo: RULES.bodyMass.lossThresholdPct },
  ];
  if (m.pctChangeVsEarlier !== null)
    ev.push({ label: `Variação em ${RULES.bodyMass.comparisonDays / 7} semanas`, value: round(m.pctChangeVsEarlier, 2), unit: '%' });
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
    title: 'Perda de massa corporal',
    explanation:
      `Sua massa corporal está ${fmt(Math.abs(m.pctChange))}% abaixo da média pré-voo ` +
      `(${fmt(m.current, 1)} kg vs. ${fmt(m.baseline.mean, 1)} kg). Isso pode estar relacionado a ${GUIDANCE.bodyMass.possibleCause}.`,
    arithmetic:
      `%Δ = (massa atual − pré-voo) / pré-voo = (${fmt(m.current, 2)} − ${fmt(m.baseline.mean, 2)}) / ${fmt(m.baseline.mean, 2)} = ` +
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
    title: 'Aderência ao exercício abaixo da prescrição',
    explanation:
      `Nos últimos ${cfg.windowDays} dias você completou ${pct(a.ratio)} da carga de exercício prescrita ` +
      `(faltaram ${fmt(a.prescribed - a.completed, 0)} min). Motivos comuns: ${GUIDANCE.exerciseLoad.possibleCause}.`,
    arithmetic:
      `aderência = completado / prescrito = ${fmt(a.completed, 0)} / ${fmt(a.prescribed, 0)} min = ${pct(a.ratio, 1)} ` +
      `< ${pct(cfg.minAdherence)} em ${cfg.windowDays} dias [prescrição: ${cfg.prescribedMinutesPerDay} min/dia, ${cfg.trainingDaysPerWeek} dias/semana]`,
    evidence: [
      { label: `Aderência (${cfg.windowDays} dias)`, value: round(a.ratio * 100), unit: '%', comparedTo: cfg.minAdherence * 100 },
      { label: 'Minutos completados', value: a.completed, unit: 'min', comparedTo: a.prescribed },
      { label: 'Minutos faltantes', value: a.prescribed - a.completed, unit: 'min' },
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
  { id: 'sleep', dir: -1, label: 'Sono', unit: 'h' },
  { id: 'hrv', dir: -1, label: 'HRV', unit: 'ms' },
  { id: 'restingHeartRate', dir: 1, label: 'FC de repouso', unit: 'bpm' },
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
    .map((r) => `${r.sig.label} ${fmt(r.m)} ${r.sig.unit} (base ${fmt(r.b.mean)} ${r.sig.unit})`)
    .join('; ');
  return {
    ruleId: 'fast-cluster-overload',
    severity: 'attention',
    variables: flagged.map((r) => r.sig.id),
    title: `Padrão de ${GUIDANCE.composite.patternName}: ${flagged.map((r) => `${r.sig.label} ${arrow(r)}`).join(', ')}`,
    explanation:
      `${flagged.length} de 3 sinais rápidos desviaram juntos, na direção esperada, nos últimos ${cfg.windowDays} dias: ${list}. ` +
      `Nenhum deles isoladamente justificaria um alerta forte; o padrão conjunto é compatível com ${GUIDANCE.composite.patternName}, não com uma noite ruim.`,
    arithmetic:
      `z(${cfg.windowDays}d) = (média ${cfg.windowDays} dias − média pré-voo) / DP: ` +
      rows.map((r) => `${r.sig.label} ${signed(r.z, 2)}`).join('; ') +
      ` → ${flagged.length} sinais com |z| ≥ ${fmt(cfg.zThreshold)} na direção de sobrecarga (mínimo ${cfg.minSignals}) ${baselineTag(rows[0].b)}`,
    evidence: rows.map((r) => ({
      label: `${r.sig.label} (média ${cfg.windowDays} dias)`,
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
    `Massa corporal ${signed(m.pctChange)}% em relação ao pré-voo (${fmt(m.baseline.mean)} → ${fmt(m.current)} kg)` +
    (m.pctChangeVsEarlier !== null ? `, ${signed(m.pctChangeVsEarlier)}% nas últimas ${weeks} semanas` : '');
  const adhText = `No mesmo período de ${weeks} semanas, ${pct(a.ratio)} da carga de exercício prescrita foi completada (${fmt(a.completed, 0)} de ${fmt(a.prescribed, 0)} min).`;

  return {
    ruleId: 'mass-exercise-association',
    severity: critical ? 'critical' : 'attention',
    variables: critical ? ['bodyMass', 'exerciseLoad', 'bloodPressure'] : ['bodyMass', 'exerciseLoad'],
    title: critical
      ? 'Descondicionamento em múltiplos sistemas com contramedida abaixo da prescrição'
      : 'Perda de massa associada à baixa aderência ao exercício',
    explanation:
      `${massText}. ${adhText} Os dois podem estar relacionados — o sistema associa os sinais na mesma janela, não afirma causa.` +
      (critical
        ? ` Ao mesmo tempo, a pressão arterial se afasta do seu padrão individual: sistólica ${fmt(bp!.evidence[0].value, 0)} mmHg vs. base ${fmt(bp!.evidence[0].comparedTo ?? 0)} mmHg. ` +
          `Três sinais de sistemas diferentes (musculoesquelético, cardiovascular e contramedida) justificam avaliação médica.`
        : ''),
    arithmetic:
      `massa: %Δ = (${fmt(m.current, 2)} − ${fmt(m.baseline.mean, 2)}) / ${fmt(m.baseline.mean, 2)} = ${signed(m.pctChange, 2)}% ≤ ${fmt(cfg.massLossThresholdPct)}%; ` +
      `aderência ${cfg.windowDays}d = ${fmt(a.completed, 0)} / ${fmt(a.prescribed, 0)} = ${pct(a.ratio, 1)} < ${pct(cfg.minAdherence)}` +
      (critical ? `; pressão: ${bp!.arithmetic}` : ` ${baselineTag(m.baseline)}`),
    evidence: [
      ...massEvidence(m),
      { label: `Aderência ao exercício (${cfg.windowDays} dias)`, value: round(a.ratio * 100), unit: '%', comparedTo: cfg.minAdherence * 100 },
      { label: `Minutos completados (${cfg.windowDays} dias)`, value: a.completed, unit: 'min', comparedTo: a.prescribed },
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
