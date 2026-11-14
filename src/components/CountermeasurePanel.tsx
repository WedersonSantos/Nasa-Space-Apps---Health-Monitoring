import type { Alert, AstronautState, Baseline, Measurement, Severity } from '../types/contract';
import { fmt, fmtPct } from '../lib/format';
import { AlertCard } from './AlertCard';
import { ClassChip, SeverityBadge } from './Badges';
import { ExerciseChart, TrendChart } from './TrendChart';
import { VariableTerm } from './VariableTerm';

function worstOf(alerts: Alert[]): Severity {
  if (alerts.some((a) => a.severity === 'critical')) return 'critical';
  if (alerts.some((a) => a.severity === 'attention')) return 'attention';
  return 'normal';
}

interface Props {
  state: AstronautState;
  measurements: Measurement[];
  launchDate: string;
  fromDay: number | null;
  cursorIso: string;
  missionDayOfAlert: (a: Alert) => number;
}

export function CountermeasurePanel({ state, measurements, launchDate, fromDay, cursorIso, missionDayOfAlert }: Props) {
  const { adherence } = state;
  const exerciseAlerts = state.alerts.filter((a) => a.variables.includes('exerciseLoad'));
  const association = state.alerts.find((a) => a.variables.includes('exerciseLoad') && a.variables.includes('bodyMass'));
  const status = worstOf(exerciseAlerts);
  const missing = Math.max(0, adherence.prescribedMinutes - adherence.completedMinutes);
  const exCov = state.coverage?.exerciseLoad;
  const adherenceKnown = !exCov || exCov.status === 'ok';
  const pct = adherenceKnown ? Math.min(1, Math.max(0, adherence.adherenceRatio)) : 0;
  const massBaseline: Baseline | undefined = state.baselines.find((b) => b.variable === 'bodyMass' && b.kind === 'preflight');

  return (
    <div className="stack">
      <section className="panel" aria-labelledby="adh-title">
        <header className="panel__head">
          <div>
            <h2 id="adh-title">Exercise adherence</h2>
            <p className="muted">Prescribed countermeasure — completed ÷ prescribed over the last {adherence.windowDays} days.</p>
          </div>
          <SeverityBadge severity={status} />
        </header>

        <div className="adherence">
          <div className="adherence__big">
            <span className="big">{adherenceKnown ? fmtPct(adherence.adherenceRatio) : '—'}</span>
            <span className="muted">{adherenceKnown ? 'adherence' : 'not enough entries'}</span>
          </div>
          <div className="adherence__bar-wrap">
            <div
              className={`adherence__bar sev-fill-${status}`}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(pct * 100)}
              aria-valuetext={`${fmtPct(adherence.adherenceRatio)} of prescribed load completed`}
            >
              <span style={{ width: `${pct * 100}%` }} />
            </div>
            <dl className="adherence__nums">
              <div>
                <dt>Prescribed</dt>
                <dd>{fmt(adherence.prescribedMinutes, 0)} min</dd>
              </div>
              <div>
                <dt>Completed</dt>
                <dd>{fmt(adherence.completedMinutes, 0)} min</dd>
              </div>
              <div>
                <dt>Remaining</dt>
                <dd>{fmt(missing, 0)} min</dd>
              </div>
            </dl>
          </div>
        </div>
        {!adherenceKnown && exCov && <p className="indicator__unassessed">{exCov.reason}</p>}
        <ExerciseChart measurements={measurements} alerts={state.alerts} launchDate={launchDate} fromDay={fromDay} cursorIso={cursorIso} height={200} />
      </section>

      <section className="panel" aria-labelledby="assoc-title">
        <header className="panel__head">
          <div>
            <h2 id="assoc-title">Accumulator × countermeasure</h2>
            <p className="muted">
              Body mass (accumulator) next to exercise load (countermeasure), in the same time window. The system{' '}
              <strong>associates</strong> the two measures; it does not model cause.
            </p>
          </div>
        </header>
        <div className="side-by-side">
          <div>
            <h3 className="side-title">
              <VariableTerm variable="bodyMass" /> <ClassChip varClass="accumulator" />
            </h3>
            <TrendChart variable="bodyMass" measurements={measurements} baseline={massBaseline} alerts={state.alerts} launchDate={launchDate} fromDay={fromDay} cursorIso={cursorIso} height={200} />
          </div>
          <div>
            <h3 className="side-title">
              <VariableTerm variable="exerciseLoad">Exercise completed</VariableTerm> <ClassChip varClass="countermeasure" />
            </h3>
            <ExerciseChart measurements={measurements} alerts={state.alerts} launchDate={launchDate} fromDay={fromDay} cursorIso={cursorIso} height={200} />
          </div>
        </div>
        {association ? (
          <AlertCard alert={association} missionDay={missionDayOfAlert(association)} variant="compact" />
        ) : (
          <p className="all-clear-inline">No active association between mass change and falling adherence.</p>
        )}
      </section>
    </div>
  );
}
