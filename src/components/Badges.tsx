import type { DataOrigin, Severity } from '../types/contract';
import { ORIGIN_META, SEVERITY_META } from '../config/display';
import { CLASS_LABEL, type VariableClass } from '../config/variables';
import { OriginIcon, SeverityIcon, StatusIcon } from './Icons';

/** Estado sempre com ícone + rótulo + cor — nunca só cor (regra 7). */
export function SeverityBadge({ severity, size = 'md' }: { severity: Severity; size?: 'md' | 'lg' }) {
  return (
    <span className={`sev-badge sev-${severity} sev-badge--${size}`}>
      <SeverityIcon severity={severity} size={size === 'lg' ? 22 : 16} />
      <span>{SEVERITY_META[severity].label}</span>
    </span>
  );
}

/** Estado de uma variável: gravidade do alerta ou "Não avaliado" quando faltam dados para o motor avaliar. */
export function StatusBadge({ status, reason }: { status: Severity | 'unassessed'; reason?: string }) {
  if (status !== 'unassessed') return <SeverityBadge severity={status} />;
  return (
    <span className="sev-badge sev-unassessed" title={reason}>
      <StatusIcon status="unassessed" size={16} />
      <span>Não avaliado</span>
    </span>
  );
}

/** Origem do dado sempre visível (regra 5). Cada origem tem ícone e estilo de borda próprios. */
export function OriginBadge({ origin }: { origin: DataOrigin }) {
  const meta = ORIGIN_META[origin];
  return (
    <span className={`origin-badge origin-${origin}`} title={meta.description}>
      <OriginIcon origin={origin} size={13} />
      {meta.label}
    </span>
  );
}

export function ClassChip({ varClass }: { varClass: VariableClass }) {
  return <span className={`class-chip class-${varClass}`}>{CLASS_LABEL[varClass]}</span>;
}
