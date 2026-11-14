import type { AstronautState } from '../types/contract';
import { SEVERITY_META } from '../config/display';
import { fmtDateTime } from '../lib/format';
import { useOnline, type Theme } from '../lib/theme';
import { SeverityBadge } from './Badges';
import { Moon, Satellite, Sun } from './Icons';

interface Props {
  state: AstronautState;
  asOf: string;
  theme: Theme;
  onToggleTheme: () => void;
}

export function MissionHeader({ state, asOf, theme, onToggleTheme }: Props) {
  const online = useOnline();
  const active = state.alerts.length;
  return (
    <header className="mission">
      <div className="mission__brand">
        <svg width="34" height="34" viewBox="0 0 32 32" aria-hidden="true">
          <circle cx="16" cy="16" r="15" fill="var(--brand-bg)" />
          <ellipse cx="16" cy="16" rx="12" ry="5" fill="none" stroke="var(--series-1)" strokeWidth="1.5" transform="rotate(-25 16 16)" />
          <path d="M6 17h5l2-5 3 9 2-6 1.5 2H26" fill="none" stroke="var(--normal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div>
          <p className="mission__app">Vigília</p>
          <p className="mission__tag">Coletar · Interpretar · Orientar</p>
        </div>
      </div>

      <dl className="mission__facts">
        <div>
          <dt>Tripulante</dt>
          <dd>{state.name}</dd>
        </div>
        <div>
          <dt>Dia de missão</dt>
          <dd>{state.missionDay}</dd>
        </div>
        <div>
          <dt>Avaliado em</dt>
          <dd>{fmtDateTime(asOf)}</dd>
        </div>
      </dl>

      <div className={`mission__overall sev-panel-${state.overall}`} aria-live="polite">
        <span className="mission__overall-label">Estado geral</span>
        <SeverityBadge severity={state.overall} size="lg" />
        <span className="small">
          {active === 0 ? 'Nenhum alerta ativo' : `${active} alerta${active > 1 ? 's' : ''} ativo${active > 1 ? 's' : ''}`} ·{' '}
          {SEVERITY_META[state.overall].summary}
        </span>
      </div>

      <div className="mission__tools">
        <span className="link-status" title="O app roda inteiro neste dispositivo. Falta de link é estado esperado, não erro.">
          <Satellite />
          {online ? 'Link com a Terra disponível' : 'Sem link com a Terra'} · operação local
        </span>
        <button type="button" className="btn btn--ghost" onClick={onToggleTheme} aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}>
          {theme === 'dark' ? <Sun /> : <Moon />}
          {theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
        </button>
      </div>
    </header>
  );
}
