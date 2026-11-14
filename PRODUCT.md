# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary: astronaut in flight.** A crew member on a long-duration mission, often tired, with little time and limited, delayed communication with Earth. Job: notice changes in their own health and know what to do, without a doctor on board or a live link to the ground.
- **Secondary: crew medical officer (CMO)** and the flight surgeon on the ground, who receive escalations and review the evidence behind an alert.
- **Evaluators:** NASA Space Apps Challenge 2026 judges (Desafio 05) see the product through a live demo, a video and the repository.

## Product Purpose

Vigília monitors astronaut health over a mission: **Coletar → Interpretar → Orientar** (collect, interpret, guide). It compares each measurement with the astronaut's own pre-flight baseline, recognises patterns across signals, explains every alert with the arithmetic behind it, and says what to do, including when to call the CMO or Earth. Success: the astronaut understands in seconds whether something changed, why, and what to do next.

## Positioning

- Deterministic, explainable alerts against the **individual** baseline, never population ranges; every alert shows its formula and evidence.
- A composite multi-signal rule (sleep ↓, HRV ↓, resting HR ↑ in the same window) names overload instead of reading single numbers.
- **Associate, never model:** a countermeasure (exercise adherence) is shown next to an accumulator (body mass) in the same time window, in the language of possibility, without inventing causation.
- Offline by construction: frontend-only, no backend; it must work without Earth.

## Operating Context

- Crew in orbit (ISS-like), mission time in UTC/GMT, mission day counted from launch (pre-flight days ≤ 0).
- Escalation goes to the crew medical officer and to ground control at the next communication window.
- Demo: three scripted synthetic scenarios (nominal, gradual degradation, critical with countermeasure) switched live, plus a mission timeline to re-evaluate any day.

## Capabilities and Constraints

- Seven variables in three classes: **signals** (resting HR, HRV/RMSSD, blood pressure, sleep, self-report of mood/stress/fatigue), **accumulator** (body mass), **countermeasure** (exercise load, prescribed vs completed). All seven stay; none may be removed.
- Alert fields are fixed by the contract (`src/types/contract.ts`): title, explanation, arithmetic, evidence, guidance, sourceRef, escalate, raisedAt. Severity levels: normal, attention, critical.
- Thresholds live in the engine (`src/engine/config/thresholds.ts`); thresholds without a source are flagged as arbitrary in the UI. No magic numbers in UI components.
- AI never decides alerts.
- Must work offline (service worker); any font or asset must be self-hosted.
- UI text in English (Space Apps 2026 requires English submissions; decided by the team on 2026-11-14); code identifiers in English.
- Not a diagnostic tool: possibility language, never certainty.

## Brand Commitments

- Name: **Vigília** (binding). The current symbol (orbit + ECG line) may be redesigned.
- Licence: Apache-2.0, declared in the app and repository.

## Evidence on Hand

- Synthetic scenarios: `src/data/scenarios/*.json` (120 days each, `origin: 'synthetic'`).
- Indicator table and scenario results: `docs/indicadores.md`; data search log: `docs/busca-de-dados.md`.
- Sources: NASA HRP, NASA Human Research Roadmap evidence reports, CSA (`src/engine/config/sources.ts`).
- There is no real astronaut telemetry, no testimonials and no clinical validation; none may be implied.

## Product Principles

1. Guide before explaining: what to do comes first, the evidence is always one step away.
2. Every number carries its origin (synthetic, measured, estimated) and its baseline.
3. Honesty over polish: arbitrary thresholds, limitations and synthetic data are always visible.
4. Works without Earth.

## Accessibility & Inclusion

- State is never conveyed by colour alone: icon + text label + colour, always.
- Readable on a laptop and on a projector; usable on a phone.
- Keyboard and screen-reader operable (WCAG AA contrast as the floor).
