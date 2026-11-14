import { ACTION_LABEL, type ActionEntry } from '../lib/actionLog';
import { fmtDateTime } from '../lib/format';
import { SeverityIcon, CheckCircle } from './Icons';

interface Props {
  entries: ActionEntry[];
  /** Alerts active on the assessed day, to show how things evolved after the action. */
  activeAlertIds: Set<string>;
  onRemove: (id: string) => void;
  day: number;
}

/** History of logged actions and how each alert stands on the assessed day. */
export function ActionsLogPanel({ entries, activeAlertIds, onRemove, day }: Props) {
  const sorted = [...entries].sort((a, b) => b.at.localeCompare(a.at));
  return (
    <section className="panel" aria-labelledby="actions-title">
      <h2 id="actions-title">Logged actions</h2>
      <p className="muted small">
        What was done with each piece of guidance and how the alert stands on day {day}. Actions stay on this device and do
        not change the assessment: an alert only clears when the signals return to baseline.
      </p>
      {sorted.length === 0 ? (
        <p className="muted">No actions logged. Use an alert’s “Follow-up” section.</p>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">Action</th>
                <th scope="col">Alert</th>
                <th scope="col">On day {day}</th>
                <th scope="col">
                  <span className="visually-hidden">Undo</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((e) => {
                const active = activeAlertIds.has(e.alertId);
                return (
                  <tr key={e.id}>
                    <td className="num">
                      day {e.missionDay} · {fmtDateTime(e.at)}
                    </td>
                    <td>{ACTION_LABEL[e.kind]}</td>
                    <td>{e.alertTitle}</td>
                    <td>
                      <span className={`evo evo--${active ? 'active' : 'cleared'}`}>
                        {active ? <SeverityIcon severity="attention" size={13} /> : <CheckCircle size={13} />}
                        {active ? 'Alert still active' : 'Alert no longer active'}
                      </span>
                    </td>
                    <td>
                      <button type="button" className="btn btn--small" onClick={() => onRemove(e.id)}>
                        Undo
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
