/**
 * Integridade (spec §7.2): valida entradas, ausentes, duplicidades e medições
 * incoerentes. Dado inválido não entra no cálculo de baseline nem de regra.
 * Os motivos de rejeição saem no idioma pedido (en | pt); padrão 'en'.
 */
import { VARIABLE_IDS, type Locale, type Measurement } from '../types/contract';
import { EXPECTED_UNITS, PLAUSIBLE_RANGES } from './config/thresholds';
import { pick } from './i18n';

export interface RejectedMeasurement {
  measurement: Measurement;
  reason: string;
}

export interface ValidationResult {
  valid: Measurement[];
  rejected: RejectedMeasurement[];
}

const ORIGINS = new Set(['synthetic', 'measured', 'estimated']);

/** Motivo de rejeição de uma medição isolada, ou null se for válida. */
export function checkMeasurement(m: Measurement, locale: Locale = 'en'): string | null {
  const t = (en: string, pt: string) => pick(locale, en, pt);
  if (!m || typeof m !== 'object') return t('empty record', 'registro vazio');
  if (!m.id) return t('missing id', 'sem id');
  if (!m.astronautId) return t('missing astronautId', 'sem astronautId');
  if (!VARIABLE_IDS.includes(m.variable)) return t(`unknown variable: ${String(m.variable)}`, `variável desconhecida: ${String(m.variable)}`);
  if (!ORIGINS.has(m.origin)) return t(`invalid origin: ${String(m.origin)}`, `origem inválida: ${String(m.origin)}`);
  if (!m.method) return t('missing acquisition method', 'sem método de obtenção');
  if (!m.timestamp || Number.isNaN(Date.parse(m.timestamp))) return t('missing or invalid timestamp', 'horário ausente ou inválido');
  const unit = EXPECTED_UNITS[m.variable];
  if (m.unit !== unit) return t(`unit '${m.unit}' differs from the expected '${unit}'`, `unidade '${m.unit}' diferente da esperada '${unit}'`);
  if (typeof m.value !== 'number' || !Number.isFinite(m.value)) return t('missing or non-numeric value', 'valor ausente ou não numérico');

  const num = (x: number) => (locale === 'pt' ? String(x).replace('.', ',') : String(x));
  const range = PLAUSIBLE_RANGES[m.variable];
  if (m.value < range.min || m.value > range.max)
    return t(
      `value ${num(m.value)} outside the plausible range ${range.min}–${range.max}`,
      `valor ${num(m.value)} fora da faixa plausível ${range.min}–${range.max}`,
    );

  if (range.secondary) {
    const s = m.secondaryValue;
    const r = range.secondary;
    if (s === undefined || s === null) {
      if (r.required) return t('required secondary value is missing', 'valor secundário obrigatório ausente');
    } else if (typeof s !== 'number' || !Number.isFinite(s)) {
      return t('non-numeric secondary value', 'valor secundário não numérico');
    } else if (s < r.min || s > r.max) {
      return t(
        `secondary value ${num(s)} outside the plausible range ${r.min}–${r.max}`,
        `valor secundário ${num(s)} fora da faixa plausível ${r.min}–${r.max}`,
      );
    }
  }

  if (m.variable === 'bloodPressure' && m.secondaryValue !== undefined && m.secondaryValue >= m.value)
    return t('inconsistent: diastolic greater than or equal to systolic', 'incoerente: diastólica maior ou igual à sistólica');

  return null;
}

/**
 * Separa medições válidas e rejeitadas de um astronauta até `asOf`.
 * Medições de outros astronautas ou posteriores a `asOf` são ignoradas
 * (não são erro). Saída ordenada por horário.
 */
export function validateMeasurements(
  measurements: readonly Measurement[],
  astronautId: string,
  asOf: string,
  locale: Locale = 'en',
): ValidationResult {
  const asOfMs = Date.parse(asOf);
  const valid: Measurement[] = [];
  const rejected: RejectedMeasurement[] = [];
  const seenIds = new Set<string>();
  const seenKeys = new Set<string>();

  for (const m of measurements) {
    if (m?.astronautId !== astronautId) continue;
    const reason = checkMeasurement(m, locale);
    if (reason) {
      rejected.push({ measurement: m, reason });
      continue;
    }
    if (Date.parse(m.timestamp) > asOfMs) continue;

    const key = `${m.variable}|${Date.parse(m.timestamp)}|${m.method}`;
    if (seenIds.has(m.id)) {
      rejected.push({ measurement: m, reason: pick(locale, 'duplicate: repeated id', 'duplicada: id repetido') });
      continue;
    }
    if (seenKeys.has(key)) {
      rejected.push({
        measurement: m,
        reason: pick(locale, 'duplicate: same variable, timestamp and method', 'duplicada: mesma variável, horário e método'),
      });
      continue;
    }
    seenIds.add(m.id);
    seenKeys.add(key);
    valid.push(m);
  }

  // Desempate por id: saída independe da ordem de entrada (pureza).
  valid.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return { valid, rejected };
}
