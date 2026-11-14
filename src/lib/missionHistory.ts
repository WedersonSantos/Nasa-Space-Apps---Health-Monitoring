// Mission history for the track: each day's overall status and when each alert began.
// Re-runs the engine (pure function) at the end of each mission day; no rule lives here.

import type { Measurement, Severity } from '../types/contract';
import { endOfMissionDay, evaluateState, missionDayOf, type MissionContext } from '../integration/dataSource';

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
  scenario: MissionContext,
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
