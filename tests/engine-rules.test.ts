/** Um teste por regra (spec §9.11), sobre séries construídas à mão. */
import { describe, expect, it } from 'vitest';
import { evaluate, ruleIdOf } from '../src/engine';
import type { AstronautState } from '../src/types/contract';
import { AST, asOfDay, buildDays } from './helpers';

const DAYS = 30;
const run = (override: Parameters<typeof buildDays>[1], days = DAYS) =>
  evaluate(buildDays(days, override), AST, asOfDay(days - 1));
const ids = (s: AstronautState) => s.alerts.map(ruleIdOf);

describe('linha de base estável', () => {
  it('não gera alerta nenhum', () => {
    const s = run(() => ({}));
    expect(s.overall).toBe('normal');
    expect(s.alerts).toEqual([]);
    expect(s.missionDay).toBe(DAYS - 7);
  });
});

describe('FC de repouso: > 1,5 DP por 3 dias consecutivos', () => {
  it('dispara com 3 dias acima', () => {
    const s = run((i) => (i >= DAYS - 3 ? { restingHeartRate: 66 } : {}));
    expect(ids(s)).toEqual(['rhr-deviation']);
    const a = s.alerts[0];
    expect(a.arithmetic).toMatch(/z = /);
    expect(a.evidence.find((e) => e.label.startsWith('Dias'))?.value).toBe(3);
  });
  it('não dispara com só 2 dias', () => {
    expect(ids(run((i) => (i >= DAYS - 2 ? { restingHeartRate: 66 } : {})))).toEqual([]);
  });
});

describe('HRV: queda > 20% por 3 dias', () => {
  it('dispara com queda de 27%', () => {
    const s = run((i) => (i >= DAYS - 3 ? { hrv: 40 } : {}));
    expect(ids(s)).toEqual(['hrv-drop']);
    expect(s.alerts[0].evidence[1].value).toBeGreaterThan(20);
  });
  it('não dispara com queda de 15%', () => {
    expect(ids(run((i) => (i >= DAYS - 3 ? { hrv: 47 } : {})))).toEqual([]);
  });
});

describe('Pressão arterial: desvio do baseline individual por 5 dias', () => {
  it('dispara abaixo do baseline mesmo em faixa clínica normal', () => {
    const s = run((i) => (i >= DAYS - 5 ? { bloodPressure: [108, 70] } : {}));
    expect(ids(s)).toEqual(['bp-deviation']);
    expect(s.alerts[0].title).toMatch(/abaixo/);
  });
  it('não dispara com 4 dias', () => {
    expect(ids(run((i) => (i >= DAYS - 4 ? { bloodPressure: [108, 70] } : {})))).toEqual([]);
  });
});

describe('Sono: déficit acumulado > 7 h em 7 noites', () => {
  it('dispara com 6 h/noite (déficit 14 h)', () => {
    const s = run((i) => (i >= DAYS - 7 ? { sleep: [6, 3] } : {}));
    expect(ids(s)).toContain('sleep-deficit');
    expect(s.alerts.find((a) => ruleIdOf(a) === 'sleep-deficit')!.arithmetic).toMatch(/14,0 h/);
  });
  it('não dispara com 7,2 h/noite (déficit 5,6 h)', () => {
    expect(ids(run((i) => (i >= DAYS - 7 ? { sleep: [7.2, 4] } : {})))).toEqual([]);
  });
});

describe('Autorrelato: queda em janela móvel de 5 dias', () => {
  it('dispara com queda de 4 → 3', () => {
    expect(ids(run((i) => (i >= DAYS - 5 ? { selfReport: 3 } : {})))).toEqual(['selfreport-decline']);
  });
  it('não dispara com queda pequena', () => {
    expect(ids(run((i) => (i >= DAYS - 5 ? { selfReport: 3.7 } : {})))).toEqual([]);
  });
});

describe('Massa corporal: %Δ ≤ −2% do pré-voo', () => {
  it('dispara com −2,7%', () => {
    const s = run((i) => (i >= DAYS - 7 ? { bodyMass: 73 } : {}));
    expect(ids(s)).toEqual(['mass-loss']);
  });
  it('não dispara com −1%', () => {
    expect(ids(run((i) => (i >= DAYS - 7 ? { bodyMass: 74.25 } : {})))).toEqual([]);
  });
});

describe('Exercício: aderência < 80% em 7 dias', () => {
  it('dispara com 60%', () => {
    const s = run((i) => (i >= DAYS - 7 ? { exerciseLoad: [90, 150] } : {}));
    expect(ids(s)).toEqual(['exercise-adherence']);
    expect(s.adherence.adherenceRatio).toBeCloseTo(0.6);
  });
  it('não dispara com 85%', () => {
    expect(ids(run((i) => (i >= DAYS - 7 ? { exerciseLoad: [128, 150] } : {})))).toEqual([]);
  });
});

describe('Regra composta (cluster rápido)', () => {
  it('2 de 3 sinais em desvio moderado → sobrecarga, sem alertas isolados', () => {
    // Desvios moderados: nenhuma regra isolada dispara (HRV −13%, FC +3 bpm por só 2 dias acima de 1,5 DP).
    const s = run((i) => (i >= DAYS - 5 ? { hrv: 48, restingHeartRate: 61 } : {}));
    expect(ids(s)).toEqual(['fast-cluster-overload']);
    expect(s.alerts[0].variables.sort()).toEqual(['hrv', 'restingHeartRate']);
    expect(s.alerts[0].evidence).toHaveLength(3);
    expect(s.overall).toBe('attention');
  });
  it('sinal em direção contrária bloqueia o padrão', () => {
    const s = run((i) => (i >= DAYS - 5 ? { hrv: 48, restingHeartRate: 61, sleep: [8.6, 5] } : {}));
    expect(ids(s)).not.toContain('fast-cluster-overload');
  });
  it('absorve os alertas isolados das variáveis que explica', () => {
    const s = run((i) => (i >= DAYS - 7 ? { sleep: [6, 3], hrv: 40, restingHeartRate: 66 } : {}));
    expect(ids(s)).toEqual(['fast-cluster-overload']);
  });
});

describe('Associação massa ↔ exercício', () => {
  const days = 40;
  it('associa perda de massa e baixa aderência em 21 dias (atenção)', () => {
    const s = run((i) => (i >= days - 21 ? { exerciseLoad: [90, 150], ...(i >= days - 7 ? { bodyMass: 73 } : {}) } : {}), days);
    expect(ids(s)).toEqual(['mass-exercise-association']);
    const a = s.alerts[0];
    expect(a.severity).toBe('attention');
    expect(a.escalate).toBe(false);
    expect(a.explanation).toMatch(/podem estar relacionados/);
    expect(a.explanation).not.toMatch(/causou|causa a|devido a/);
  });
  it('com pressão arterial também em desvio → crítico com escalonamento', () => {
    const s = run(
      (i) => (i >= days - 21 ? { exerciseLoad: [90, 150], ...(i >= days - 7 ? { bodyMass: 73, bloodPressure: [106, 70] } : {}) } : {}),
      days,
    );
    expect(ids(s)).toEqual(['mass-exercise-association']);
    expect(s.overall).toBe('critical');
    expect(s.alerts[0].escalate).toBe(true);
    expect(s.alerts[0].variables).toContain('bloodPressure');
    expect(s.alerts[0].guidance).toMatch(/oficial médico/);
  });
});

describe('início do alerta (raisedAt)', () => {
  it('aponta o primeiro dia da sequência, não o dia de avaliação', () => {
    const s = run((i) => (i >= DAYS - 5 ? { restingHeartRate: 66 } : {}));
    // 3º dia consecutivo = DAYS − 3
    expect(s.alerts[0].raisedAt.slice(0, 10)).toBe(asOfDay(DAYS - 3).slice(0, 10));
  });
});

describe('pré-voo', () => {
  it('não avalia regras enquanto o baseline está sendo formado', () => {
    const s = evaluate(buildDays(5, () => ({ restingHeartRate: 90 })), AST, asOfDay(4));
    expect(s.alerts).toEqual([]);
    expect(s.missionDay).toBeLessThanOrEqual(0);
  });
});
