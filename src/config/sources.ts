// Official challenge references (Resources tab) for the "About" screen, and the Alert.sourceRef reader.
// Sources cited by the engine live in src/engine/config/sources.ts (Bloco A).

import { ARBITRARY, SOURCES as ENGINE_SOURCES } from '../engine/config/sources';

export interface Source {
  id: string;
  title: string;
  agency: string;
  url: string;
}

export const OFFICIAL_RESOURCES: Source[] = [
  { id: 'nasa-hrp-hazards', title: '5 Hazards of Human Spaceflight', agency: 'NASA HRP', url: 'https://www.nasa.gov/hrp/hazards/' },
  { id: 'nasa-hrp-risks', title: 'Risks of Human Spaceflight', agency: 'NASA HRP', url: 'https://www.nasa.gov/hrp/risks/' },
  { id: 'nasa-hrp-research', title: 'Ongoing HRP Research in Space', agency: 'NASA HRP', url: 'https://www.nasa.gov/hrp/ongoing-hrp-research/' },
  {
    id: 'csa-radiation',
    title: 'Monitoring Radiation for Astronaut Health',
    agency: 'CSA',
    url: 'https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp',
  },
  {
    id: 'csa-science',
    title: 'Why Do We Conduct Science Experiments in Space?',
    agency: 'CSA',
    url: 'https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp',
  },
  { id: 'nasa-osdr', title: 'NASA Open Science Data Repository (OSDR)', agency: 'NASA', url: 'https://osdr.nasa.gov/' },
  { id: 'nasa-nlsp', title: 'NASA Life Sciences Portal (NLSP)', agency: 'NASA', url: 'https://nlsp.nasa.gov/' },
];

export function findOfficial(id: string): Source | undefined {
  return OFFICIAL_RESOURCES.find((s) => s.id === id);
}

export interface ResolvedSourceRef {
  arbitrary: boolean;
  links: { label: string; url: string }[];
  raw: string;
}

/** Parses the free text of Alert.sourceRef: arbitrary-threshold marker + links to recognised sources. */
export function resolveSourceRef(ref: string): ResolvedSourceRef {
  const arbitrary = ref.startsWith(ARBITRARY);
  const links = Object.values(ENGINE_SOURCES)
    .filter((s) => ref.includes(s.short))
    .map((s) => ({ label: s.short, url: s.url }));
  return { arbitrary, links, raw: ref };
}

export { ENGINE_SOURCES };
