import type { AstronautState, Measurement } from '../types/contract';
import { latestSelfReport } from '../lib/selfReport';
import { VARIABLE_IDS } from '../types/contract';
import { ORIGIN_META, SEVERITY_META } from '../config/display';
import { VARIABLES } from '../config/variables';
import { fmt, fmtPct, fmtSigned } from '../lib/format';
import { OriginIcon, StatusIcon } from './Icons';
import { coverageOf, displayStatus } from '../lib/coverage';
import { useT } from '../i18n';

/** The seven variables at a glance: current value, deviation from own baseline, status and origin. No composite score. */
export function VitalsStrip({ state, measurements }: { state: AstronautState; measurements: Measurement[] }) {
  const t = useT();
  return (
    <nav className="vitals" aria-label={t({ en: 'Vital signs — summary of the seven variables', pt: 'Sinais vitais — resumo das sete variáveis' })}>
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
            // With no entries in the window the engine keeps the ratio at 1: do not show an invented 100%.
            value = !cov || cov.status === 'ok' ? fmtPct(state.adherence.adherenceRatio) : '—';
            delta = t({ en: `adherence ${state.adherence.windowDays} d`, pt: `aderência ${state.adherence.windowDays} d` });
          } else if (m && v === 'selfReport') {
            const sr = latestSelfReport(measurements);
            value = sr.index != null ? fmt(sr.index, 1) : '—';
            delta =
              sr.index != null && b
                ? t({
                    en: `wellbeing ${fmtSigned(sr.index - b.mean, 1)} vs. baseline`,
                    pt: `bem-estar ${fmtSigned(sr.index - b.mean, 1)} vs. baseline`,
                  })
                : t({ en: 'wellbeing index', pt: 'índice de bem-estar' });
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
                <span className="vital__name">{t(meta.label)}</span>
                <span className="vital__value">
                  {value}
                  {unit && <small>{unit}</small>}
                </span>
                <span className="vital__delta">{delta}</span>
                <span className="vital__state">
                  <StatusIcon status={sev} size={13} />
                  {sev === 'unassessed' ? t({ en: 'Not assessed', pt: 'Não avaliado' }) : t(SEVERITY_META[sev].label)}
                </span>
                {m && (
                  <span className={`vital__origin origin-${m.origin}`} title={t(ORIGIN_META[m.origin].description)}>
                    <OriginIcon origin={m.origin} size={12} />
                    {t(ORIGIN_META[m.origin].label)}
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
