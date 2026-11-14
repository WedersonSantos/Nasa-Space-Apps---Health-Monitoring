import type { Alert } from '../types/contract';
import { ACTION_LABEL, type ActionEntry, type ActionKind } from '../lib/actionLog';
import { fmtDateTime } from '../lib/format';
import { CheckCircle } from './Icons';

interface Props {
  alert: Alert;
  entries: ActionEntry[];
  onLog: (kind: ActionKind) => void;
  onRemove: (id: string) => void;
}

const KINDS: ActionKind[] = ['repeated-measurement', 'cmo-contacted', 'action-done'];

/** Fecha o ciclo: o astronauta registra o que fez com a orientação e acompanha a evolução do alerta. */
export function ActionFollowUp({ alert, entries, onLog, onRemove }: Props) {
  const own = entries.filter((e) => e.alertId === alert.id).sort((a, b) => a.at.localeCompare(b.at));
  const done = own.some((e) => e.kind === 'action-done');
  const cmo = own.some((e) => e.kind === 'cmo-contacted');

  return (
    <section className="follow" aria-label="Acompanhamento da ação">
      <h4>Acompanhamento</h4>
      <div className="follow__buttons" role="group" aria-label="Registrar o que foi feito">
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            className={`btn btn--small${k === 'cmo-contacted' && alert.escalate && !cmo ? ' btn--urgent' : ''}`}
            onClick={() => onLog(k)}
          >
            {ACTION_LABEL[k]}
          </button>
        ))}
      </div>
      {own.length === 0 ? (
        <p className="follow__empty">
          Nenhuma ação registrada para este alerta.
          {alert.escalate && ' Este alerta pede acionar o oficial médico.'}
        </p>
      ) : (
        <ol className="follow__list">
          {own.map((e) => (
            <li key={e.id}>
              <CheckCircle size={14} />
              <span>
                <strong>{ACTION_LABEL[e.kind]}</strong> · dia {e.missionDay} · {fmtDateTime(e.at)}
              </span>
              <button type="button" className="link-btn" onClick={() => onRemove(e.id)} aria-label={`Desfazer registro: ${ACTION_LABEL[e.kind]}, dia ${e.missionDay}`}>
                desfazer
              </button>
            </li>
          ))}
        </ol>
      )}
      {done && (
        <p className="follow__status">
          Ação concluída e o alerta continua ativo: siga as medições. Ele sai sozinho quando os sinais voltarem ao baseline.
        </p>
      )}
    </section>
  );
}
