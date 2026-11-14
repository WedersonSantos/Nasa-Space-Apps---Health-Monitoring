import { ACTION_LABEL, type ActionEntry } from '../lib/actionLog';
import { fmtDateTime } from '../lib/format';
import { SeverityIcon, CheckCircle } from './Icons';

interface Props {
  entries: ActionEntry[];
  /** Alertas ativos no dia avaliado, para mostrar a evolução depois da ação. */
  activeAlertIds: Set<string>;
  onRemove: (id: string) => void;
  day: number;
}

/** Histórico das ações registradas e a evolução de cada alerta no dia avaliado. */
export function ActionsLogPanel({ entries, activeAlertIds, onRemove, day }: Props) {
  const sorted = [...entries].sort((a, b) => b.at.localeCompare(a.at));
  return (
    <section className="panel" aria-labelledby="actions-title">
      <h2 id="actions-title">Ações registradas</h2>
      <p className="muted small">
        O que foi feito com cada orientação e como o alerta está no dia {day}. As ações ficam neste dispositivo e não mudam a
        avaliação: o alerta só sai quando os sinais voltam ao baseline.
      </p>
      {sorted.length === 0 ? (
        <p className="muted">Nenhuma ação registrada. Use o bloco “Acompanhamento” de um alerta.</p>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Quando</th>
                <th scope="col">Ação</th>
                <th scope="col">Alerta</th>
                <th scope="col">No dia {day}</th>
                <th scope="col">
                  <span className="visually-hidden">Desfazer</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((e) => {
                const active = activeAlertIds.has(e.alertId);
                return (
                  <tr key={e.id}>
                    <td className="num">
                      dia {e.missionDay} · {fmtDateTime(e.at)}
                    </td>
                    <td>{ACTION_LABEL[e.kind]}</td>
                    <td>{e.alertTitle}</td>
                    <td>
                      <span className={`evo evo--${active ? 'active' : 'cleared'}`}>
                        {active ? <SeverityIcon severity="attention" size={13} /> : <CheckCircle size={13} />}
                        {active ? 'Alerta ainda ativo' : 'Alerta não está ativo'}
                      </span>
                    </td>
                    <td>
                      <button type="button" className="btn btn--small" onClick={() => onRemove(e.id)}>
                        Desfazer
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
