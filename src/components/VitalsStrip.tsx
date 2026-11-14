import type { AstronautState, Measurement, Severity, VariableId } from '../types/contract';
import { latestSelfReport } from '../lib/selfReport';
import { VARIABLE_IDS } from '../types/contract';
import { ORIGIN_META, SEVERITY_META } from '../config/display';
import { VARIABLES } from '../config/variables';
import { fmt, fmtPct, fmtSigned } from '../lib/format';
import { OriginIcon, SeverityIcon } from './Icons';

function severityOf(state: AstronautState, v: VariableId): Severity {
  const related = state.alerts.filter((a) => a.variables.includes(v));
  if (related.some((a) => a.severity === 'critical')) return 'critical';
  if (related.some((a) => a.severity === 'attention')) return 'attention';
  return 'normal';
}

/** As sete variáveis num relance: valor atual, desvio do próprio baseline, estado e origem. Sem escore composto. */
export function VitalsStrip({ state, measurements }: { state: AstronautState; measurements: Measurement[] }) {
  return (
    <nav className="vitals" aria-label="Sinais vitais — resumo das sete variáveis">
      <ul>
        {VARIABLE_IDS.map((v) => {
          const meta = VARIABLES[v];
          const m = state.latest[v];
          const b = state.baselines.find((x) => x.variable === v && x.kind === 'preflight');
          const sev = severityOf(state, v);
          let value = '—';
          let delta = '';
          if (m && v === 'exerciseLoad') {
            value = fmtPct(state.adherence.adherenceRatio);
            delta = `aderência ${state.adherence.windowDays} d`;
          } else if (m && v === 'selfReport') {
            const sr = latestSelfReport(measurements);
            value = sr.index != null ? fmt(sr.index, 1) : '—';
            delta =
              sr.index != null && b
                ? `bem-estar ${fmtSigned(sr.index - b.mean, 1)} vs. baseline`
                : 'índice de bem-estar';
          } else if (m) {
            value =
              v === 'bloodPressure' && m.secondaryValue != null
                ? `${fmt(m.value, 0)}/${fmt(m.secondaryValue, 0)}`
                : fmt(m.value, meta.decimals);
            if (b) {
              const d = m.value - b.mean;
              delta =
                v === 'bodyMass'
                  ? `${fmtPct(d / b.mean, true)} vs. baseline`
                  : `${fmtSigned(d, meta.decimals)} vs. baseline`;
            }
          }
          const unit = v === 'exerciseLoad' ? '' : meta.unit;
          return (
            <li key={v} className={`vital vital--${sev}`}>
              <a href={`#card-${v}`} className="vital__link">
                <span className="vital__name">{meta.label}</span>
                <span className="vital__value">
                  {value}
                  {unit && <small>{unit}</small>}
                </span>
                <span className="vital__delta">{delta}</span>
                <span className="vital__state">
                  <SeverityIcon severity={sev} size={13} />
                  {SEVERITY_META[sev].label}
                </span>
                {m && (
                  <span className={`vital__origin origin-${m.origin}`} title={ORIGIN_META[m.origin].description}>
                    <OriginIcon origin={m.origin} size={12} />
                    {ORIGIN_META[m.origin].label}
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
