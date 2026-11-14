import { VARIABLE_IDS } from '../types/contract';
import { ENGINE_SOURCES, OFFICIAL_RESOURCES } from '../config/sources';
import { CLASS_LABEL, CLASS_ROLE, HAZARD_LABEL, VARIABLES } from '../config/variables';
import { ClassChip } from './Badges';
import { VariableTerm } from './VariableTerm';

export const REPO_URL = 'https://github.com/WedersonSantos/Nasa-Space-Apps---Health-Monitoring';
export const LICENSE_URL = `${REPO_URL}/blob/main/LICENSE`;

export function AboutPanel() {
  return (
    <div className="stack">
      <section className="panel prose">
        <h2>What this system does</h2>
        <p>
          On long missions, the crew needs to notice changes in their own health and know what to do, even with limited
          communication and medical resources. Vigília is not a dashboard of numbers: it compares each measurement with the
          astronaut’s <strong>individual baseline</strong>, recognises patterns across signals and explains the math behind
          each alert.
        </p>
        <ol className="classes">
          {(['signal', 'accumulator', 'countermeasure'] as const).map((c) => (
            <li key={c}>
              <ClassChip varClass={c} /> <strong>{CLASS_LABEL[c]}</strong> — {CLASS_ROLE[c]}
            </li>
          ))}
        </ol>
        <p>
          The rules are deterministic and auditable; no AI decides whether there is an alert. The app runs entirely on the
          device and keeps working without a link to Earth.
        </p>
      </section>

      <section className="panel" aria-labelledby="ind-table">
        <h2 id="ind-table">Indicator table</h2>
        <div className="table-scroll">
          <table className="evidence indicators-table">
            <thead>
              <tr>
                <th scope="col">Variable</th>
                <th scope="col">Unit</th>
                <th scope="col">Class</th>
                <th scope="col">NASA hazard</th>
                <th scope="col">Associated risk</th>
                <th scope="col">Time constant</th>
                <th scope="col">Rule</th>
              </tr>
            </thead>
            <tbody>
              {VARIABLE_IDS.map((id) => {
                const v = VARIABLES[id];
                return (
                  <tr key={id}>
                    <th scope="row">
                      <VariableTerm variable={id} />
                    </th>
                    <td>{v.unit === '/5' ? '1–5' : v.unit}</td>
                    <td>{CLASS_LABEL[v.varClass]}</td>
                    <td>{v.hazards.map((h) => HAZARD_LABEL[h]).join(', ')}</td>
                    <td>{v.nasaRisk}</td>
                    <td>{v.timeConstant}</td>
                    <td>{v.ruleSummary}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="muted small">
          Composite (derived): two or more of sleep ↓, HRV ↓ and resting HR ↑ deviating in the same 5-day window. Thresholds
          without a published source are marked as arbitrary in the alerts.
        </p>
      </section>

      <section className="panel prose">
        <h2>Limitations</h2>
        <ul>
          <li>Demo data is synthetic, within plausible ranges. There is no real astronaut telemetry.</li>
          <li>Alert thresholds are initial parameters, subject to clinical validation.</li>
          <li>The system associates variables within the same time window; it does not model causality or predict clinical outcomes.</li>
          <li>It does not replace medical assessment: it indicates when to escalate, never diagnoses.</li>
          <li>Bone loss and SANS are out of scope: time constants too long for the demo window, and a lack of data.</li>
          <li>The individual baseline requires a pre-flight logging period; without it, sensitivity drops.</li>
        </ul>
      </section>

      <section className="panel prose">
        <h2>References</h2>
        <h3>Official challenge resources</h3>
        <ul className="refs">
          {OFFICIAL_RESOURCES.map((s) => (
            <li key={s.id}>
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.agency} — {s.title}
              </a>
            </li>
          ))}
        </ul>
        <h3>Sources cited by the rule engine</h3>
        <ul className="refs">
          {Object.values(ENGINE_SOURCES).map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.title}
              </a>
              <span className="muted small"> — {s.usedFor}</span>
            </li>
          ))}
        </ul>
        <p className="muted small">
          NASA does not endorse non-government entities. Project developed for the NASA Space Apps Challenge 2026.
        </p>
      </section>

      <section className="panel prose" aria-labelledby="license-title">
        <h2 id="license-title">License and source code</h2>
        <p>
          Open-source project under the{' '}
          <a href={LICENSE_URL} target="_blank" rel="noreferrer">
            Apache License 2.0 (Apache-2.0)
          </a>
          , an OSI-approved license. Source code, demo data and tests:{' '}
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            github.com/WedersonSantos/Nasa-Space-Apps---Health-Monitoring
          </a>
          .
        </p>
        <p className="muted small">
          Third-party libraries: React, Recharts and Vite (MIT); TypeScript (Apache-2.0).
        </p>
      </section>

      <section className="panel prose">
        <h2>Use of AI</h2>
        <p>
          Generative AI tools were used as programming and writing assistants. AI plays no part in the alert engine: every
          decision comes from deterministic rules, with the formula visible in the alert itself.
        </p>
      </section>
    </div>
  );
}
