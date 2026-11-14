import type { VariableId } from '../types/contract';
import { VARIABLES } from '../config/variables';

/** Como coletar a medição em voo: equipamento, condições e frequência. */
export function HowToMeasure({ variable, compact = false }: { variable: VariableId; compact?: boolean }) {
  const meta = VARIABLES[variable];
  const h = meta.howToMeasure;
  return (
    <div className={`how${compact ? ' how--compact' : ''}`}>
      <p className="how__title">
        Como medir · <span>{meta.label}</span>
        {meta.unit && <span className="how__unit"> · unidade: {meta.unit === '/5' ? 'escala de 1 a 5' : meta.unit}</span>}
      </p>
      <dl className="how__list">
        <div>
          <dt>Equipamento</dt>
          <dd>{h.equipment}</dd>
        </div>
        <div>
          <dt>Condições</dt>
          <dd>{h.conditions}</dd>
        </div>
        <div>
          <dt>Frequência</dt>
          <dd>{h.frequency}</dd>
        </div>
      </dl>
    </div>
  );
}
