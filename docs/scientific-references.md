# Scientific references

This file lists every scientific and institutional source used to build Vigília: for each one, what it says that we used, and where the project uses it. All sources are public and were accessed on 2026-11-14.

The same sources are cited in the code: [`src/engine/config/sources.ts`](../src/engine/config/sources.ts) holds the sources the alert engine cites, and [`src/config/sources.ts`](../src/config/sources.ts) holds the official challenge resources shown in the app's **About & sources** tab. The [data search log](busca-de-dados.md) describes how they were found.

## How to read the references

- **Prescription values** (8 h of sleep, 2.5 h/day of exercise) come directly from NASA sources.
- **Alert thresholds** (for example, a 1.5 SD deviation or a 20% HRV drop) are the team's initial parameters. They are **not** taken from any source and have not been clinically validated. The app labels each one as *"Arbitrary threshold · subject to clinical validation"*. The sources below give scientific context to the variable, not to the threshold.
- No source provides real astronaut telemetry. All demo data is synthetic (see [Limitations](#limitations-of-the-evidence)).

## 1. Hazards and risks of human spaceflight

### [R1] NASA Human Research Program — 5 Hazards of Human Spaceflight
- **URL:** https://www.nasa.gov/hrp/hazards/
- **What we used:** the five hazards: radiation, isolation and confinement, distance from Earth, altered gravity, and hostile/closed environments.
- **Where:** problem statement, the hazard each indicator is mapped to (`src/config/variables.ts`), and context for blood pressure and self-report. This page has no numerical values for sleep, exercise or bone loss, so it is used only for framing.

### [R2] NASA Human Research Program — Risks of Human Spaceflight
- **URL:** https://www.nasa.gov/hrp/risks/
- **What we used:** the catalogue of spaceflight health risks, which we used to map each risk to an indicator.
- **Where:** context for resting heart rate and HRV.

### [R3] NASA Human Research Program — Ongoing HRP Research in Space
- **URL:** https://www.nasa.gov/hrp/ongoing-hrp-research/
- **What we used:** an overview of in-flight research areas (official challenge resource).
- **Where:** background research; listed in the app's About & sources tab.

## 2. Sleep and circadian rhythm

### [R4] NASA Human Research Roadmap — Evidence Report: Risk of Performance Decrements and Adverse Health Outcomes Resulting from Sleep Loss, Circadian Desynchronization, and Work Overload
- **URL:** https://humanresearchroadmap.nasa.gov/evidence/reports/Sleep.pdf
- **What we used:** astronauts sleep about 6 h per night in flight, almost 2 h less than the 8 h recommended by NASA-STD-3001 Vol. 1.
- **Where:** the **8 h/night sleep prescription** used by the sleep-deficit rule; context for HRV and for the composite *overload* rule (sleep ↓, HRV ↓, resting HR ↑).

### [R5] NASA Ames — Interesting Fact of the Month 2022 (astronaut sleep)
- **URL:** https://www.nasa.gov/space-science-and-astrobiology-at-ames/interesting-fact-of-the-month-current/interesting-fact-of-the-month-2022/
- **What we used:** the ISS schedule allots about 8.5 h for sleep, but astronauts sleep about 6 h on average.
- **Where:** context for the sleep indicator.

### [R6] NASA Office of the Chief Health and Medical Officer — NASA-STD-3001 Technical Brief: Sleep Accommodations
- **URL:** https://www.nasa.gov/wp-content/uploads/2023/03/sleep-accomodations-technical-brief-ochmo.pdf
- **What we used:** the 8 h sleep recommendation from the NASA-STD-3001 standard.
- **Where:** confirms the 8 h prescription (see the data search log).

## 3. Exercise countermeasures and physiological deconditioning

### [R7] NASA/SP-20250000273 (January 2025) — Astronaut physiological deconditioning
- **URL:** https://www.nasa.gov/wp-content/uploads/2025/02/sp-20250000273.pdf
- **What we used:** an exercise prescription of **2.5 h/day, 6 days/week**, and a bone mineral density loss of 0.5–1.5% per month.
- **Where:** the **150 min/day, 6 days/week** prescription used by the exercise-adherence rule, and the mass ↔ exercise association rule.

### [R8] NASA — Astronaut Exercise (ISS Research)
- **URL:** https://www.nasa.gov/missions/station/iss-research/astronaut-exercise/
- **What we used:** crews exercise about 2 h per day on average, using ARED (resistance), T2 (treadmill) and CEVIS (cycle ergometer).
- **Where:** context for the exercise-load indicator and its measurement guidance.

## 4. Body mass, bone and nutrition

### [R9] NASA — Nutritional Biochemistry of Space Flight
- **URL:** https://www.nasa.gov/wp-content/uploads/2023/04/nutritional-biochemistry-of-space-flight.pdf
- **What we used:** body mass loss on long-duration flights is typically 1–5% and can reach 10–15%.
- **Where:** context for the body-mass indicator. The −2.0% alert threshold is arbitrary, chosen within the typical 1–5% range. Also context for the mass ↔ exercise association.

### [R10] NASA Human Research Roadmap — Evidence Report: Risk of Early Onset Osteoporosis Due to Spaceflight
- **URL:** https://humanresearchroadmap.nasa.gov/evidence/reports/Osteo.pdf
- **What we used:** areal bone mineral density (aBMD) loss of 1–1.5% per month without a countermeasure, and 0.3–0.5% per month with ARED.
- **Where:** the reason bone density was **left out** of the demo: the change is too slow to show within the demo window.

## 5. Radiation

### [R11] Canadian Space Agency — Monitoring Radiation for Astronaut Health (2026)
- **URL:** https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp
- **What we used:** how radiation exposure is monitored on missions.
- **Where:** mission context only. Cumulative dose rises steadily and does not reflect a change in health state, so radiation raises no alerts in this project. Radiation dosimetry is listed as future work.

## 6. Space science and open data

### [R12] Canadian Space Agency — Why Do We Conduct Science Experiments in Space?
- **URL:** https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp
- **What we used:** background on in-flight life-science research (official challenge resource).
- **Where:** background research; listed in the app's About & sources tab.

### [R13] NASA Open Science Data Repository (OSDR)
- **URL:** https://osdr.nasa.gov/
- **What we used:** we searched it for astronaut time series. It mostly holds omics and model-organism data, with no daily multi-signal astronaut series. This finding is why the demo uses synthetic data.
- **Where:** data search log; About & sources tab.

### [R14] NASA Life Sciences Portal (NLSP)
- **URL:** https://nlsp.nasa.gov/
- **What we used:** searched for astronaut physiological data (official challenge resource).
- **Where:** data search log; About & sources tab.

## Indicator → reference map

| Indicator | Class | Prescription source | Context sources | Alert threshold |
| --- | --- | --- | --- | --- |
| Resting heart rate | Signal | — | R2 | Arbitrary |
| HRV (RMSSD) | Signal | — | R2, R4 | Arbitrary |
| Blood pressure | Signal | — | R1 | Arbitrary (individual baseline, never the 140/90 clinical cutoff) |
| Sleep | Signal | R4, R6 (8 h) | R5 | Arbitrary |
| Self-report (mood, stress, fatigue) | Signal | — | R1 | Arbitrary |
| Body mass | Accumulator | — | R9 | Arbitrary, within the 1–5% range in R9 |
| Exercise load | Countermeasure | R7 (2.5 h/day, 6 days/week) | R8 | Arbitrary |
| Composite: overload | Derived | — | R4 | Arbitrary |
| Association: mass ↔ exercise | Derived | — | R7, R9 | Arbitrary |
| *Bone density (left out)* | — | — | R7, R10 | — |
| *Radiation dose (context only)* | — | — | R11 | — |

## Limitations of the evidence

1. **No real astronaut telemetry.** None of the sources provides a daily multi-signal series for astronauts. The demo data is synthetic, generated by [`scripts/generate-scenarios.ts`](../scripts/generate-scenarios.ts) with ranges typical of a healthy adult, and every measurement is marked `origin: 'synthetic'`.
2. **Thresholds are not from the literature.** Only the sleep and exercise prescriptions have a published source. Every alert threshold is a team-defined initial parameter and needs validation by an aerospace medical team.
3. **Exact page citations pending.** Some values were taken from NASA web pages and document summaries. The specific page and passage in each PDF have not yet been recorded.
4. **Short baseline.** The 7-day pre-flight baseline gives a noisy estimate of the standard deviation, so the engine uses arbitrary minimum SD values.
5. **No aerobic/resistance split.** No source gives an official split in minutes between aerobic and resistance exercise, so the engine evaluates the total load.

---

NASA does not endorse any non-U.S. Government entity and is not responsible for information contained on non-U.S. Government websites.
