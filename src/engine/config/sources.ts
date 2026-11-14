/**
 * Referências citadas pelo motor. Toda regra aponta para uma destas chaves.
 * Registro da busca: docs/busca-de-dados.md.
 */
import type { Locale } from '../../types/contract';

export interface SourceRef {
  short: string;
  title: string;
  url: string;
  /** O que exatamente usamos desta fonte (inglês). */
  usedFor: string;
  /** O mesmo, em português. */
  usedForPt: string;
}

export const SOURCES = {
  NASA_HRP_HAZARDS: {
    short: 'NASA HRP — 5 Hazards',
    title: 'NASA Human Research Program — 5 Hazards of Human Spaceflight',
    url: 'https://www.nasa.gov/hrp/hazards/',
    usedFor: 'Framing of the five hazards; starting point for every indicator.',
    usedForPt: 'Enquadramento dos cinco perigos; ponto de partida de cada indicador.',
  },
  NASA_HRP_RISKS: {
    short: 'NASA HRP — Risks',
    title: 'NASA Human Research Program — Risks of Human Spaceflight',
    url: 'https://www.nasa.gov/hrp/risks/',
    usedFor: 'Risk → indicator mapping.',
    usedForPt: 'Mapeamento risco → indicador.',
  },
  NASA_HRR_SLEEP: {
    short: 'NASA HRR — Sleep Evidence Report',
    title:
      'NASA Human Research Roadmap — Evidence Report: Risk of Performance Decrements and Adverse Health Outcomes Resulting from Sleep Loss, Circadian Desynchronization, and Work Overload',
    url: 'https://humanresearchroadmap.nasa.gov/evidence/reports/Sleep.pdf',
    usedFor:
      'Average in-flight sleep ≈ 6 h/night, almost 2 h below the 8 h recommended by NASA-STD-3001 Vol. 1 → 8 h prescription.',
    usedForPt: 'Sono médio em voo ≈ 6 h/noite, quase 2 h abaixo das 8 h recomendadas pelo NASA-STD-3001 Vol. 1 → prescrição de 8 h.',
  },
  NASA_AMES_SLEEP_FACT: {
    short: 'NASA Ames — Interesting Fact 2022',
    title: 'NASA Ames — Interesting Fact of the Month 2022 (astronaut sleep)',
    url: 'https://www.nasa.gov/space-science-and-astrobiology-at-ames/interesting-fact-of-the-month-current/interesting-fact-of-the-month-2022/',
    usedFor: 'Schedule allots ~8.5 h of sleep; astronauts sleep ~6 h on average.',
    usedForPt: 'Agenda prevê ~8,5 h de sono; astronautas dormem ~6 h em média.',
  },
  NASA_SP_2025_DECONDITIONING: {
    short: 'NASA/SP-20250000273',
    title: 'NASA/SP-20250000273 (Jan. 2025) — Astronaut physiological deconditioning',
    url: 'https://www.nasa.gov/wp-content/uploads/2025/02/sp-20250000273.pdf',
    usedFor:
      'Exercise prescription of 2.5 h/day, 6 days/week; bone mineral density loss of 0.5–1.5%/month.',
    usedForPt: 'Prescrição de exercício de 2,5 h/dia, 6 dias/semana; perda de densidade mineral óssea de 0,5–1,5%/mês.',
  },
  NASA_ASTRONAUT_EXERCISE: {
    short: 'NASA — Astronaut Exercise',
    title: 'NASA — Astronaut Exercise (ISS Research)',
    url: 'https://www.nasa.gov/missions/station/iss-research/astronaut-exercise/',
    usedFor: 'Crew averages ~2 h of exercise/day; ARED, T2 and CEVIS equipment.',
    usedForPt: 'Tripulação faz em média ~2 h de exercício/dia; equipamentos ARED, T2 e CEVIS.',
  },
  NASA_HRR_OSTEO: {
    short: 'NASA HRR — Osteo Evidence Report',
    title: 'NASA Human Research Roadmap — Risk of Early Onset Osteoporosis Evidence Report',
    url: 'https://humanresearchroadmap.nasa.gov/evidence/reports/Osteo.pdf',
    usedFor:
      'aBMD loss of 1–1.5%/month without countermeasure; 0.3–0.5%/month with ARED. Reason bone density was cut (too slow for the demo).',
    usedForPt: 'Perda de aBMD de 1–1,5%/mês sem contramedida; com ARED, 0,3–0,5%/mês. Motivo do corte de densidade óssea (lenta demais para a demo).',
  },
  NASA_NUTRITION_BIOCHEM: {
    short: 'NASA — Nutritional Biochemistry of Space Flight',
    title: 'NASA — Nutritional Biochemistry of Space Flight',
    url: 'https://www.nasa.gov/wp-content/uploads/2023/04/nutritional-biochemistry-of-space-flight.pdf',
    usedFor: 'Body mass loss on long-duration flights is typically 1–5% (up to 10–15%).',
    usedForPt: 'Perda de massa corporal em voo longo tipicamente de 1–5% (podendo chegar a 10–15%).',
  },
  CSA_RADIATION: {
    short: 'CSA — Monitoring Radiation',
    title: 'Canadian Space Agency — Monitoring Radiation for Astronaut Health (2026)',
    url: 'https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp',
    usedFor: 'Mission context only (radiation does not raise alerts in this project).',
    usedForPt: 'Contexto de missão apenas (radiação não gera alerta neste projeto).',
  },
} as const satisfies Record<string, SourceRef>;

export type SourceKey = keyof typeof SOURCES;

/** `usedFor` no idioma pedido. */
export const sourceUsedFor = (s: SourceRef, locale: Locale): string => (locale === 'pt' ? s.usedForPt : s.usedFor);

/** Valor usado no campo Alert.sourceRef quando o limiar não tem fonte. */
export const ARBITRARY = 'arbitrary-threshold';

/**
 * Monta o `sourceRef` de um alerta. Quando o limiar é arbitrário, o texto
 * SEMPRE começa com 'arbitrary-threshold' (a UI pode testar com startsWith),
 * seguido da fonte que dá contexto à variável.
 */
export function sourceRefFor(context: SourceKey[], thresholdIsArbitrary: boolean): string {
  const ctx = context.map((k) => SOURCES[k].short).join('; ');
  return thresholdIsArbitrary ? `${ARBITRARY} · context: ${ctx}` : ctx;
}
