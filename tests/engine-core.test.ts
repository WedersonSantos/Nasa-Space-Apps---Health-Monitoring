import { describe, expect, it } from 'vitest';
import { buildDailySeries, evaluate, validateMeasurements, wellbeingIndex } from '../src/engine';
import { computeBaseline } from '../src/engine/baseline';
import { createMeasurement, createSelfReport } from '../src/data/createMeasurement';
import { createMemoryStorage, MeasurementStore } from '../src/storage/measurementStore';
import { SCENARIOS } from '../src/data/scenarios';
import type { Measurement } from '../src/types/contract';
import { AST, asOfDay, buildDays, dayIso } from './helpers';

describe('baseline', () => {
  it('média e DP amostral da janela, ignorando dias sem dado', () => {
    const ms = buildDays(7, (i) => ({ restingHeartRate: [50, 52, 54, 56, 58, 60, 62][i] }));
    const series = buildDailySeries(validateMeasurements(ms, AST, asOfDay(6)).valid);
    const day0 = Math.floor(Date.parse(dayIso(0)) / 86_400_000);
    const b = computeBaseline(series, 'restingHeartRate', day0, day0 + 6, 'preflight')!;
    expect(b.mean).toBe(56);
    expect(b.stdDev).toBeCloseTo(4.3205, 3);
    expect(b.kind).toBe('preflight');
  });
  it('evaluate devolve baselines pré-voo e móveis', () => {
    const s = evaluate(buildDays(20), AST, asOfDay(19));
    expect(s.baselines.filter((b) => b.kind === 'preflight')).toHaveLength(7);
    expect(s.baselines.filter((b) => b.kind === 'rolling')).toHaveLength(7);
  });
});

describe('validação e integridade', () => {
  const ok: Measurement = {
    id: 'a', astronautId: AST, variable: 'restingHeartRate', value: 60, unit: 'bpm',
    timestamp: dayIso(0), origin: 'measured', method: 'manual',
  };
  it.each([
    ['valor fora da faixa', { value: 400 }],
    ['valor não numérico', { value: NaN }],
    ['unidade errada', { unit: 'bps' }],
    ['horário inválido', { timestamp: 'ontem' }],
    ['origem inválida', { origin: 'guess' }],
  ])('rejeita %s', (_, patch) => {
    const r = validateMeasurements([{ ...ok, ...patch } as Measurement], AST, asOfDay(1));
    expect(r.valid).toHaveLength(0);
    expect(r.rejected).toHaveLength(1);
  });
  it('rejeita duplicadas e diastólica ≥ sistólica', () => {
    const bp: Measurement = { ...ok, id: 'bp', variable: 'bloodPressure', value: 80, secondaryValue: 90, unit: 'mmHg' };
    const r = validateMeasurements([ok, { ...ok }, { ...ok, id: 'b' }, bp], AST, asOfDay(1));
    expect(r.valid).toHaveLength(1);
    expect(r.rejected.map((x) => x.reason)).toEqual([
      'duplicada: id repetido',
      'duplicada: mesma variável, horário e método',
      'incoerente: diastólica maior ou igual à sistólica',
    ]);
  });
  it('ignora outro astronauta e medições futuras', () => {
    const r = validateMeasurements([{ ...ok, astronautId: 'X' }, { ...ok, id: 'f', timestamp: dayIso(5) }], AST, asOfDay(1));
    expect(r.valid).toHaveLength(0);
    expect(r.rejected).toHaveLength(0);
  });
  it('dado inválido não entra no baseline', () => {
    const ms = buildDays(20);
    ms.push({ ...ok, id: 'bad', value: 300, timestamp: dayIso(2, 9) });
    expect(evaluate(ms, AST, asOfDay(19))).toEqual(evaluate(buildDays(20), AST, asOfDay(19)));
  });
});

describe('autorrelato', () => {
  it('índice = (humor + (6 − estresse) + (6 − fadiga)) / 3', () => {
    expect(wellbeingIndex({ mood: 4, stress: 2, fatigue: 3 })).toBeCloseTo(11 / 3);
    expect(wellbeingIndex({})).toBeNull();
  });
  it('createSelfReport gera 3 medições e valida inteiros 1–5', () => {
    const r = createSelfReport(AST, dayIso(0), { mood: 4, stress: '2', fatigue: 3 });
    expect(r.ok && r.measurements.map((m) => m.method)).toEqual(['self-report:mood', 'self-report:stress', 'self-report:fatigue']);
    expect(createSelfReport(AST, dayIso(0), { mood: 7, stress: 2, fatigue: 3 }).ok).toBe(false);
    expect(createSelfReport(AST, dayIso(0), { mood: 2.5, stress: 2, fatigue: 3 }).ok).toBe(false);
  });
});

describe('createMeasurement', () => {
  it('preenche unidade, origem e método; aceita vírgula decimal', () => {
    const r = createMeasurement({ astronautId: AST, variable: 'bodyMass', value: '74,6', timestamp: dayIso(0) });
    expect(r.ok && r.measurement).toMatchObject({ value: 74.6, unit: 'kg', origin: 'measured', method: 'manual' });
  });
  it('recusa campo vazio e pressão sem diastólica', () => {
    expect(createMeasurement({ astronautId: AST, variable: 'hrv', value: '', timestamp: dayIso(0) }).ok).toBe(false);
    expect(createMeasurement({ astronautId: AST, variable: 'bloodPressure', value: 120, timestamp: dayIso(0) }).ok).toBe(false);
  });
});

describe('pureza de evaluate()', () => {
  it('mesma entrada → mesma saída, sem mutar a entrada', () => {
    const ms = SCENARIOS[2].measurements;
    const snapshot = JSON.stringify(ms);
    const a = evaluate(ms, 'AST-01', SCENARIOS[2].asOf);
    const b = evaluate(ms, 'AST-01', SCENARIOS[2].asOf);
    expect(a).toEqual(b);
    expect(JSON.stringify(ms)).toBe(snapshot);
  });
  it('ordem das medições não altera o resultado', () => {
    const ms = [...SCENARIOS[1].measurements];
    expect(evaluate([...ms].reverse(), 'AST-01', SCENARIOS[1].asOf)).toEqual(evaluate(ms, 'AST-01', SCENARIOS[1].asOf));
  });
});

describe('persistência', () => {
  it('semeia com o cenário, acrescenta e relê', () => {
    const store = new MeasurementStore(createMemoryStorage());
    const sc = SCENARIOS[0];
    expect(store.load(sc.profile.astronautId)).toBeNull();
    const seeded = store.loadOrSeed(sc, '2026-11-14T15:00:00Z');
    expect(seeded).toHaveLength(sc.measurements.length);
    const m = createMeasurement({ astronautId: 'AST-01', variable: 'hrv', value: 50, timestamp: '2026-10-29T06:00:00Z' });
    if (!m.ok) throw new Error(m.error);
    const r = store.append(m.measurement, '2026-11-14T15:01:00Z');
    expect(r.ok).toBe(true);
    expect(store.load('AST-01')).toHaveLength(sc.measurements.length + 1);
    expect(store.append(m.measurement, '2026-11-14T15:02:00Z').ok).toBe(false);
    expect(store.getActiveScenario()).toBe('nominal');
    expect(store.events().map((e) => e.type)).toEqual(['scenario-loaded', 'measurement-added', 'measurement-rejected']);
  });
  it('storage quebrado não derruba o app', () => {
    const broken = { getItem: () => { throw new Error('x'); }, setItem: () => { throw new Error('x'); }, removeItem: () => {} };
    const store = new MeasurementStore(broken);
    expect(store.load('AST-01')).toBeNull();
    expect(store.loadOrSeed(SCENARIOS[0], '2026-11-14T15:00:00Z')).toHaveLength(SCENARIOS[0].measurements.length);
  });
});
