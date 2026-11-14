/**
 * Função de fronteira entre os blocos (spec §8). PURA: mesmas entradas, mesma
 * saída; sem storage, sem relógio do sistema, sem mutar a entrada.
 */
import { VARIABLE_IDS, type Alert, type AstronautState, type Measurement, type Severity, type VariableId } from '../types/contract';
import type { AstronautProfile } from '../types/scenario';
import { preflightBaselines, rollingBaselines } from './baseline';
import { BASELINE, RULES } from './config/thresholds';
import { computeCoverage } from './coverage';
import { ALL_RULES, SINGLE_RULES, adherenceOver, type RuleContext, type RuleHit, type RuleId } from './rules';
import { buildDailySeries } from './series';
import { dayNumber, dayToDate, dayToIso } from './util';
import { validateMeasurements } from './validation';

const SEVERITY_RANK: Record<Severity, number> = { normal: 0, attention: 1, critical: 2 };

export function maxSeverity(xs: Severity[]): Severity {
  return xs.reduce<Severity>((a, b) => (SEVERITY_RANK[b] > SEVERITY_RANK[a] ? b : a), 'normal');
}

/** Extrai o ruleId do Alert.id (`${astronautId}:${ruleId}:${YYYY-MM-DD}`). */
export function ruleIdOf(alert: Alert): RuleId {
  const parts = alert.id.split(':');
  return parts[parts.length - 2] as RuleId;
}

export function evaluate(
  measurements: Measurement[],
  astronautId: string,
  asOf: string,
  profile?: AstronautProfile,
): AstronautState {
  const asOfDay = dayNumber(asOf);
  const { valid } = validateMeasurements(measurements, astronautId, asOf);
  const series = buildDailySeries(valid);

  const firstDay = valid.length ? dayNumber(valid[0].timestamp) : asOfDay;
  const launchDay = firstDay + BASELINE.preflightDays;
  const preflight = preflightBaselines(series, firstDay, asOfDay);
  const rolling = rollingBaselines(series, asOfDay);

  const ctx = (day: number): RuleContext => ({ series, preflight, day });
  const alerts: Alert[] = [];

  // Regras só avaliam em voo: durante o pré-voo o baseline ainda está sendo formado.
  if (asOfDay >= launchDay) {
    const now = ctx(asOfDay);
    const singles = (Object.keys(SINGLE_RULES) as (keyof typeof SINGLE_RULES)[])
      .map((id) => SINGLE_RULES[id](now))
      .filter((h): h is RuleHit => h !== null);
    const composite = ALL_RULES['fast-cluster-overload'](now);
    const association = ALL_RULES['mass-exercise-association'](now);

    // Alertas compostos absorvem os alertas isolados das variáveis que explicam.
    const absorbed = new Set<VariableId>([...(composite?.variables ?? []), ...(association?.variables ?? [])]);
    const hits = [
      ...[association, composite].filter((h): h is RuleHit => h !== null),
      ...singles.filter((h) => !absorbed.has(h.variables[0])),
    ];

    for (const hit of hits) {
      const onset = findOnset(hit.ruleId, asOfDay, launchDay, ctx);
      alerts.push({
        id: `${astronautId}:${hit.ruleId}:${dayToDate(onset)}`,
        astronautId,
        severity: hit.severity,
        variables: hit.variables,
        title: hit.title,
        explanation: hit.explanation,
        arithmetic: hit.arithmetic,
        evidence: hit.evidence,
        guidance: hit.guidance,
        sourceRef: hit.sourceRef,
        escalate: hit.escalate,
        raisedAt: dayToIso(onset),
      });
    }
    alerts.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || b.variables.length - a.variables.length);
  }

  const adh = adherenceOver(ctx(asOfDay), RULES.exerciseLoad.windowDays);
  const latest = {} as Record<VariableId, Measurement | null>;
  for (const v of VARIABLE_IDS) latest[v] = null;
  for (const m of valid) latest[m.variable] = m; // `valid` está ordenado por horário

  return {
    astronautId,
    name: profile?.name ?? astronautId,
    missionDay: asOfDay - launchDay + 1,
    overall: maxSeverity(alerts.map((a) => a.severity)),
    alerts,
    baselines: [...Object.values(preflight), ...Object.values(rolling)],
    adherence: {
      astronautId,
      prescribedMinutes: adh.prescribed,
      completedMinutes: adh.completed,
      adherenceRatio: adh.ratio ?? 1,
      windowDays: RULES.exerciseLoad.windowDays,
    },
    latest,
    coverage: computeCoverage({ series, preflight, valid, asOfDay, firstDay, launchDay }),
  };
}

/** Primeiro dia da sequência contínua (até `asOfDay`) em que a regra dispara. */
function findOnset(ruleId: RuleId, asOfDay: number, launchDay: number, ctx: (d: number) => RuleContext): number {
  const rule = ALL_RULES[ruleId];
  let onset = asOfDay;
  for (let d = asOfDay - 1; d >= launchDay; d--) {
    if (!rule(ctx(d))) break;
    onset = d;
  }
  return onset;
}
