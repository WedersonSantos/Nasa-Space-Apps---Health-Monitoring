/** Um teste por cenário (spec §9.11 e §12): severidade final esperada e roteiro. */
import { describe, expect, it } from 'vitest';
import { evaluate, ruleIdOf } from '../src/engine';
import { SCENARIOS } from '../src/data/scenarios';
import type { AstronautState } from '../src/types/contract';
import type { ScenarioFile } from '../src/types/scenario';

const DAY = 86_400_000;
const at = (s: ScenarioFile, missionDay: number) =>
  new Date(Date.parse(s.launchDate) + (missionDay - 1) * DAY + 23.99 * 3_600_000).toISOString();
const evalAt = (s: ScenarioFile, missionDay: number): AstronautState =>
  evaluate(s.measurements, s.profile.astronautId, at(s, missionDay), s.profile);

describe.each(SCENARIOS.map((s) => [s.title, s] as const))('%s', (_, s) => {
  const state = evaluate(s.measurements, s.profile.astronautId, s.asOf, s.profile);

  it('atinge a severidade esperada em asOf', () => {
    expect(state.overall).toBe(s.expected.overall);
    expect(state.missionDay).toBe(113);
    expect(state.name).toBe(s.profile.name);
  });

  it('contém os alertas esperados', () => {
    for (const id of s.expected.ruleIds) expect(state.alerts.map(ruleIdOf)).toContain(id);
  });

  it('todo alerta tem aritmética, evidência, orientação e fonte', () => {
    for (const a of state.alerts) {
      expect(a.arithmetic.length).toBeGreaterThan(10);
      expect(a.arithmetic).toMatch(/[=<>≤≥]/);
      expect(a.evidence.length).toBeGreaterThan(0);
      expect(a.guidance.length).toBeGreaterThan(10);
      expect(a.sourceRef.length).toBeGreaterThan(0);
      expect(a.variables.length).toBeGreaterThan(0);
    }
  });

  it('toda medição é marcada como sintética e rastreável', () => {
    for (const m of s.measurements) {
      expect(m.origin).toBe('synthetic');
      expect(m.unit && m.method && m.timestamp).toBeTruthy();
    }
  });
});

describe('Cenário 1 — Nominal', () => {
  const s = SCENARIOS.find((x) => x.id === 'nominal')!;
  it('nenhum falso positivo em nenhum dia da missão', () => {
    for (let d = 1; d <= 113; d++) expect(evalAt(s, d).alerts, `dia ${d}`).toEqual([]);
  });
  it('aderência acima de 90%', () => {
    expect(evalAt(s, 113).adherence.adherenceRatio).toBeGreaterThan(0.9);
  });
});

describe('Cenário 2 — Degradação gradual', () => {
  const s = SCENARIOS.find((x) => x.id === 'gradual-degradation')!;
  it('normal antes da história; regra composta dispara entre os dias 8 e 16 da degradação', () => {
    expect(evalAt(s, 92).overall).toBe('normal');
    const first = Array.from({ length: 21 }, (_, k) => 93 + k).find((d) =>
      evalAt(s, d).alerts.some((a) => ruleIdOf(a) === 'fast-cluster-overload'),
    )!;
    expect(first - 92).toBeGreaterThanOrEqual(8);
    expect(first - 92).toBeLessThanOrEqual(16);
  });
  it('nunca chega a crítico; pressão e massa não alarmam', () => {
    for (let d = 93; d <= 113; d++) {
      const st = evalAt(s, d);
      expect(st.overall).not.toBe('critical');
      expect(st.alerts.flatMap((a) => a.variables)).not.toContain('bloodPressure');
      expect(st.alerts.flatMap((a) => a.variables)).not.toContain('bodyMass');
    }
  });
});

describe('Cenário 3 — Crítico com contramedida', () => {
  const s = SCENARIOS.find((x) => x.id === 'critical-countermeasure')!;
  const state = evaluate(s.measurements, s.profile.astronautId, s.asOf, s.profile);
  const assoc = state.alerts.find((a) => ruleIdOf(a) === 'mass-exercise-association')!;
  it('associação crítica com escalonamento', () => {
    expect(assoc.severity).toBe('critical');
    expect(assoc.escalate).toBe(true);
    expect(assoc.variables).toEqual(['bodyMass', 'exerciseLoad', 'bloodPressure']);
  });
  it('números do roteiro: massa ≈ −2% e aderência ≈ 61% em 21 dias', () => {
    const mass = assoc.evidence.find((e) => e.label === 'Change vs. preflight')!.value;
    const adh = assoc.evidence.find((e) => e.label.startsWith('Exercise adherence'))!.value;
    expect(mass).toBeLessThanOrEqual(-2);
    expect(mass).toBeGreaterThan(-3);
    expect(adh).toBeGreaterThan(50);
    expect(adh).toBeLessThan(70);
  });
  it('linguagem de possibilidade, não de causa', () => {
    expect(assoc.explanation).toMatch(/may be related/);
    expect(assoc.explanation).toMatch(/does not claim causation/);
  });
  it('alerta de aderência aparece antes do crítico', () => {
    expect(evalAt(s, 100).alerts.map(ruleIdOf)).toContain('exercise-adherence');
    expect(evalAt(s, 100).overall).toBe('attention');
  });
});
