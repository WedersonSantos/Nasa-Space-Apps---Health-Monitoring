# Vigília — astronaut health monitor

**NASA Space Apps Challenge 2026 · Challenge 05 — [Create Health Monitoring Software for Astronauts on Space Missions](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/)**
Team Formandos UDI (Uberlândia, Brazil) · License [Apache-2.0](LICENSE)

> **Collect → Interpret → Guide.** Vigília is not a vital-signs dashboard. It compares each measurement with the astronaut's *individual baseline*, recognizes patterns across signals, shows the math behind every alert and says what to do — including when to call the crew medical officer. It works with no connection to Earth.

- **Live demo:** https://nasa-chi-ten.vercel.app — no login, works offline after the first visit
- **Languages:** the app opens in English; the **EN | PT** toggle in the header switches it to Portuguese
- **Video:** _(link — to be added)_

---

## 1. Problem

On long missions, the crew faces the five hazards of human spaceflight described by the NASA Human Research Program — radiation, isolation and confinement, distance from Earth, altered gravity and hostile, closed environments. They translate into cardiovascular deconditioning, muscle and bone loss, sleep disruption and behavioral health problems. Far from Earth, with delayed communication and limited medical resources, the astronaut has to **notice on their own** that something changed and **know what to do**.

## 2. Solution

Seven variables in three classes, mapped one-to-one to the challenge's flow:

| Class | Variables | Role |
| --- | --- | --- |
| **Signals** | Resting HR, HRV (RMSSD), blood pressure, sleep, self-report (mood/stress/fatigue) | Collect → interpret. Raise alerts. |
| **Accumulator** | Body mass | Long-term consequence. |
| **Countermeasure** | Exercise load (prescribed × completed) | Guide — closes the loop. |

What sets it apart:

- **Composite multi-signal rule.** Three short nights, falling HRV and rising HR, together, become an *overload* alert — not "low sleep". No single signal would justify the alert; the pattern does.
- **Association between accumulator and countermeasure, without inventing a cause.** "Mass −2% in 3 weeks; over the same period, 61% of the prescribed exercise was completed. The two may be related." The system associates; it does not model dose-response.
- **Explainable alerts.** Every alert shows the formula applied, the numbers behind it (current × baseline × deviation), the guidance and the source of the threshold — or declares the threshold arbitrary.
- **Offline by design.** No backend: everything runs on the device. An app for astronauts has to work without Earth.

### Screens

| Tab | What it shows |
| --- | --- |
| **Overview** | Overall status (normal / attention / critical, always with icon + label), explainable alerts and one card per indicator with chart, baseline band and alert onset. |
| **Countermeasure** | Exercise adherence and, side by side, body mass × exercise completed with the association alert. |
| **Log data** | Manual measurement with validation, and self-report of mood, stress and fatigue (1–5). |
| **About & sources** | Indicator table, limitations, references and AI-use statement. |

### Own use and data honesty

- **My mission and crew registration.** Besides the demo, anyone can create their own mission (optional mission name) and register the crew: up to 8 members, each with a nickname or fictitious ID and a role on board (commander, pilot, flight engineer, mission specialist, payload specialist, crew medical officer). No personal data is requested. Each member gets their own ID, so entries, baseline and logged actions never mix between people; the **Crew** button lists the members and lets you switch between them, add or remove one. Entries stay on this device, separate from the synthetic data; each member's first 7 days of entries form their pre-flight baseline and assessment starts on flight day 1.
- **"Not assessed" is not "Normal".** The engine reports, per variable, whether there was enough data to apply the rule (`coverage`). With no data, no baseline or stale entries, the interface shows "Not assessed" with the reason, and the overall status becomes "Partial assessment" or "No data". The absence of an alert is never presented as normal health.
- **How to measure.** Each variable lists the equipment, collection conditions adapted to microgravity (for example, blood pressure with the body restrained and the arm at heart level, mass measured by linear acceleration instead of a scale) and frequency.
- **Action follow-up.** Each alert lets the crew log "Measurement repeated", "CMO contacted" and "Action completed". Actions appear on the mission track and in a list that shows whether the alert is still active, without changing the assessment.

The three demo scenarios switch live with the buttons at the top or the **1**, **2** and **3** keys. The **mission track** re-evaluates the state on any day (← → arrows or the *Play* button), showing the exact day each pattern emerges. Hover over (or keyboard-focus) any parameter name to see what it measures and why it matters in spaceflight.

## 3. Architecture

```
Measurements (scenario JSON + manual entries)
        │
        ▼
evaluate(measurements, astronautId, asOf, profile?, { locale })  ← pure, deterministic function (src/engine)
        │
        ▼
AstronautState { overall, alerts[], baselines[], adherence, latest, coverage }
        │
        ▼
React interface (src/components) — display only; no threshold lives in the UI
```

| Layer | Choice |
| --- | --- |
| Build | Vite |
| UI | React 18 + TypeScript |
| Charts | Recharts |
| Engine | Plain TypeScript, no dependencies — `src/engine` |
| Languages | English (default) and Portuguese — `src/i18n`; the engine writes alert text in the chosen locale |
| Tests | Vitest on the engine — `tests/` |
| Persistence | `localStorage` with in-memory fallback — `src/storage` |
| Offline | Service worker (network first, cache as fallback) — `public/sw.js` |
| Deploy | Static build (Vercel) |

**AI out of the critical path.** No AI model decides whether there is an alert. The rules are deterministic and auditable; that is what makes the alert explainable.

### Repository structure

```
src/
  types/contract.ts      Frozen contract between engine and interface
  engine/                Rule engine, baseline, adherence (Block A)
  data/                  Demo scenarios (generated JSON) and measurement creation
  storage/               Local persistence
  integration/           Single connection point engine ↔ interface
  i18n/                  Language provider and EN | PT toggle
  components/            Interface (Block B)
  config/                Interface text and variable metadata
scripts/                 Synthetic data generator
tests/                   Engine tests
docs/                    Indicator table, data-search log and scientific references
PRODUCT.md, DESIGN.md    Product context and visual system (mission-operations identity)
```

## 4. Running it

Requires Node.js 20 or later.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # engine tests
npm run build      # static build in dist/
npm run preview    # serves the build locally
```

### Deploy

Static build, no environment variables. On Vercel or Netlify, just import the repository: command `npm run build`, output folder `dist`.

## 5. Demo data

**All demo data is synthetic** and marked `origin: 'synthetic'` on every measurement; the interface shows the origin on every displayed value (Synthetic · Measured · Estimated), and manual entries appear as *Measured*.

Each scenario covers 120 days (7 pre-flight + 113 in mission), generated by `npm run generate` from `scripts/generate-scenarios.ts` with a fixed seed, in `src/data/scenarios/*.json`.

| Scenario | Script | Result observed on day 113 | Proves |
| --- | --- | --- | --- |
| 1 — Nominal | Signals at baseline, adherence > 90%, stable mass | Normal, no alerts | The system does not alarm without reason |
| 2 — Gradual degradation | Sleep ↓, HRV ↓, HR ↑ over 3 weeks | Attention — overload pattern since day 102 | The composite rule recognizes the pattern |
| 3 — Critical with countermeasure | Low adherence, falling mass, blood pressure drifting from baseline | Critical — association since day 111, with escalation | Association + escalation to the medical officer |

The full indicator table (unit, origin, baseline, rule, threshold, source) and per-scenario results are in [docs/indicadores.md](docs/indicadores.md); the log of the data search in official sources is in [docs/busca-de-dados.md](docs/busca-de-dados.md).

Measurement conventions: blood pressure uses `value` = systolic and `secondaryValue` = diastolic; sleep uses `secondaryValue` = quality (1–5); exercise uses `value` = minutes completed and `secondaryValue` = minutes prescribed; self-report produces three measurements per entry (`method` = `self-report:mood`, `self-report:stress` or `self-report:fatigue`).

## 6. Validation

- Automated engine tests: one check per rule and one per scenario, confirming the expected final severity (`npm test`).
- Every alert shows the arithmetic applied and the numeric evidence.
- Thresholds without a published source appear in the interface as **"Arbitrary threshold · subject to clinical validation"**.

## 7. Limitations

1. Synthetic data, with ranges derived from public literature. There is no real astronaut telemetry.
2. Alert thresholds are initial parameters, subject to clinical validation.
3. The system associates variables; it does not model causality or predict clinical outcomes.
4. It does not replace medical evaluation: it indicates when to escalate, it never diagnoses.
5. Bone loss and spaceflight-associated neuro-ocular syndrome (SANS) were left out: their time constants are too long for the demo window and data were not available in time.
6. The individual baseline requires a pre-flight logging period; without it, sensitivity drops.
7. There is no login or role-based access control: crew data stays on the device that logged it, and anyone using that device can see it.

### Out of scope by choice

- **Interactive human-body view** and **gamification of health habits** (optional items in the challenge brief) were left out on purpose, to keep the focus on explainable alerts and clear guidance.
- **Body temperature** was not implemented: on the ISS it carries little information without an acute event (see [docs/indicadores.md](docs/indicadores.md)).

### Future work

- Radiation dosimetry as mission context.
- Visual acuity and intraocular pressure for SANS screening.
- Bone-loss markers on long missions.
- Threshold validation with an aerospace medical team.
- Adaptation for remote environments on Earth: Antarctic bases, offshore platforms, expeditions.

## 8. AI-use statement

We used generative AI tools — Claude (Anthropic) and Codex (OpenAI) — as programming, writing and presentation-building assistants. All code and text were reviewed by the team. AI does **not** take part in the alert engine: decisions come from deterministic rules, with the formula visible in the alert itself. The interface does not present AI as a medical authority.

## 9. Credits and references

**Team Formandos UDI**

| Member | Responsibility |
| --- | --- |
| Moacir Nascimento | **Data Science & Clinical Rules** (Block A). Data contract, research of NASA references, synthetic data and scenarios, individual baselines, alert rules, data coverage, persistence and tests |
| Wederson Ferreira | **Front-end & Delivery** (Block B). Screens, engine integration, "My mission" mode, measurement logging, bilingual interface, README and publishing |
| Vivian Vitoria | **Design**. Visual identity, design system and day and night palettes |

**Official challenge resources**

- NASA HRP — [5 Hazards of Human Spaceflight](https://www.nasa.gov/hrp/hazards/)
- NASA HRP — [Risks of Human Spaceflight](https://www.nasa.gov/hrp/risks/)
- NASA HRP — [Ongoing HRP Research in Space](https://www.nasa.gov/hrp/ongoing-hrp-research/)
- CSA — [Monitoring Radiation for Astronaut Health](https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp)
- CSA — [Why Do We Conduct Science Experiments in Space?](https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp)
- [NASA Open Science Data Repository (OSDR)](https://osdr.nasa.gov/) · [NASA Life Sciences Portal (NLSP)](https://nlsp.nasa.gov/)

The full list of scientific references, with what each one supports and where it is used, is in [docs/scientific-references.md](docs/scientific-references.md). The specific sources for each threshold (NASA Human Research Roadmap evidence reports, NASA/SP-20250000273 and others) are also in `src/engine/config/sources.ts` and in the app's **About & sources** tab.

**Open-source libraries:** React (MIT), Recharts (MIT), Vite (MIT), Vitest (MIT), TypeScript (Apache-2.0).

NASA does not endorse any non-U.S. Government entity and is not responsible for information contained on non-U.S. Government websites. This project contains no personally identifiable information: the demo crew member is fictional.
