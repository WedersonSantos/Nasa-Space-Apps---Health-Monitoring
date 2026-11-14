// Registro de acompanhamento das ações recomendadas pelos alertas.
// Fica no dispositivo (localStorage com reserva em memória), separado das medições: não altera a avaliação do motor.

import { useCallback, useEffect, useState } from 'react';

export type ActionKind = 'repeated-measurement' | 'cmo-contacted' | 'action-done';

export const ACTION_LABEL: Record<ActionKind, string> = {
  'repeated-measurement': 'Medição repetida',
  'cmo-contacted': 'Oficial médico acionado',
  'action-done': 'Ação concluída',
};

export interface ActionEntry {
  id: string;
  astronautId: string;
  alertId: string;
  alertTitle: string;
  kind: ActionKind;
  /** Instante no relógio da missão (fim do dia avaliado ou o horário escolhido). */
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
    /* sem armazenamento persistente: segue em memória */
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
