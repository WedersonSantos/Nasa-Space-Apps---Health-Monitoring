import type { VariableId } from '../types/contract';
import { VARIABLES } from '../config/variables';
import { useT } from '../i18n';

/** How to collect the measurement in flight: equipment, conditions and frequency. */
export function HowToMeasure({ variable, compact = false }: { variable: VariableId; compact?: boolean }) {
  const t = useT();
  const meta = VARIABLES[variable];
  const h = meta.howToMeasure;
  return (
    <div className={`how${compact ? ' how--compact' : ''}`}>
      <p className="how__title">
        {t({ en: 'How to measure', pt: 'Como medir' })} · <span>{t(meta.label)}</span>
        {meta.unit && (
          <span className="how__unit">
            {' '}
            · {t({ en: 'unit', pt: 'unidade' })}:{' '}
            {meta.unit === '/5' ? t({ en: '1 to 5 scale', pt: 'escala de 1 a 5' }) : meta.unit}
          </span>
        )}
      </p>
      <dl className="how__list">
        <div>
          <dt>{t({ en: 'Equipment', pt: 'Equipamento' })}</dt>
          <dd>{t(h.equipment)}</dd>
        </div>
        <div>
          <dt>{t({ en: 'Conditions', pt: 'Condições' })}</dt>
          <dd>{t(h.conditions)}</dd>
        </div>
        <div>
          <dt>{t({ en: 'Frequency', pt: 'Frequência' })}</dt>
          <dd>{t(h.frequency)}</dd>
        </div>
      </dl>
    </div>
  );
}
