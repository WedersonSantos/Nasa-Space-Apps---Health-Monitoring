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

/** Closes the loop: the astronaut logs what they did with the guidance and follows how the alert evolves. */
export function ActionFollowUp({ alert, entries, onLog, onRemove }: Props) {
  const own = entries.filter((e) => e.alertId === alert.id).sort((a, b) => a.at.localeCompare(b.at));
  const done = own.some((e) => e.kind === 'action-done');
  const cmo = own.some((e) => e.kind === 'cmo-contacted');

  return (
    <section className="follow" aria-label="Action follow-up">
      <h4>Follow-up</h4>
      <div className="follow__buttons" role="group" aria-label="Log what was done">
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
          No actions logged for this alert.
          {alert.escalate && ' This alert calls for contacting the medical officer.'}
        </p>
      ) : (
        <ol className="follow__list">
          {own.map((e) => (
            <li key={e.id}>
              <CheckCircle size={14} />
              <span>
                <strong>{ACTION_LABEL[e.kind]}</strong> · day {e.missionDay} · {fmtDateTime(e.at)}
              </span>
              <button type="button" className="link-btn" onClick={() => onRemove(e.id)} aria-label={`Undo entry: ${ACTION_LABEL[e.kind]}, day ${e.missionDay}`}>
                undo
              </button>
            </li>
          ))}
        </ol>
      )}
      {done && (
        <p className="follow__status">
          Action completed and the alert is still active: keep measuring. It clears on its own when the signals return to baseline.
        </p>
      )}
    </section>
  );
}
