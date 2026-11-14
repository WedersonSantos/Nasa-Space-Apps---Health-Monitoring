// "My mission": personal use, separate from the demo.
// Profile and mode stay on the device (ahm:v1 prefix, like Bloco A persistence); measurements use the
// MeasurementStore with the profile's astronautId, under a different key from the demo crew member.

import type { Measurement } from '../types/contract';
import { BASELINE } from '../engine';

export type AppMode = 'demo' | 'own';

export interface OwnProfile {
  astronautId: string;
  /** Nickname or fictitious ID — never personal data. */
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
    /* no storage: the mode lasts only for this session */
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
 * Launch of the own mission, using the engine's convention: first day with data + pre-flight days.
 * With no entries, the first entry would be today.
 */
export function ownLaunchDate(measurements: Measurement[], nowIso: string): string {
  const first = measurements.reduce<string | null>((min, m) => (min == null || m.timestamp < min ? m.timestamp : min), null);
  const base = Date.parse(first ?? nowIso);
  const startOfDay = Math.floor(base / DAY_MS) * DAY_MS;
  return new Date(startOfDay + BASELINE.preflightDays * DAY_MS).toISOString();
}
