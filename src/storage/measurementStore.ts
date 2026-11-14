/**
 * Persistência local (spec §9.10). Funciona offline por construção: falha de
 * armazenamento vira fallback em memória, nunca erro para o usuário.
 * Volume: ~1.000 medições por cenário (~200 KB) — cabe em localStorage.
 */
import type { Measurement } from '../types/contract';
import type { ScenarioFile } from '../types/scenario';
import { checkMeasurement } from '../engine/validation';

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface StoreEvent {
  type: 'scenario-loaded' | 'measurement-added' | 'measurement-rejected' | 'reset';
  at: string; // ISO 8601
  detail: string;
}

const PREFIX = 'ahm:v1';
const MAX_EVENTS = 500;

export function createMemoryStorage(): KeyValueStorage {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
  };
}

/** localStorage se disponível e gravável; senão memória. */
export function defaultStorage(): KeyValueStorage {
  try {
    const ls = (globalThis as { localStorage?: KeyValueStorage }).localStorage;
    if (ls) {
      ls.setItem(`${PREFIX}:probe`, '1');
      ls.removeItem(`${PREFIX}:probe`);
      return ls;
    }
  } catch {
    /* modo privado / bloqueado: cai para memória */
  }
  return createMemoryStorage();
}

export class MeasurementStore {
  constructor(private readonly storage: KeyValueStorage = defaultStorage()) {}

  private key(astronautId: string) {
    return `${PREFIX}:measurements:${astronautId}`;
  }

  private safeSet(key: string, value: string): boolean {
    try {
      this.storage.setItem(key, value);
      return true;
    } catch {
      return false; // cota cheia etc.: os dados seguem em memória no chamador
    }
  }

  load(astronautId: string): Measurement[] | null {
    try {
      const raw = this.storage.getItem(this.key(astronautId));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as Measurement[]) : null;
    } catch {
      return null;
    }
  }

  save(astronautId: string, measurements: Measurement[]): boolean {
    return this.safeSet(this.key(astronautId), JSON.stringify(measurements));
  }

  /** Dados gravados, ou o cenário inicial se não houver nada gravado. */
  loadOrSeed(scenario: ScenarioFile, now: string): Measurement[] {
    const stored = this.load(scenario.profile.astronautId);
    if (stored) return stored;
    return this.reset(scenario, now);
  }

  /** Substitui os dados do astronauta pelo cenário (botão de troca de cenário na demo). */
  reset(scenario: ScenarioFile, now: string): Measurement[] {
    const ms = [...scenario.measurements];
    this.save(scenario.profile.astronautId, ms);
    this.setActiveScenario(scenario.id);
    this.logEvent({ type: 'scenario-loaded', at: now, detail: scenario.id });
    return ms;
  }

  /** Valida e acrescenta uma medição. Devolve a lista atualizada ou o motivo da rejeição. */
  append(m: Measurement, now: string): { ok: true; measurements: Measurement[] } | { ok: false; error: string } {
    const error = checkMeasurement(m);
    const current = this.load(m.astronautId) ?? [];
    if (!error && current.some((x) => x.id === m.id)) {
      this.logEvent({ type: 'measurement-rejected', at: now, detail: `${m.id}: id repetido` });
      return { ok: false, error: 'medição duplicada' };
    }
    if (error) {
      this.logEvent({ type: 'measurement-rejected', at: now, detail: `${m.variable}: ${error}` });
      return { ok: false, error };
    }
    const next = [...current, m];
    this.save(m.astronautId, next);
    this.logEvent({ type: 'measurement-added', at: now, detail: `${m.variable} ${m.value}` });
    return { ok: true, measurements: next };
  }

  getActiveScenario(): string | null {
    try {
      return this.storage.getItem(`${PREFIX}:activeScenario`);
    } catch {
      return null;
    }
  }

  setActiveScenario(id: string): void {
    this.safeSet(`${PREFIX}:activeScenario`, id);
  }

  events(): StoreEvent[] {
    try {
      return JSON.parse(this.storage.getItem(`${PREFIX}:events`) ?? '[]') as StoreEvent[];
    } catch {
      return [];
    }
  }

  logEvent(e: StoreEvent): void {
    this.safeSet(`${PREFIX}:events`, JSON.stringify([...this.events(), e].slice(-MAX_EVENTS)));
  }

  clear(astronautId: string, now: string): void {
    try {
      this.storage.removeItem(this.key(astronautId));
    } catch {
      /* ignora */
    }
    this.logEvent({ type: 'reset', at: now, detail: astronautId });
  }
}
