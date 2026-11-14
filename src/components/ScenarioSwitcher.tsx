import { SCENARIOS, type ScenarioId } from '../integration/dataSource';

interface Props {
  current: ScenarioId;
  onChange: (id: ScenarioId) => void;
}

export function ScenarioSwitcher({ current, onChange }: Props) {
  const selected = SCENARIOS.find((s) => s.id === current);
  return (
    <section className="scenarios" aria-label="Cenário de demonstração">
      <div className="scenarios__row">
        <span className="scenarios__label">Cenário de demonstração</span>
        <div className="scenarios__buttons" role="group">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              className="scenario-btn"
              aria-pressed={s.id === current}
              onClick={() => onChange(s.id)}
              title={`Atalho: tecla ${s.number}`}
            >
              <span className="scenario-btn__n">{s.number}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>
      {selected && <p className="scenarios__desc">{selected.description}</p>}
    </section>
  );
}
