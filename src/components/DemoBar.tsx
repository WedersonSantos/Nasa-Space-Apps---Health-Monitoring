import { SCENARIOS, type ScenarioId } from '../integration/dataSource';
import { useT } from '../i18n';
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
  const t = useT();
  const selected = SCENARIOS.find((s) => s.id === current);
  return (
    <section className="demo-bar" aria-label={t({ en: 'Demo', pt: 'Demonstração' })}>
      <span className="demo-bar__label">{t({ en: 'Demo', pt: 'Demonstração' })}</span>
      <OriginBadge origin="synthetic" />
      <span className="demo-bar__note">{t({ en: 'no real astronaut telemetry', pt: 'sem telemetria real de astronauta' })}</span>
      <div className="demo-bar__scenarios" role="group" aria-label={t({ en: 'Demo scenario', pt: 'Cenário de demonstração' })}>
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            type="button"
            className="console-btn"
            aria-pressed={s.id === current}
            onClick={() => onChange(s.id)}
            title={t(s.description)}
            aria-describedby={s.id === current ? 'demo-desc' : undefined}
          >
            <kbd>{s.number}</kbd>
            {t(s.label)}
          </button>
        ))}
      </div>
      <button type="button" className="console-btn console-btn--own" onClick={onOwn}>
        {t({ en: 'My mission', pt: 'Minha missão' })}
      </button>
      <span className="demo-bar__keys">
        <kbd>1</kbd>
        <kbd>2</kbd>
        <kbd>3</kbd> {t({ en: 'scenario', pt: 'cenário' })} ·{' '}
        <kbd aria-label={t({ en: 'left arrow', pt: 'seta para a esquerda' })}>
          <ChevronLeft size={11} />
        </kbd>
        <kbd aria-label={t({ en: 'right arrow', pt: 'seta para a direita' })}>
          <ChevronRight size={11} />
        </kbd>{' '}
        {t({ en: 'day', pt: 'dia' })}
      </span>
      {selected && (
        <span id="demo-desc" className="visually-hidden">
          {t(selected.description)}
        </span>
      )}
    </section>
  );
}
