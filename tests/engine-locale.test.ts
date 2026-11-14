import { describe, expect, it } from 'vitest';
import { evaluate, guidanceFor, sourceUsedFor, SOURCES, DISCLAIMER_BY_LOCALE, validateMeasurements } from '../src/engine';
import { createMeasurement, createSelfReport } from '../src/data/createMeasurement';
import { createMemoryStorage, MeasurementStore } from '../src/storage/measurementStore';
import { SCENARIOS } from '../src/data/scenarios';
import type { Measurement } from '../src/types/contract';
import { AST, asOfDay, buildDays, dayIso } from './helpers';

const critical = SCENARIOS.find((s) => s.id === 'critical-countermeasure')!;
const atAsOf = (locale?: 'en' | 'pt') =>
  evaluate(critical.measurements, critical.profile.astronautId, critical.asOf, critical.profile, locale ? { locale } : undefined);

describe('idioma do texto emitido (en | pt)', () => {
  it('padrão é inglês', () => {
    const s = atAsOf();
    expect(s.alerts[0].title).toBe('Multi-system deconditioning with countermeasure below prescription');
    expect(s.alerts[0].explanation).toMatch(/−2\.3%/);
  });

  it('pt: mesmo resultado, texto em português com vírgula decimal e data dd/mm', () => {
    const en = atAsOf('en');
    const pt = atAsOf('pt');
    // A decisão não depende do idioma.
    expect(pt.alerts.map((a) => a.id)).toEqual(en.alerts.map((a) => a.id));
    expect(pt.alerts.map((a) => a.severity)).toEqual(en.alerts.map((a) => a.severity));
    expect(pt.alerts.map((a) => a.evidence.map((e) => e.value))).toEqual(en.alerts.map((a) => a.evidence.map((e) => e.value)));
    expect(pt.alerts.map((a) => a.sourceRef)).toEqual(en.alerts.map((a) => a.sourceRef));
    expect(pt.overall).toBe('critical');

    const a = pt.alerts[0];
    expect(a.title).toBe('Descondicionamento em múltiplos sistemas com contramedida abaixo da prescrição');
    expect(a.explanation).toMatch(/−2,3%/);
    expect(a.explanation).toMatch(/podem estar relacionados/);
    expect(a.explanation).toMatch(/não afirma causa/);
    expect(a.guidance).toMatch(/oficial médico/);
    expect(a.arithmetic).toMatch(/\[baseline pré-voo 01\/07–07\/07\]/);
    expect(a.evidence.find((e) => e.label === 'Variação vs. pré-voo')).toBeDefined();
  });

  it('pt: motivos de cobertura em português, status idêntico', () => {
    const ms = buildDays(21).filter((m) => m.variable !== 'restingHeartRate' || Number(m.id.split('-').pop()) <= 15);
    const en = evaluate(ms, AST, asOfDay(20));
    const pt = evaluate(ms, AST, asOfDay(20), undefined, { locale: 'pt' });
    expect(pt.coverage!.restingHeartRate.status).toBe(en.coverage!.restingHeartRate.status);
    expect(pt.coverage!.restingHeartRate.reason).toContain('último registro há 5 dias');
    expect(pt.coverage!.sleep.reason).toMatch(/^Avaliado/);
  });

  it('pt: validação, criação de medição e store', () => {
    expect(createMeasurement({ astronautId: AST, variable: 'bodyMass', value: '', timestamp: dayIso(0) }, 'pt')).toEqual({
      ok: false,
      error: 'Preencha o valor.',
    });
    const r = createMeasurement({ astronautId: AST, variable: 'restingHeartRate', value: '300', timestamp: dayIso(0) }, 'pt');
    expect(!r.ok && r.error).toBe('valor 300 fora da faixa plausível 30–130');
    const sr = createSelfReport(AST, dayIso(0), { mood: 2.5, stress: 3, fatigue: 3 }, 'pt');
    expect(!sr.ok && sr.error).toBe('humor: use um inteiro de 1 a 5');

    const ok: Measurement = buildDays(1)[0];
    const v = validateMeasurements([ok, { ...ok }], AST, asOfDay(1), 'pt');
    expect(v.rejected[0].reason).toBe('duplicada: id repetido');

    const store = new MeasurementStore(createMemoryStorage());
    store.append(ok, dayIso(1));
    const dup = store.append({ ...ok }, dayIso(1), 'pt');
    expect(!dup.ok && dup.error).toBe('medição duplicada');
  });

  it('textos estáticos nos dois idiomas', () => {
    expect(DISCLAIMER_BY_LOCALE.pt).toMatch(/não faz diagnóstico/);
    expect(guidanceFor('pt').composite.patternName).toBe('sobrecarga');
    expect(sourceUsedFor(SOURCES.NASA_SP_2025_DECONDITIONING, 'pt')).toMatch(/2,5 h\/dia/);
    expect(sourceUsedFor(SOURCES.NASA_SP_2025_DECONDITIONING, 'en')).toMatch(/2\.5 h\/day/);
  });
});
