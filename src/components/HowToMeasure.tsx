import type { VariableId } from '../types/contract';
import { VARIABLES } from '../config/variables';

/** How to collect the measurement in flight: equipment, conditions and frequency. */
export function HowToMeasure({ variable, compact = false }: { variable: VariableId; compact?: boolean }) {
  const meta = VARIABLES[variable];
  const h = meta.howToMeasure;
  return (
    <div className={`how${compact ? ' how--compact' : ''}`}>
      <p className="how__title">
        How to measure · <span>{meta.label}</span>
        {meta.unit && <span className="how__unit"> · unit: {meta.unit === '/5' ? '1 to 5 scale' : meta.unit}</span>}
      </p>
      <dl className="how__list">
        <div>
          <dt>Equipment</dt>
          <dd>{h.equipment}</dd>
        </div>
        <div>
          <dt>Conditions</dt>
          <dd>{h.conditions}</dd>
        </div>
        <div>
          <dt>Frequency</dt>
          <dd>{h.frequency}</dd>
        </div>
      </dl>
    </div>
  );
}
