/**
 * Integridade (spec §7.2): valida entradas, ausentes, duplicidades e medições
 * incoerentes. Dado inválido não entra no cálculo de baseline nem de regra.
 */
import { VARIABLE_IDS, type Measurement } from '../types/contract';
import { EXPECTED_UNITS, PLAUSIBLE_RANGES } from './config/thresholds';

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
export function checkMeasurement(m: Measurement): string | null {
  if (!m || typeof m !== 'object') return 'registro vazio';
  if (!m.id) return 'sem id';
  if (!m.astronautId) return 'sem astronautId';
  if (!VARIABLE_IDS.includes(m.variable)) return `variável desconhecida: ${String(m.variable)}`;
  if (!ORIGINS.has(m.origin)) return `origem inválida: ${String(m.origin)}`;
  if (!m.method) return 'sem método de obtenção';
  if (!m.timestamp || Number.isNaN(Date.parse(m.timestamp))) return 'horário ausente ou inválido';
  if (m.unit !== EXPECTED_UNITS[m.variable])
    return `unidade '${m.unit}' diferente da esperada '${EXPECTED_UNITS[m.variable]}'`;
  if (typeof m.value !== 'number' || !Number.isFinite(m.value)) return 'valor ausente ou não numérico';

  const range = PLAUSIBLE_RANGES[m.variable];
  if (m.value < range.min || m.value > range.max)
    return `valor ${m.value} fora da faixa plausível ${range.min}–${range.max}`;

  if (range.secondary) {
    const s = m.secondaryValue;
    if (s === undefined || s === null) {
      if (range.secondary.required) return 'valor secundário obrigatório ausente';
    } else if (typeof s !== 'number' || !Number.isFinite(s)) {
      return 'valor secundário não numérico';
    } else if (s < range.secondary.min || s > range.secondary.max) {
      return `valor secundário ${s} fora da faixa plausível ${range.secondary.min}–${range.secondary.max}`;
    }
  }

  if (m.variable === 'bloodPressure' && m.secondaryValue !== undefined && m.secondaryValue >= m.value)
    return 'incoerente: diastólica maior ou igual à sistólica';

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
): ValidationResult {
  const asOfMs = Date.parse(asOf);
  const valid: Measurement[] = [];
  const rejected: RejectedMeasurement[] = [];
  const seenIds = new Set<string>();
  const seenKeys = new Set<string>();

  for (const m of measurements) {
    if (m?.astronautId !== astronautId) continue;
    const reason = checkMeasurement(m);
    if (reason) {
      rejected.push({ measurement: m, reason });
      continue;
    }
    if (Date.parse(m.timestamp) > asOfMs) continue;

    const key = `${m.variable}|${Date.parse(m.timestamp)}|${m.method}`;
    if (seenIds.has(m.id)) {
      rejected.push({ measurement: m, reason: 'duplicada: id repetido' });
      continue;
    }
    if (seenKeys.has(key)) {
      rejected.push({ measurement: m, reason: 'duplicada: mesma variável, horário e método' });
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
