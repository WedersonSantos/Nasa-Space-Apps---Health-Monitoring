// Histórico da missão para a trilha: o estado geral de cada dia e o início de cada alerta.
// Reavalia o motor (função pura) no fim de cada dia de missão; nenhuma regra mora aqui.

import type { Measurement, Severity } from '../types/contract';
import type { ScenarioFile } from '../types/scenario';
import { endOfMissionDay, evaluateState, missionDayOf } from '../integration/dataSource';

export interface DayStatus {
  day: number;
  overall: Severity;
}

export interface AlertOnset {
  id: string;
  day: number;
  severity: Severity;
  title: string;
}

export interface MissionHistory {
  days: DayStatus[];
  onsets: AlertOnset[];
}

const RANK: Record<Severity, number> = { normal: 0, attention: 1, critical: 2 };

export function computeMissionHistory(
  measurements: Measurement[],
  scenario: ScenarioFile,
  maxDay: number,
): MissionHistory {
  const days: DayStatus[] = [];
  const onsets = new Map<string, AlertOnset>();
  for (let day = 1; day <= maxDay; day++) {
    const state = evaluateState(measurements, scenario, endOfMissionDay(day, scenario.launchDate));
    days.push({ day, overall: state.overall });
    for (const a of state.alerts) {
      const prev = onsets.get(a.id);
      if (!prev) {
        onsets.set(a.id, {
          id: a.id,
          day: missionDayOf(a.raisedAt, scenario.launchDate),
          severity: a.severity,
          title: a.title,
        });
      } else if (RANK[a.severity] > RANK[prev.severity]) {
        onsets.set(a.id, { ...prev, severity: a.severity });
      }
    }
  }
  return { days, onsets: [...onsets.values()].sort((a, b) => a.day - b.day) };
}
