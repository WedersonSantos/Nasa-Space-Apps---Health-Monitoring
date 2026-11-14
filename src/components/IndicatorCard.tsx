import type { Alert, Baseline, Measurement, Severity, VariableCoverage, VariableId } from '../types/contract';
import { SELF_REPORT_DIMENSIONS } from '../config/display';
import { findOfficial } from '../config/sources';
import { HAZARD_LABEL, VARIABLES } from '../config/variables';
import { fmt, fmtDate, fmtPct, fmtSigned } from '../lib/format';
import { ClassChip, OriginBadge, StatusBadge } from './Badges';
import { ChevronRight } from './Icons';
import { HowToMeasure } from './HowToMeasure';
import { TrendChart } from './TrendChart';
import { VariableTerm } from './VariableTerm';
import { latestSelfReport as latestSelfReportIndex } from '../lib/selfReport';

function worstOf(alerts: Alert[]): Severity {
  if (alerts.some((a) => a.severity === 'critical')) return 'critical';
  if (alerts.some((a) => a.severity === 'attention')) return 'attention';
  return 'normal';
}

function latestSelfReport(ms: Measurement[]) {
  return SELF_REPORT_DIMENSIONS.map((d) => {
    const s = ms.filter((m) => m.variable === 'selfReport' && m.method === d.method).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    return { label: d.label, m: s.length ? s[s.length - 1] : null };
  });
}

interface Props {
  variable: VariableId;
  latest: Measurement | null;
  baseline?: Baseline;
  alerts: Alert[];
  measurements: Measurement[];
  launchDate: string;
  fromDay: number | null;
  /** row: data on the left and chart on the right, to stack charts on the same time axis. */
  variant?: 'card' | 'row';
  cursorIso?: string;
  /** Engine coverage: whether the variable could be assessed. */
  coverage?: VariableCoverage | null;
}

export function IndicatorCard({ variable, latest, baseline, alerts, measurements, launchDate, fromDay, variant = 'card', cursorIso, coverage }: Props) {
  const meta = VARIABLES[variable];
  const related = alerts.filter((a) => a.variables.includes(variable));
  const sevStatus = worstOf(related);
  const cov = coverage ?? null;
  const status: Severity | 'unassessed' = sevStatus === 'normal' && cov && cov.status !== 'ok' ? 'unassessed' : sevStatus;
  const delta = latest && baseline ? latest.value - baseline.mean : null;

  return (
    <article
      id={`card-${variable}`}
      tabIndex={-1}
      className={`indicator indicator--${variant} indicator--${status}`}
      aria-labelledby={`ind-${variable}`}
    >
      <div className="indicator__meta">
      <header className="indicator__head">
        <div>
          <h3 id={`ind-${variable}`}>
            <VariableTerm variable={variable} />
          </h3>
          <ClassChip varClass={meta.varClass} />
        </div>
        <StatusBadge status={status} reason={cov?.reason} />
      </header>

      {latest ? (
        <div className="indicator__value">
          {variable === 'selfReport' ? (
            <div className="selfreport-values">
              {latestSelfReport(measurements).map(({ label, m }) => (
                <span key={label}>
                  {label} <strong>{m ? m.value : '—'}</strong>/5
                </span>
              ))}
            </div>
          ) : (
            <span className="big">
              {fmt(latest.value, meta.decimals)}
              {variable === 'bloodPressure' && latest.secondaryValue != null && `/${fmt(latest.secondaryValue, 0)}`}
              <small> {meta.unit}</small>
            </span>
          )}
          <OriginBadge origin={latest.origin} />
          <span className="indicator__date">{fmtDate(latest.timestamp)}</span>
        </div>
      ) : (
        <p className="muted">No measurement logged.</p>
      )}

      {status === 'unassessed' && cov && <p className="indicator__unassessed">{cov.reason}</p>}
      {baseline && latest && variable !== 'selfReport' && (
        <p className="indicator__baseline">
          Pre-flight baseline{' '}
          <strong>
            {fmt(baseline.mean, meta.decimals)} ± {fmt(baseline.stdDev, 1)} {meta.unit}
          </strong>
          {delta !== null && (
            <>
              {' · '}deviation {fmtSigned(delta, meta.decimals)} {meta.unit}
              {variable === 'bodyMass' && ` (${fmtPct(delta / baseline.mean, true)})`}
            </>
          )}
        </p>
      )}
      {variable === 'selfReport' && baseline && (() => {
        const sr = latestSelfReportIndex(measurements);
        return (
          <p className="indicator__baseline">
            Wellbeing index <strong>{sr.index != null ? `${fmt(sr.index, 1)}/5` : '—'}</strong> · pre-flight baseline{' '}
            <strong>{fmt(baseline.mean, 1)}/5</strong>
            {sr.index != null && <> · deviation {fmtSigned(sr.index - baseline.mean, 1)}</>}
          </p>
        );
      })()}

      {variant === 'card' && (
        <TrendChart variable={variable} measurements={measurements} baseline={baseline} alerts={alerts} launchDate={launchDate} fromDay={fromDay} cursorIso={cursorIso} />
      )}

      <details className="indicator__about">
        <summary>
          <ChevronRight size={14} className="disclosure-icon" />
          What it measures, why it matters and how to measure
        </summary>
        <p>
          <strong>Measures:</strong> {meta.whatItMeasures}
        </p>
        <p>
          <strong>In spaceflight:</strong> {meta.whyItMatters}
        </p>
        <p className="small">
          NASA hazard: {meta.hazards.map((h) => HAZARD_LABEL[h]).join(', ')} · Risk: {meta.nasaRisk} · Time constant:{' '}
          {meta.timeConstant}
        </p>
        <p className="small">
          Rule: {meta.ruleSummary}
        </p>
        <HowToMeasure variable={variable} compact />
        <p className="small">
          Sources:{' '}
          {meta.sourceIds.map((id, i) => {
            const s = findOfficial(id);
            return s ? (
              <span key={id}>
                {i > 0 && ' · '}
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.agency} — {s.title}
                </a>
              </span>
            ) : null;
          })}
        </p>
      </details>
      </div>
      {variant === 'row' && (
        <div className="indicator__chart">
          <TrendChart variable={variable} measurements={measurements} baseline={baseline} alerts={alerts} launchDate={launchDate} fromDay={fromDay} cursorIso={cursorIso} height={150} />
        </div>
      )}
    </article>
  );
}
