// "My mission": personal use, separate from the demo.
// The crew roster and the mode stay on the device (ahm:v1 prefix, like Bloco A persistence). Each crew member
// has their own astronautId, so measurements (MeasurementStore) and actions (actionLog) stay separate per person.

import type { Measurement } from '../types/contract';
import { BASELINE } from '../engine';
import type { L10n } from '../i18n';

export type AppMode = 'demo' | 'own';

export type CrewRole = 'commander' | 'pilot' | 'flight-engineer' | 'mission-specialist' | 'payload-specialist' | 'medical-officer';

export const CREW_ROLES: CrewRole[] = [
  'commander',
  'pilot',
  'flight-engineer',
  'mission-specialist',
  'payload-specialist',
  'medical-officer',
];

export const CREW_ROLE_LABEL: Record<CrewRole, L10n> = {
  commander: { en: 'Commander', pt: 'Comandante' },
  pilot: { en: 'Pilot', pt: 'Piloto' },
  'flight-engineer': { en: 'Flight engineer', pt: 'Engenheiro de voo' },
  'mission-specialist': { en: 'Mission specialist', pt: 'Especialista de missão' },
  'payload-specialist': { en: 'Payload specialist', pt: 'Especialista de carga útil' },
  'medical-officer': { en: 'Crew medical officer', pt: 'Oficial médico da tripulação' },
};

/** Largest crew the roster accepts (long-duration ISS crews have up to 7 people). */
export const CREW_MAX = 8;
export const NAME_MIN = 2;
export const NAME_MAX = 40;
export const MISSION_NAME_MAX = 40;

export interface CrewMember {
  astronautId: string;
  /** Nickname, call sign or fictitious ID — never personal data. */
  name: string;
  role: CrewRole;
  createdAt: string;
}

/** Kept for compatibility with the single-profile version. */
export type OwnProfile = CrewMember;

export interface Crew {
  missionName: string;
  members: CrewMember[];
  /** Crew member whose data is on screen. */
  activeId: string;
}

const MODE_KEY = 'ahm:v1:mode';
const CREW_KEY = 'ahm:v1:own-crew';
/** Single profile saved by the previous version; migrated into a one-person crew. */
const LEGACY_PROFILE_KEY = 'ahm:v1:own-profile';
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
    /* no storage: the data lasts only for this session */
  }
}

export function loadMode(): AppMode {
  return get(MODE_KEY) === 'own' ? 'own' : 'demo';
}
export function saveMode(mode: AppMode) {
  set(MODE_KEY, mode);
}

const isRole = (r: unknown): r is CrewRole => typeof r === 'string' && (CREW_ROLES as string[]).includes(r);

function validMember(m: unknown): m is CrewMember {
  const x = m as CrewMember;
  return !!x && typeof x.astronautId === 'string' && typeof x.name === 'string' && isRole(x.role);
}

export function loadCrew(): Crew | null {
  try {
    const raw = get(CREW_KEY);
    if (raw) {
      const c = JSON.parse(raw) as Crew;
      const members = Array.isArray(c?.members) ? c.members.filter(validMember) : [];
      if (!members.length) return null;
      const activeId = members.some((m) => m.astronautId === c.activeId) ? c.activeId : members[0].astronautId;
      return { missionName: typeof c.missionName === 'string' ? c.missionName : '', members, activeId };
    }
    // Migration: the old single profile becomes the first crew member (same astronautId, so its data is kept).
    const legacy = get(LEGACY_PROFILE_KEY);
    if (legacy) {
      const p = JSON.parse(legacy) as Partial<CrewMember>;
      if (typeof p.astronautId === 'string' && typeof p.name === 'string') {
        const crew: Crew = {
          missionName: '',
          members: [{ astronautId: p.astronautId, name: p.name, role: 'commander', createdAt: p.createdAt ?? new Date().toISOString() }],
          activeId: p.astronautId,
        };
        saveCrew(crew);
        set(LEGACY_PROFILE_KEY, null);
        return crew;
      }
    }
    return null;
  } catch {
    return null;
  }
}
export function saveCrew(c: Crew | null) {
  set(CREW_KEY, c ? JSON.stringify(c) : null);
}

export function activeMember(c: Crew | null): CrewMember | null {
  return c?.members.find((m) => m.astronautId === c.activeId) ?? null;
}

function newId(taken: Set<string>): string {
  for (;;) {
    const id = `USR-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    if (!taken.has(id)) return id;
  }
}

export function createCrewMember(name: string, role: CrewRole, nowIso: string, taken: Set<string> = new Set()): CrewMember {
  return { astronautId: newId(taken), name: name.trim(), role, createdAt: nowIso };
}

/** Problem with a crew member's nickname, or null when it is valid. */
export function crewNameError(name: string, crew: Crew | null, exceptId?: string): L10n | null {
  const n = name.trim();
  if (n.length < NAME_MIN)
    return { en: `Enter a nickname of at least ${NAME_MIN} letters.`, pt: `Escreva um apelido com pelo menos ${NAME_MIN} letras.` };
  if (n.length > NAME_MAX)
    return { en: `Use at most ${NAME_MAX} characters.`, pt: `Use no máximo ${NAME_MAX} caracteres.` };
  const dup = crew?.members.some((m) => m.astronautId !== exceptId && m.name.trim().toLowerCase() === n.toLowerCase());
  if (dup) return { en: 'Another crew member already uses this nickname.', pt: 'Outro tripulante já usa este apelido.' };
  return null;
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
