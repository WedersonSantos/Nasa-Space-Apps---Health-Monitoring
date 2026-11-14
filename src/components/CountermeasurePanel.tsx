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
  missionDayOfAlert: (a: Alert) => number;
}

export function CountermeasurePanel({ state, measurements, launchDate, fromDay, missionDayOfAlert }: Props) {
  const { adherence } = state;
  const exerciseAlerts = state.alerts.filter((a) => a.variables.includes('exerciseLoad'));
  const association = state.alerts.find((a) => a.variables.includes('exerciseLoad') && a.variables.includes('bodyMass'));
  const status = worstOf(exerciseAlerts);
  const missing = Math.max(0, adherence.prescribedMinutes - adherence.completedMinutes);
  const pct = Math.min(1, Math.max(0, adherence.adherenceRatio));
  const massBaseline: Baseline | undefined = state.baselines.find((b) => b.variable === 'bodyMass' && b.kind === 'preflight');

  return (
    <div className="stack">
      <section className="panel" aria-labelledby="adh-title">
        <header className="panel__head">
          <div>
            <h2 id="adh-title">Aderência ao exercício</h2>
            <p className="muted">Contramedida prescrita — completado ÷ prescrito nos últimos {adherence.windowDays} dias.</p>
          </div>
          <SeverityBadge severity={status} />
        </header>

        <div className="adherence">
          <div className="adherence__big">
            <span className="big">{fmtPct(adherence.adherenceRatio)}</span>
            <span className="muted">de aderência</span>
          </div>
          <div className="adherence__bar-wrap">
            <div
              className={`adherence__bar sev-fill-${status}`}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(pct * 100)}
              aria-valuetext={`${fmtPct(adherence.adherenceRatio)} da carga prescrita completada`}
            >
              <span style={{ width: `${pct * 100}%` }} />
            </div>
            <dl className="adherence__nums">
              <div>
                <dt>Prescrito</dt>
                <dd>{fmt(adherence.prescribedMinutes, 0)} min</dd>
              </div>
              <div>
                <dt>Completado</dt>
                <dd>{fmt(adherence.completedMinutes, 0)} min</dd>
              </div>
              <div>
                <dt>Faltante</dt>
                <dd>{fmt(missing, 0)} min</dd>
              </div>
            </dl>
          </div>
        </div>
        <ExerciseChart measurements={measurements} alerts={state.alerts} launchDate={launchDate} fromDay={fromDay} height={200} />
      </section>

      <section className="panel" aria-labelledby="assoc-title">
        <header className="panel__head">
          <div>
            <h2 id="assoc-title">Acumulador × contramedida</h2>
            <p className="muted">
              Massa corporal (acumulador) ao lado da carga de exercício (contramedida), na mesma janela de tempo. O sistema{' '}
              <strong>associa</strong> as duas medidas; não modela causa.
            </p>
          </div>
        </header>
        <div className="side-by-side">
          <div>
            <h3 className="side-title">
              <VariableTerm variable="bodyMass" /> <ClassChip varClass="accumulator" />
            </h3>
            <TrendChart variable="bodyMass" measurements={measurements} baseline={massBaseline} alerts={state.alerts} launchDate={launchDate} fromDay={fromDay} height={200} />
          </div>
          <div>
            <h3 className="side-title">
              <VariableTerm variable="exerciseLoad">Exercício completado</VariableTerm> <ClassChip varClass="countermeasure" />
            </h3>
            <ExerciseChart measurements={measurements} alerts={state.alerts} launchDate={launchDate} fromDay={fromDay} height={200} />
          </div>
        </div>
        {association ? (
          <AlertCard alert={association} missionDay={missionDayOfAlert(association)} />
        ) : (
          <p className="all-clear-inline">Nenhuma associação ativa entre variação de massa e queda de aderência.</p>
        )}
      </section>
    </div>
  );
}
