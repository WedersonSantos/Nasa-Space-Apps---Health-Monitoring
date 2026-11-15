# Indicator table — scientific rationale

Rule engine: [`src/engine`](../src/engine) · Thresholds: [`src/engine/config/thresholds.ts`](../src/engine/config/thresholds.ts) (version `ENGINE_CONFIG_VERSION`) · Sources: [`src/engine/config/sources.ts`](../src/engine/config/sources.ts)

**Golden rule:** no alert exists without an arithmetic operation on recorded numbers, and that operation appears in the alert text (`Alert.arithmetic`). Every alert states the baseline it used.

**About the thresholds:** the **prescription** values (sleep and exercise) come from NASA sources. The **alert thresholds** are the team's initial parameters, not clinically validated, and are marked as arbitrary: every alert's `sourceRef` starts with `arbitrary-threshold`, followed by the source that gives context to the variable.

## The three variable classes

| Class | Role in the flow | Variables |
| --- | --- | --- |
| **Signal** | Collect → **interpret** (raises alerts) | Resting heart rate, HRV, blood pressure, sleep, self-report |
| **Accumulator** | Long-term consequence | Body mass |
| **Countermeasure** | **Guide** (closes the loop) | Exercise load |

## Indicators

| # | Variable | Unit | Class | NASA hazard / risk | Origin in the demo | Baseline | Rule | Threshold | Threshold source | Context source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Resting heart rate | bpm | Signal | Altered gravity → cardiovascular deconditioning | Synthetic (wearable) | Preflight (mean and SD, 7 days) | `z = (HR − mean) / max(SD, 2.5)`; \|z\| > threshold for N consecutive days | 1.5 SD; 3 days | Arbitrary (spec §5) | [NASA HRP — Risks](https://www.nasa.gov/hrp/risks/) |
| 2 | HRV (RMSSD) | ms | Signal | Isolation/confinement → autonomic load, behavioral health | Synthetic (wearable) | Preflight | `drop = (mean − HRV) / mean` > threshold for N days | 20%; 3 days | Arbitrary (spec §5) | [NASA HRP — Risks](https://www.nasa.gov/hrp/risks/); [NASA HRR — Sleep](https://humanresearchroadmap.nasa.gov/evidence/reports/Sleep.pdf) |
| 3 | Blood pressure (systolic; diastolic displayed) | mmHg | Signal | Altered gravity → headward fluid shift | Synthetic (manual cuff) | **Individual** preflight (never the 140/90 clinical cutoff) | All N days beyond ±1.5·max(SD, 4) from baseline, same direction | 1.5 SD; 5 days | Arbitrary (spec §5) | [NASA HRP — 5 Hazards](https://www.nasa.gov/hrp/hazards/) |
| 4 | Sleep | h + quality 1–5 | Signal | Hostile/closed environment → circadian disruption | Synthetic (actigraphy) | 8 h/night prescription | `deficit = Σ max(0, 8 − hours)` over 7 nights > threshold | 7 h over 7 nights | Prescription: [NASA HRR — Sleep](https://humanresearchroadmap.nasa.gov/evidence/reports/Sleep.pdf) (8 h, NASA-STD-3001 Vol. 1). Threshold: arbitrary | [NASA Ames](https://www.nasa.gov/space-science-and-astrobiology-at-ames/interesting-fact-of-the-month-current/interesting-fact-of-the-month-2022/): ~8.5 h scheduled vs. ~6 h slept |
| 5 | Self-report | mood, stress, fatigue 1–5 → index 1–5 | Signal | Isolation and confinement | Synthetic (self-report) | Rolling (previous 5 days) + preflight | `Δ = 5-day mean − previous 5-day mean` ≤ −0.5 **and** 5-day mean ≤ preflight − 0.5. Index = (mood + (6 − stress) + (6 − fatigue)) / 3 | −0.5 point | Arbitrary | [NASA HRP — 5 Hazards](https://www.nasa.gov/hrp/hazards/) |
| 6 | Body mass | kg, %Δ | Accumulator | Altered gravity → muscle atrophy, fluid loss | Synthetic (daily preflight; every 3 days in flight) | Preflight | `%Δ = (7-day mean − preflight) / preflight` ≤ threshold | −2.0% | Arbitrary, within the typical 1–5% range | [NASA — Nutritional Biochemistry](https://www.nasa.gov/wp-content/uploads/2023/04/nutritional-biochemistry-of-space-flight.pdf) |
| 7 | Exercise load | min completed / prescribed | Countermeasure | Countermeasure for 1, 3 and 6 | Synthetic (training log) | 150 min/day, 6 days/week prescription | `adherence = Σ completed / Σ prescribed` over 7 days < threshold | 80% | Prescription: [NASA/SP-20250000273](https://www.nasa.gov/wp-content/uploads/2025/02/sp-20250000273.pdf) (2.5 h/day, 6 days/week). Threshold: arbitrary (spec §5) | [NASA — Astronaut Exercise](https://www.nasa.gov/missions/station/iss-research/astronaut-exercise/) (~2 h/day on average; ARED, T2, CEVIS) |
| + | **Composite: overload** | derived | Derived | Multi-system overload | — | Preflight | 5-day mean of sleep, HRV and HR: `z = (5-day mean − preflight) / max(SD, floor)`; ≥ 2 of 3 signals with z ≥ 1.0 in the direction sleep ↓, HRV ↓, HR ↑ and none in the opposite direction | 1.0 SD; 2 of 3 signals | Arbitrary | [NASA HRR — Sleep](https://humanresearchroadmap.nasa.gov/evidence/reports/Sleep.pdf) |
| + | **Association: mass ↔ exercise** | derived | Derived | Accumulator × countermeasure | — | Preflight + 21-day window | Mass %Δ ≤ −2.0% **and** 21-day adherence < 80% → attention. With rule 3 (blood pressure) also active → **critical + escalation** | −2.0%; 80%; 21 days | Arbitrary | [NASA/SP-20250000273](https://www.nasa.gov/wp-content/uploads/2025/02/sp-20250000273.pdf); [NASA — Nutritional Biochemistry](https://www.nasa.gov/wp-content/uploads/2023/04/nutritional-biochemistry-of-space-flight.pdf) |

### Engine decisions

- **Associate, never model.** The engine does not compute mass loss as a function of the exercise deficit. It measures both signals separately and **associates** them when they deviate in the same window, using language of possibility ("may be related… does not claim causation").
- **Composite alerts absorb single alerts.** When the composite rule or the association fires, the single alerts for the variables it explains are removed from the list, so the same information is not shown twice.
- **SD floors.** Seven preflight days give a noisy SD estimate. A minimum, arbitrary floor prevents an inflated z and false positives. Without the floors, the nominal scenario produced 3 false positives over 113 days.
- **Missing days.** "N consecutive days" rules require data on every day. Without a measurement the streak does not count, which is conservative.
- **Alert onset.** `raisedAt` is the first day of the continuous run in which the rule fires, not the evaluation day. The alert `id` is stable: `astronautId:ruleId:onset-date`.
- **Preflight.** No rule is evaluated before flight day 1, because the baseline is still being formed.
- **No alert ≠ normal (data coverage).** `AstronautState.coverage` reports, for each variable, whether its rule was able to evaluate: `ok`, `no-data` (no valid record), `no-baseline` (preflight still forming, or fewer than 3 days recorded in the first 7) or `stale` (not enough data in the rule window, e.g. resting HR without the 3 consecutive days up to the evaluation date). There is no new threshold: each requirement comes from the rule itself (`COVERAGE` in `thresholds.ts`). With no exercise record, `adherenceRatio` stays at 1 for compatibility, but exercise coverage is not `ok`. In all three scenarios, coverage is `ok` for every variable on every flight day.

## Variables that were cut

| Variable | Decision | Reason |
| --- | --- | --- |
| Bone density / resorption marker | Cut | Loss of 1–1.5%/month without countermeasure and 0.3–0.5%/month with ARED ([NASA HRR — Osteo](https://humanresearchroadmap.nasa.gov/evidence/reports/Osteo.pdf)): invisible within a demo window |
| Visual acuity / intraocular pressure (SANS) | Cut | No defensible synthetic basis and no accessible dataset within the deadline |
| Cumulative radiation dose | Outside the engine | Grows monotonically and does not indicate a change in health state. At most, mission context ([CSA](https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp)) |
| Body temperature, SpO2 | Cut | Not very informative on the ISS without an acute event |

## Test scenarios and observed results

Generated by `npm run generate` (fixed seeds) and checked by `npm test` ([`tests/scenarios.test.ts`](../tests/scenarios.test.ts)). Mission: 7 preflight days + 113 flight days. The storylines take place in the last 21 days (mission days 93–113).

| Scenario | Expected | Observed (day-by-day evaluation) |
| --- | --- | --- |
| 1 — Nominal | `normal` | `normal` on **all** 113 mission days, with zero false positives. Adherence > 90% |
| 2 — Gradual degradation | `attention` from the composite rule | `normal` through day 101. **Day 102** (10th day of degradation): `fast-cluster-overload` with sleep ↓, HRV ↓ and HR ↑. **Day 113**: `selfreport-decline` is added. Blood pressure and mass never alarm |
| 3 — Critical with countermeasure | `critical` with `escalate: true` | **Day 95**: `exercise-adherence` (attention). **Day 110**: `bp-deviation` is added. **Day 111**: `mass-exercise-association` **critical** (mass −2.3% vs. preflight and −2.0% over 3 weeks; 59% adherence over 21 days; systolic −12 mmHg vs. baseline) with escalation to the medical officer |

Full suite: 76 tests. There is one test per rule (fires and does not fire), one per scenario, plus tests for `evaluate()` purity, data validation, self-report, persistence and data coverage (no data, stale data, no baseline, preflight).
