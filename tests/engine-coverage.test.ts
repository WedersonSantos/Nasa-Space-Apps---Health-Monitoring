import { describe, expect, it } from 'vitest';
import { evaluate } from '../src/engine';
import { SCENARIOS } from '../src/data/scenarios';
import { VARIABLE_IDS, type Measurement, type VariableId } from '../src/types/contract';
import { AST, asOfDay, buildDays } from './helpers';

const dayOf = (m: Measurement) => Number(m.id.split('-').pop());
const without = (ms: Measurement[], variable: VariableId, keep: (day: number) => boolean = () => false) =>
  ms.filter((m) => m.variable !== variable || keep(dayOf(m)));

describe('cobertura de dados (ausência de alerta ≠ normal)', () => {
  it('dados completos: todas as variáveis ok', () => {
    const s = evaluate(buildDays(21), AST, asOfDay(20));
    for (const v of VARIABLE_IDS) expect(s.coverage![v].status, v).toBe('ok');
    expect(s.coverage!.restingHeartRate.daysSinceLast).toBe(0);
    expect(s.coverage!.restingHeartRate.validDays).toBe(3);
  });

  it('sem nenhum registro de exercício: no-data, aderência numérica mas não ok', () => {
    const s = evaluate(without(buildDays(21), 'exerciseLoad'), AST, asOfDay(20));
    expect(s.overall).toBe('normal');
    expect(s.coverage!.exerciseLoad).toMatchObject({ status: 'no-data', lastAt: null, daysSinceLast: null, validDays: 0 });
    expect(s.adherence.adherenceRatio).toBe(1); // compatibilidade
    expect(s.adherence.prescribedMinutes).toBe(0);
    expect(s.coverage!.sleep.status).toBe('ok');
  });

  it('exercício parado há mais que a janela: stale, sem alerta de aderência', () => {
    const s = evaluate(without(buildDays(21), 'exerciseLoad', (d) => d <= 10), AST, asOfDay(20));
    expect(s.coverage!.exerciseLoad.status).toBe('stale');
    expect(s.coverage!.exerciseLoad.daysSinceLast).toBe(10);
    expect(s.alerts.some((a) => a.variables.includes('exerciseLoad'))).toBe(false);
  });

  it('FC sem registro há 5 dias: stale com motivo, e a regra não dispara', () => {
    // FC alta (z ≫ 1,5) até o dia 15 e depois nenhum registro.
    const ms = without(buildDays(21, (i) => (i >= 10 ? { restingHeartRate: 70 } : {})), 'restingHeartRate', (d) => d <= 15);
    const s = evaluate(ms, AST, asOfDay(20));
    const c = s.coverage!.restingHeartRate;
    expect(c.status).toBe('stale');
    expect(c.daysSinceLast).toBe(5);
    expect(c.validDays).toBe(0);
    expect(c.reason).toContain('há 5 dias');
    expect(s.alerts.some((a) => a.variables.includes('restingHeartRate'))).toBe(false);
  });

  it('pressão registrada só depois do pré-voo: no-baseline', () => {
    const s = evaluate(without(buildDays(21), 'bloodPressure', (d) => d >= 10), AST, asOfDay(20));
    expect(s.coverage!.bloodPressure.status).toBe('no-baseline');
    expect(s.coverage!.bloodPressure.reason).toContain('0 de 7');
  });

  it('pré-voo: nada é avaliado ainda', () => {
    const s = evaluate(buildDays(4), AST, asOfDay(3));
    for (const v of VARIABLE_IDS) expect(s.coverage![v].status, v).toBe('no-baseline');
    expect(s.coverage!.sleep.reason).toContain('dia 4 de 7');
  });

  it('autorrelato sem a janela anterior: stale', () => {
    const s = evaluate(without(buildDays(21), 'selfReport', (d) => d < 7 || d >= 16), AST, asOfDay(20));
    expect(s.coverage!.selfReport.status).toBe('stale');
    expect(s.coverage!.selfReport.reason).toContain('Janela anterior');
  });

  it('sem nenhuma medição: tudo no-data', () => {
    const s = evaluate([], AST, asOfDay(20));
    for (const v of VARIABLE_IDS) expect(s.coverage![v].status, v).toBe('no-data');
  });

  it.each(SCENARIOS.map((s) => [s.id, s] as const))('cenário %s: cobertura completa em asOf', (_, sc) => {
    const s = evaluate(sc.measurements, sc.profile.astronautId, sc.asOf, sc.profile);
    for (const v of VARIABLE_IDS) expect(s.coverage![v].status, v).toBe('ok');
  });
});
