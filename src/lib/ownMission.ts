// "Minha missão": uso próprio, separado da demonstração.
// Perfil e modo ficam no dispositivo (prefixo ahm:v1, como a persistência do Bloco A); as medições usam a
// MeasurementStore com o astronautId do perfil, numa chave diferente da do tripulante de demonstração.

import type { Measurement } from '../types/contract';
import { BASELINE } from '../engine';

export type AppMode = 'demo' | 'own';

export interface OwnProfile {
  astronautId: string;
  /** Apelido ou identificação fictícia — nunca dados pessoais. */
  name: string;
  createdAt: string;
}

const MODE_KEY = 'ahm:v1:mode';
const PROFILE_KEY = 'ahm:v1:own-profile';
const DAY_MS = 86_400_000;

function get(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function set(key: string, value: string | null) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* sem armazenamento: o modo vale só nesta sessão */
  }
}

export function loadMode(): AppMode {
  return get(MODE_KEY) === 'own' ? 'own' : 'demo';
}
export function saveMode(mode: AppMode) {
  set(MODE_KEY, mode);
}

export function loadOwnProfile(): OwnProfile | null {
  try {
    const raw = get(PROFILE_KEY);
    const p = raw ? (JSON.parse(raw) as OwnProfile) : null;
    return p && typeof p.astronautId === 'string' && typeof p.name === 'string' ? p : null;
  } catch {
    return null;
  }
}
export function saveOwnProfile(p: OwnProfile | null) {
  set(PROFILE_KEY, p ? JSON.stringify(p) : null);
}

export function createOwnProfile(name: string, nowIso: string): OwnProfile {
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return { astronautId: `USR-${suffix}`, name: name.trim(), createdAt: nowIso };
}

/**
 * Lançamento da missão própria, na mesma convenção do motor: primeiro dia com registro + dias de pré-voo.
 * Sem registros, o primeiro registro seria hoje.
 */
export function ownLaunchDate(measurements: Measurement[], nowIso: string): string {
  const first = measurements.reduce<string | null>((min, m) => (min == null || m.timestamp < min ? m.timestamp : min), null);
  const base = Date.parse(first ?? nowIso);
  const startOfDay = Math.floor(base / DAY_MS) * DAY_MS;
  return new Date(startOfDay + BASELINE.preflightDays * DAY_MS).toISOString();
}
