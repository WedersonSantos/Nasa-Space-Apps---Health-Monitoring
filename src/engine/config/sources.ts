/**
 * Referências citadas pelo motor. Toda regra aponta para uma destas chaves.
 * Registro da busca: docs/busca-de-dados.md.
 */
export interface SourceRef {
  short: string;
  title: string;
  url: string;
  /** O que exatamente usamos desta fonte. */
  usedFor: string;
}

export const SOURCES = {
  NASA_HRP_HAZARDS: {
    short: 'NASA HRP — 5 Hazards',
    title: 'NASA Human Research Program — 5 Hazards of Human Spaceflight',
    url: 'https://www.nasa.gov/hrp/hazards/',
    usedFor: 'Framing of the five hazards; starting point for every indicator.',
  },
  NASA_HRP_RISKS: {
    short: 'NASA HRP — Risks',
    title: 'NASA Human Research Program — Risks of Human Spaceflight',
    url: 'https://www.nasa.gov/hrp/risks/',
    usedFor: 'Risk → indicator mapping.',
  },
  NASA_HRR_SLEEP: {
    short: 'NASA HRR — Sleep Evidence Report',
    title:
      'NASA Human Research Roadmap — Evidence Report: Risk of Performance Decrements and Adverse Health Outcomes Resulting from Sleep Loss, Circadian Desynchronization, and Work Overload',
    url: 'https://humanresearchroadmap.nasa.gov/evidence/reports/Sleep.pdf',
    usedFor:
      'Average in-flight sleep ≈ 6 h/night, almost 2 h below the 8 h recommended by NASA-STD-3001 Vol. 1 → 8 h prescription.',
  },
  NASA_AMES_SLEEP_FACT: {
    short: 'NASA Ames — Interesting Fact 2022',
    title: 'NASA Ames — Interesting Fact of the Month 2022 (astronaut sleep)',
    url: 'https://www.nasa.gov/space-science-and-astrobiology-at-ames/interesting-fact-of-the-month-current/interesting-fact-of-the-month-2022/',
    usedFor: 'Schedule allots ~8.5 h of sleep; astronauts sleep ~6 h on average.',
  },
  NASA_SP_2025_DECONDITIONING: {
    short: 'NASA/SP-20250000273',
    title: 'NASA/SP-20250000273 (Jan. 2025) — Astronaut physiological deconditioning',
    url: 'https://www.nasa.gov/wp-content/uploads/2025/02/sp-20250000273.pdf',
    usedFor:
      'Exercise prescription of 2.5 h/day, 6 days/week; bone mineral density loss of 0.5–1.5%/month.',
  },
  NASA_ASTRONAUT_EXERCISE: {
    short: 'NASA — Astronaut Exercise',
    title: 'NASA — Astronaut Exercise (ISS Research)',
    url: 'https://www.nasa.gov/missions/station/iss-research/astronaut-exercise/',
    usedFor: 'Crew averages ~2 h of exercise/day; ARED, T2 and CEVIS equipment.',
  },
  NASA_HRR_OSTEO: {
    short: 'NASA HRR — Osteo Evidence Report',
    title: 'NASA Human Research Roadmap — Risk of Early Onset Osteoporosis Evidence Report',
    url: 'https://humanresearchroadmap.nasa.gov/evidence/reports/Osteo.pdf',
    usedFor:
      'aBMD loss of 1–1.5%/month without countermeasure; 0.3–0.5%/month with ARED. Reason bone density was cut (too slow for the demo).',
  },
  NASA_NUTRITION_BIOCHEM: {
    short: 'NASA — Nutritional Biochemistry of Space Flight',
    title: 'NASA — Nutritional Biochemistry of Space Flight',
    url: 'https://www.nasa.gov/wp-content/uploads/2023/04/nutritional-biochemistry-of-space-flight.pdf',
    usedFor: 'Body mass loss on long-duration flights is typically 1–5% (up to 10–15%).',
  },
  CSA_RADIATION: {
    short: 'CSA — Monitoring Radiation',
    title: 'Canadian Space Agency — Monitoring Radiation for Astronaut Health (2026)',
    url: 'https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp',
    usedFor: 'Mission context only (radiation does not raise alerts in this project).',
  },
} as const satisfies Record<string, SourceRef>;

export type SourceKey = keyof typeof SOURCES;

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
