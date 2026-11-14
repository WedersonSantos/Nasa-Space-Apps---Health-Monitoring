// Textos e constantes puramente visuais. Nada aqui decide se há alerta.

import type { DataOrigin, Severity } from '../types/contract';

export const SEVERITY_META: Record<Severity, { label: string; summary: string; rank: number }> = {
  normal: { label: 'Normal', summary: 'Sinais dentro do baseline individual', rank: 0 },
  attention: { label: 'Atenção', summary: 'Desvio do baseline que pede ação', rank: 1 },
  critical: { label: 'Crítico', summary: 'Acionar oficial médico da tripulação', rank: 2 },
};

export const ORIGIN_META: Record<DataOrigin, { label: string; description: string }> = {
  synthetic: { label: 'Sintético', description: 'Gerado por script para demonstração. Não é telemetria real.' },
  measured: { label: 'Medido', description: 'Registrado por sensor ou entrada manual.' },
  estimated: { label: 'Estimado', description: 'Valor inferido, não medido diretamente.' },
};

/** Largura da faixa de baseline desenhada nos gráficos (±N desvios padrão). Apenas visual. */
export const BASELINE_BAND_SD = 1;

/** Quantos dias de histórico os gráficos mostram. */
export const CHART_WINDOW_DAYS = 35;

export const SELF_REPORT_DIMENSIONS = [
  { method: 'self-report:mood', label: 'Humor', low: 'muito ruim', high: 'muito bom' },
  { method: 'self-report:stress', label: 'Estresse', low: 'muito baixo', high: 'muito alto' },
  { method: 'self-report:fatigue', label: 'Fadiga', low: 'nenhuma', high: 'extrema' },
] as const;
