// Follow-up log of the actions recommended by alerts.
// Stays on the device (localStorage with in-memory fallback), separate from measurements: it does not change the engine's evaluation.

import { useCallback, useEffect, useState } from 'react';
import type { L10n } from '../i18n';

export type ActionKind = 'repeated-measurement' | 'cmo-contacted' | 'action-done';

export const ACTION_LABEL: Record<ActionKind, L10n> = {
  'repeated-measurement': { en: 'Measurement repeated', pt: 'Medição repetida' },
  'cmo-contacted': { en: 'CMO contacted', pt: 'Oficial médico acionado' },
  'action-done': { en: 'Action completed', pt: 'Ação concluída' },
};

export interface ActionEntry {
  id: string;
  astronautId: string;
  alertId: string;
  alertTitle: string;
  kind: ActionKind;
  /** Instant on the mission clock (end of the assessed day or the chosen time). */
  at: string;
  missionDay: number;
}

const PREFIX = 'vigilia:v1:actions:';
const memory = new Map<string, string>();

function read(key: string): ActionEntry[] {
  try {
    const raw = localStorage.getItem(key) ?? memory.get(key) ?? null;
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as ActionEntry[]) : [];
  } catch {
    const raw = memory.get(key);
    return raw ? (JSON.parse(raw) as ActionEntry[]) : [];
  }
}

function write(key: string, entries: ActionEntry[]) {
  const raw = JSON.stringify(entries);
  memory.set(key, raw);
  try {
    localStorage.setItem(key, raw);
  } catch {
    /* no persistent storage: keep in memory */
  }
}

/** Erases the action log of any crew member (used when a member is removed from the roster). */
export function clearActionLog(astronautId: string) {
  const key = PREFIX + astronautId;
  memory.delete(key);
  try {
    localStorage.removeItem(key);
  } catch {
    /* no persistent storage */
  }
}

export function useActionLog(astronautId: string) {
  const key = PREFIX + astronautId;
  const [entries, setEntries] = useState<ActionEntry[]>(() => read(key));

  useEffect(() => {
    setEntries(read(key));
  }, [key]);

  const add = useCallback(
    (e: Omit<ActionEntry, 'id' | 'astronautId'>) => {
      setEntries((prev) => {
        const next = [...prev, { ...e, astronautId, id: `${e.alertId}:${e.kind}:${e.at}:${prev.length}` }];
        write(key, next);
        return next;
      });
    },
    [key, astronautId],
  );

  const remove = useCallback(
    (id: string) => {
      setEntries((prev) => {
        const next = prev.filter((x) => x.id !== id);
        write(key, next);
        return next;
      });
    },
    [key],
  );

  const clear = useCallback(() => {
    write(key, []);
    setEntries([]);
  }, [key]);

  return { entries, add, remove, clear };
}
