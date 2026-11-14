import { SCENARIOS, type ScenarioId } from '../integration/dataSource';
import { OriginBadge } from './Badges';
import { ChevronLeft, ChevronRight } from './Icons';

interface Props {
  current: ScenarioId;
  onChange: (id: ScenarioId) => void;
  /** Switches to personal use, separate from the demo. */
  onOwn: () => void;
}

/** Demo controls in one row: synthetic data always labelled, scenario and keyboard shortcuts. */
export function DemoBar({ current, onChange, onOwn }: Props) {
  const selected = SCENARIOS.find((s) => s.id === current);
  return (
    <section className="demo-bar" aria-label="Demo">
      <span className="demo-bar__label">Demo</span>
      <OriginBadge origin="synthetic" />
      <span className="demo-bar__note">no real astronaut telemetry</span>
      <div className="demo-bar__scenarios" role="group" aria-label="Demo scenario">
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
        My mission
      </button>
      <span className="demo-bar__keys">
        <kbd>1</kbd>
        <kbd>2</kbd>
        <kbd>3</kbd> scenario ·{' '}
        <kbd aria-label="left arrow">
          <ChevronLeft size={11} />
        </kbd>
        <kbd aria-label="right arrow">
          <ChevronRight size={11} />
        </kbd>{' '}
        day
      </span>
      {selected && (
        <span id="demo-desc" className="visually-hidden">
          {selected.description}
        </span>
      )}
    </section>
  );
}
