# Data search log (Bloco A, step 2)

Date: 2026-11-14. Goal: find heart rate, HRV, sleep, blood pressure and body mass series for astronauts, and the three prescription numbers required by the spec (§2).

## Prescription numbers found

| # | What the spec asked for | Value used | Source |
| --- | --- | --- | --- |
| 1 | Scheduled vs. actual sleep on the ISS | ~8.5 h scheduled; ~6 h slept on average (6–6.5 h). Recommendation: 8 h (NASA-STD-3001 Vol. 1) → **prescription = 8 h** | [NASA HRR — Sleep Evidence Report](https://humanresearchroadmap.nasa.gov/evidence/reports/Sleep.pdf); [NASA Ames — Interesting Fact 2022](https://www.nasa.gov/space-science-and-astrobiology-at-ames/interesting-fact-of-the-month-current/interesting-fact-of-the-month-2022/); [NASA-STD-3001 Tech Brief — Sleep](https://www.nasa.gov/wp-content/uploads/2023/03/sleep-accomodations-technical-brief-ochmo.pdf) |
| 2 | Daily exercise load | Prescription of **2.5 h/day, 6 days/week** (actual average ~2 h/day). Equipment: ARED (resistance), T2 and CEVIS (aerobic). There is no official split in minutes between aerobic and resistance, so the engine uses the total load | [NASA/SP-20250000273](https://www.nasa.gov/wp-content/uploads/2025/02/sp-20250000273.pdf); [NASA — Astronaut Exercise](https://www.nasa.gov/missions/station/iss-research/astronaut-exercise/) |
| 3 | Bone and mass loss per month of flight | aBMD: 1–1.5%/month without countermeasure; 0.3–0.5%/month with ARED. Body mass: typical loss of 1–5% on long-duration flights (up to 10–15% in older cases) | [NASA HRR — Osteo Evidence Report](https://humanresearchroadmap.nasa.gov/evidence/reports/Osteo.pdf); [NASA — Nutritional Biochemistry of Space Flight](https://www.nasa.gov/wp-content/uploads/2023/04/nutritional-biochemistry-of-space-flight.pdf) |

> **Pending before submission:** the values above came from search summaries and NASA HTML pages. Each PDF still needs to be opened to record the exact page and excerpt for each number.

The [5 Hazards](https://www.nasa.gov/hrp/hazards/) page was consulted and does **not** contain sleep, exercise or bone loss numbers. It is used only to frame the five hazards.

## Astronaut time series

**Not found.** The challenge's official sources do not provide a daily multi-signal astronaut series (heart rate, HRV, sleep, blood pressure, mass) ready for direct use. [OSDR](https://osdr.nasa.gov/) is mostly omics and model-organism data. Conclusion: the demo data is **synthetic**, as the spec allows, and labeled as such (`origin: 'synthetic'` on every measurement).

## How the synthetic data was generated

[`scripts/generate-scenarios.ts`](../scripts/generate-scenarios.ts): fixed-seed PRNG, 120 days (7 preflight + 113 in flight), daily Gaussian noise.

| Variable | Base mean | Daily noise (SD) | Note |
| --- | --- | --- | --- |
| Resting heart rate | 58 bpm | 2 | Integer |
| HRV (RMSSD) | 55 ms | 5 | |
| Blood pressure | 118/76 mmHg | 3.5 / 2.5 | Integers |
| Sleep | 7.5 h; quality 4 | 0.35 h; 0.5 | Better than the ISS average of ~6 h, on purpose: the nominal astronaut must not raise alarms |
| Self-report | latent well-being 4.0 | 0.2 + Likert noise 0.35 | 3 integer items from 1 to 5 per day |
| Body mass | 75.0 kg | 0.2 kg | Daily preflight and every 3 days in flight |
| Exercise | 150 min prescribed, 6 days/week | 96% ± 4% adherence | |

The ranges are **illustrative of a healthy adult** and were not derived from astronaut telemetry. This is stated in the limitations.

## Limitations resulting from this search

1. There is no real astronaut telemetry: the demo uses synthetic data.
2. All alert thresholds are arbitrary initial parameters. Only the sleep and exercise prescriptions have a source.
3. The 7-day preflight baseline is short and gives a noisy SD estimate. That is why the engine uses arbitrary SD floors.
4. There is no official split of minutes between aerobic and resistance exercise. The engine evaluates the total load.
