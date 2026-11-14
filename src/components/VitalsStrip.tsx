import type { AstronautState, Measurement } from '../types/contract';
import { latestSelfReport } from '../lib/selfReport';
import { VARIABLE_IDS } from '../types/contract';
import { ORIGIN_META, SEVERITY_META } from '../config/display';
import { VARIABLES } from '../config/variables';
import { fmt, fmtPct, fmtSigned } from '../lib/format';
import { OriginIcon, StatusIcon } from './Icons';
import { coverageOf, displayStatus } from '../lib/coverage';

/** As sete variáveis num relance: valor atual, desvio do próprio baseline, estado e origem. Sem escore composto. */
export function VitalsStrip({ state, measurements }: { state: AstronautState; measurements: Measurement[] }) {
  return (
    <nav className="vitals" aria-label="Sinais vitais — resumo das sete variáveis">
      <ul>
        {VARIABLE_IDS.map((v) => {
          const meta = VARIABLES[v];
          const m = state.latest[v];
          const b = state.baselines.find((x) => x.variable === v && x.kind === 'preflight');
          const sev = displayStatus(state, v);
          const cov = coverageOf(state, v);
          let value = '—';
          let delta = '';
          if (m && v === 'exerciseLoad') {
            // Sem registros na janela o motor mantém a razão em 1: não exibir 100% inventado.
            value = !cov || cov.status === 'ok' ? fmtPct(state.adherence.adherenceRatio) : '—';
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
            <li key={v} className={`vital vital--${sev}`} title={sev === 'unassessed' ? cov?.reason : undefined}>
              <a href={`#card-${v}`} className="vital__link">
                <span className="vital__name">{meta.label}</span>
                <span className="vital__value">
                  {value}
                  {unit && <small>{unit}</small>}
                </span>
                <span className="vital__delta">{delta}</span>
                <span className="vital__state">
                  <StatusIcon status={sev} size={13} />
                  {sev === 'unassessed' ? 'Não avaliado' : SEVERITY_META[sev].label}
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
