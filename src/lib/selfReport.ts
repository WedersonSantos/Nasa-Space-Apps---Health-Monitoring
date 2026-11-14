// Autorrelato: o baseline do motor é o índice de bem-estar (humor, estresse e fadiga combinados).
// Para comparar com ele, o índice atual também vem da função do motor — nenhuma fórmula é refeita aqui.

import type { Measurement } from '../types/contract';
import { wellbeingIndex } from '../engine';

export interface SelfReportNow {
  mood: number | null;
  stress: number | null;
  fatigue: number | null;
  index: number | null;
  timestamp: string | null;
}

export function latestSelfReport(ms: Measurement[]): SelfReportNow {
  const own = ms.filter((m) => m.variable === 'selfReport').sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  if (!own.length) return { mood: null, stress: null, fatigue: null, index: null, timestamp: null };
  const ts = own[own.length - 1].timestamp;
  const at = own.filter((m) => m.timestamp === ts);
  const pick = (method: string) => at.find((m) => m.method === method)?.value ?? null;
  const mood = pick('self-report:mood');
  const stress = pick('self-report:stress');
  const fatigue = pick('self-report:fatigue');
  const index = wellbeingIndex({ mood: mood ?? undefined, stress: stress ?? undefined, fatigue: fatigue ?? undefined });
  return { mood, stress, fatigue, index, timestamp: ts };
}
