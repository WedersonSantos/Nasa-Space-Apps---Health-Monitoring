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
            {fmtSigned(delta, d)}
            {pct !== null && <span className="muted"> ({fmtPct(pct, true)})</span>}
          </>
        ) : (
          '—'
        )}
      </td>
    </tr>
  );
}

interface Props {
  alert: Alert;
  missionDay?: number;
  /** compact: título, ação, cálculo e fonte — usado ao lado dos gráficos da contramedida. */
  variant?: 'full' | 'compact';
  /** id do bloco de ação, alvo do link do anunciador. */
  actionId?: string;
}

/**
 * Card de alerta, na ordem do desafio: o que fazer primeiro, depois por que e como foi calculado.
 * Todos os campos do contrato aparecem; nenhum fica escondido.
 */
export function AlertCard({ alert, missionDay, variant = 'full', actionId }: Props) {
  const composite = alert.variables.length > 1;
  const titleId = `${alert.id}-${variant}-title`;

  return (
    <article className={`alert alert--${alert.severity} alert--${variant}`} aria-labelledby={titleId}>
      <header className="alert__head">
        <SeverityBadge severity={alert.severity} />
        {composite && <span className="tag tag--strong">Alerta composto · {alert.variables.length} sinais</span>}
        <span className="alert__when">
          Início do padrão: {missionDay != null ? `dia ${missionDay} · ` : ''}
          {fmtDate(alert.raisedAt)}
        </span>
      </header>

      <h3 id={titleId} className="alert__title">
        {alert.title}
      </h3>
      {variant === 'full' && (
        <ul className="alert__vars" aria-label="Variáveis envolvidas">
          {alert.variables.map((v) => (
            <li key={v} className="tag">
              <VariableTerm variable={v} />
            </li>
          ))}
        </ul>
      )}

      <section className="alert__action" aria-label="O que fazer agora" id={actionId} tabIndex={actionId ? -1 : undefined}>
        <h4>O que fazer agora</h4>
        {alert.escalate && (
          <p className="escalate">
            <Phone size={20} />
            <span>
              <strong>Acione o oficial médico da tripulação</strong> e comunique o controle em Terra na próxima janela de
              comunicação.
            </span>
          </p>
        )}
        <p className="alert__guidance">{alert.guidance}</p>
      </section>

      {variant === 'full' ? (
        <div className="alert__why">
          <section>
            <h4>Por que</h4>
            <p className="alert__explanation">{alert.explanation}</p>
          </section>
          <section>
            <h4>Como foi calculado</h4>
            <p className="arithmetic">{alert.arithmetic}</p>
            <div className="table-scroll">
              <table className="data-table">
                <caption className="visually-hidden">Evidências do alerta</caption>
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
        </div>
      ) : (
        <section className="alert__compact-calc">
          <h4>Como foi calculado</h4>
          <p className="arithmetic">{alert.arithmetic}</p>
        </section>
      )}

      <footer className="alert__foot">
        <SourceRef refText={alert.sourceRef} />
        <span className="muted">Orientação de apoio, não diagnóstico.</span>
      </footer>
    </article>
  );
}
