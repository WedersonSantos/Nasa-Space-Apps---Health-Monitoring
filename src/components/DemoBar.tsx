import { SCENARIOS, type ScenarioId } from '../integration/dataSource';
import { OriginBadge } from './Badges';
import { ChevronLeft, ChevronRight } from './Icons';

interface Props {
  current: ScenarioId;
  onChange: (id: ScenarioId) => void;
  /** Muda para o uso próprio, separado da demonstração. */
  onOwn: () => void;
}

/** Controles da demonstração numa linha: dados sintéticos sempre rotulados, cenário e atalhos de teclado. */
export function DemoBar({ current, onChange, onOwn }: Props) {
  const selected = SCENARIOS.find((s) => s.id === current);
  return (
    <section className="demo-bar" aria-label="Demonstração">
      <span className="demo-bar__label">Demonstração</span>
      <OriginBadge origin="synthetic" />
      <span className="demo-bar__note">sem telemetria real de astronauta</span>
      <div className="demo-bar__scenarios" role="group" aria-label="Cenário de demonstração">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            type="button"
            className="console-btn"
            aria-pressed={s.id === current}
            onClick={() => onChange(s.id)}
            title={s.description}
            aria-describedby={s.id === current ? 'demo-desc' : undefined}
          >
            <kbd>{s.number}</kbd>
            {s.label}
          </button>
        ))}
      </div>
      <button type="button" className="console-btn console-btn--own" onClick={onOwn}>
        Minha missão
      </button>
      <span className="demo-bar__keys">
        <kbd>1</kbd>
        <kbd>2</kbd>
        <kbd>3</kbd> cenário ·{' '}
        <kbd aria-label="seta para a esquerda">
          <ChevronLeft size={11} />
        </kbd>
        <kbd aria-label="seta para a direita">
          <ChevronRight size={11} />
        </kbd>{' '}
        dia
      </span>
      {selected && (
        <span id="demo-desc" className="visually-hidden">
          {selected.description}
        </span>
      )}
    </section>
  );
}
