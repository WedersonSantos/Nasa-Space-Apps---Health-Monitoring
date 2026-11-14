import type { Alert, Evidence } from '../types/contract';
import { fmt, fmtDate, fmtPct, fmtSigned } from '../lib/format';
import { SeverityBadge } from './Badges';
import { Phone } from './Icons';
import { SourceRef } from './SourceRef';
import { VariableTerm } from './VariableTerm';

function decimalsFor(unit: string) {
  return unit === 'bpm' || unit === 'mmHg' || unit === 'min' ? 0 : 1;
}

function EvidenceRow({ e }: { e: Evidence }) {
  const d = decimalsFor(e.unit);
  const hasBase = typeof e.comparedTo === 'number';
  const delta = hasBase ? e.value - (e.comparedTo as number) : 0;
  const pct = hasBase && e.comparedTo !== 0 ? delta / (e.comparedTo as number) : null;
  return (
    <tr>
      <th scope="row">{e.label}</th>
      <td className="num">
        <strong>{fmt(e.value, d)}</strong> {e.unit}
      </td>
      <td className="num">{hasBase ? `${fmt(e.comparedTo as number, d)} ${e.unit}` : '—'}</td>
      <td className="num">
        {hasBase ? (
          <>
            {delta > 0 ? '↑' : delta < 0 ? '↓' : '='} {fmtSigned(delta, d)}
            {pct !== null && <span className="muted"> ({fmtPct(pct, true)})</span>}
          </>
        ) : (
          '—'
        )}
      </td>
    </tr>
  );
}

export function AlertCard({ alert, missionDay }: { alert: Alert; missionDay?: number }) {
  const composite = alert.variables.length > 1;
  return (
    <article className={`alert-card sev-border-${alert.severity}`} aria-labelledby={`${alert.id}-title`}>
      <header className="alert-card__head">
        <SeverityBadge severity={alert.severity} />
        {composite && <span className="tag tag--composite">Alerta composto · {alert.variables.length} sinais</span>}
        <span className="alert-card__when">
          Início do padrão: {missionDay != null ? `dia ${missionDay} de missão · ` : ''}
          {fmtDate(alert.raisedAt)}
        </span>
      </header>

      <h3 id={`${alert.id}-title`} className="alert-card__title">
        {alert.title}
      </h3>
      <ul className="alert-card__vars" aria-label="Variáveis envolvidas">
        {alert.variables.map((v) => (
          <li key={v} className="tag">
            <VariableTerm variable={v} />
          </li>
        ))}
      </ul>

      {alert.escalate && (
        <div className="escalate" role="note">
          <Phone size={20} />
          <div>
            <strong>Acionar o oficial médico da tripulação</strong>
            <span>e comunicar o controle em Terra na próxima janela de comunicação.</span>
          </div>
        </div>
      )}

      <p className="alert-card__explanation">{alert.explanation}</p>

      <section className="alert-card__block">
        <h4>Como foi calculado</h4>
        <p className="arithmetic">{alert.arithmetic}</p>
      </section>

      <section className="alert-card__block">
        <h4>Evidências</h4>
        <div className="table-scroll">
          <table className="evidence">
            <thead>
              <tr>
                <th scope="col">Medida</th>
                <th scope="col" className="num">
                  Atual
                </th>
                <th scope="col" className="num">
                  Referência
                </th>
                <th scope="col" className="num">
                  Desvio
                </th>
              </tr>
            </thead>
            <tbody>
              {alert.evidence.map((e) => (
                <EvidenceRow key={e.label} e={e} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="alert-card__block alert-card__guidance">
        <h4>O que fazer</h4>
        <p>{alert.guidance}</p>
      </section>

      <footer className="alert-card__foot">
        <SourceRef refText={alert.sourceRef} />
        <span className="muted">Orientação de apoio — não é diagnóstico.</span>
      </footer>
    </article>
  );
}
