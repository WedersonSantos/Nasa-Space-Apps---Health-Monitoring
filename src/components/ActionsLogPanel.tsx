import { ACTION_LABEL, type ActionEntry } from '../lib/actionLog';
import { fmtDateTime } from '../lib/format';
import { useT } from '../i18n';
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
  const t = useT();
  const sorted = [...entries].sort((a, b) => b.at.localeCompare(a.at));
  return (
    <section className="panel" aria-labelledby="actions-title">
      <h2 id="actions-title">{t({ en: 'Logged actions', pt: 'Ações registradas' })}</h2>
      <p className="muted small">
        {t({
          en: `What was done with each piece of guidance and how the alert stands on day ${day}. Actions stay on this device and do not change the assessment: an alert only clears when the signals return to baseline.`,
          pt: `O que foi feito com cada orientação e como o alerta está no dia ${day}. As ações ficam neste dispositivo e não mudam a avaliação: o alerta só sai quando os sinais voltam ao baseline.`,
        })}
      </p>
      {sorted.length === 0 ? (
        <p className="muted">
          {t({
            en: 'No actions logged. Use an alert’s “Follow-up” section.',
            pt: 'Nenhuma ação registrada. Use o bloco “Acompanhamento” de um alerta.',
          })}
        </p>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">{t({ en: 'When', pt: 'Quando' })}</th>
                <th scope="col">{t({ en: 'Action', pt: 'Ação' })}</th>
                <th scope="col">{t({ en: 'Alert', pt: 'Alerta' })}</th>
                <th scope="col">{t({ en: `On day ${day}`, pt: `No dia ${day}` })}</th>
                <th scope="col">
                  <span className="visually-hidden">{t({ en: 'Undo', pt: 'Desfazer' })}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((e) => {
                const active = activeAlertIds.has(e.alertId);
                return (
                  <tr key={e.id}>
                    <td className="num">
                      {t({ en: 'day', pt: 'dia' })} {e.missionDay} · {fmtDateTime(e.at)}
                    </td>
                    <td>{t(ACTION_LABEL[e.kind])}</td>
                    <td>{e.alertTitle}</td>
                    <td>
                      <span className={`evo evo--${active ? 'active' : 'cleared'}`}>
                        {active ? <SeverityIcon severity="attention" size={13} /> : <CheckCircle size={13} />}
                        {active
                          ? t({ en: 'Alert still active', pt: 'Alerta ainda ativo' })
                          : t({ en: 'Alert no longer active', pt: 'Alerta não está ativo' })}
                      </span>
                    </td>
                    <td>
                      <button type="button" className="btn btn--small" onClick={() => onRemove(e.id)}>
                        {t({ en: 'Undo', pt: 'Desfazer' })}
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
