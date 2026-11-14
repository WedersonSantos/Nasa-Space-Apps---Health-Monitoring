import type { Alert } from '../types/contract';
import { ACTION_LABEL, type ActionEntry, type ActionKind } from '../lib/actionLog';
import { fmtDateTime } from '../lib/format';
import { useT } from '../i18n';
import { CheckCircle } from './Icons';

interface Props {
  alert: Alert;
  entries: ActionEntry[];
  onLog: (kind: ActionKind) => void;
  onRemove: (id: string) => void;
}

const KINDS: ActionKind[] = ['repeated-measurement', 'cmo-contacted', 'action-done'];

/** Closes the loop: the astronaut logs what they did with the guidance and follows how the alert evolves. */
export function ActionFollowUp({ alert, entries, onLog, onRemove }: Props) {
  const t = useT();
  const own = entries.filter((e) => e.alertId === alert.id).sort((a, b) => a.at.localeCompare(b.at));
  const done = own.some((e) => e.kind === 'action-done');
  const cmo = own.some((e) => e.kind === 'cmo-contacted');

  return (
    <section className="follow" aria-label={t({ en: 'Action follow-up', pt: 'Acompanhamento da ação' })}>
      <h4>{t({ en: 'Follow-up', pt: 'Acompanhamento' })}</h4>
      <div className="follow__buttons" role="group" aria-label={t({ en: 'Log what was done', pt: 'Registrar o que foi feito' })}>
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            className={`btn btn--small${k === 'cmo-contacted' && alert.escalate && !cmo ? ' btn--urgent' : ''}`}
            onClick={() => onLog(k)}
          >
            {t(ACTION_LABEL[k])}
          </button>
        ))}
      </div>
      {own.length === 0 ? (
        <p className="follow__empty">
          {t({ en: 'No actions logged for this alert.', pt: 'Nenhuma ação registrada para este alerta.' })}
          {alert.escalate &&
            t({
              en: ' This alert calls for contacting the medical officer.',
              pt: ' Este alerta pede acionar o oficial médico.',
            })}
        </p>
      ) : (
        <ol className="follow__list">
          {own.map((e) => (
            <li key={e.id}>
              <CheckCircle size={14} />
              <span>
                <strong>{t(ACTION_LABEL[e.kind])}</strong> · {t({ en: 'day', pt: 'dia' })} {e.missionDay} · {fmtDateTime(e.at)}
              </span>
              <button
                type="button"
                className="link-btn"
                onClick={() => onRemove(e.id)}
                aria-label={t({
                  en: `Undo entry: ${t(ACTION_LABEL[e.kind])}, day ${e.missionDay}`,
                  pt: `Desfazer registro: ${t(ACTION_LABEL[e.kind])}, dia ${e.missionDay}`,
                })}
              >
                {t({ en: 'undo', pt: 'desfazer' })}
              </button>
            </li>
          ))}
        </ol>
      )}
      {done && (
        <p className="follow__status">
          {t({
            en: 'Action completed and the alert is still active: keep measuring. It clears on its own when the signals return to baseline.',
            pt: 'Ação concluída e o alerta continua ativo: siga as medições. Ele sai sozinho quando os sinais voltarem ao baseline.',
          })}
        </p>
      )}
    </section>
  );
}
