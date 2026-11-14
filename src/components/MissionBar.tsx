import { useEffect, useRef, useState } from 'react';
import type { AstronautState } from '../types/contract';
import { SEVERITY_META } from '../config/display';
import { useOnline, type Theme } from '../lib/theme';
import { Moon, Satellite, SeverityIcon, Sun } from './Icons';

interface Props {
  state: AstronautState;
  asOf: string;
  missionDay: number;
  theme: Theme;
  onToggleTheme: () => void;
  /** Leva à ação do alerta mais grave (aba Visão geral). */
  onShowAlerts: () => void;
}

function gmt(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
  return { date, time };
}

/** Barra de missão: identidade, relógio de missão, tripulante, link com a Terra e o anunciador do estado geral. */
export function MissionBar({ state, asOf, missionDay, theme, onToggleTheme, onShowAlerts }: Props) {
  const online = useOnline();
  const { date, time } = gmt(asOf);
  const count = state.alerts.length;
  const meta = SEVERITY_META[state.overall];

  // Anuncia ao leitor de tela só quando o estado geral muda (não a cada dia da trilha).
  const [announcement, setAnnouncement] = useState('');
  const prev = useRef(state.overall);
  useEffect(() => {
    if (prev.current !== state.overall) {
      setAnnouncement(`Estado geral mudou para ${meta.label}. ${count} alerta${count === 1 ? '' : 's'} ativo${count === 1 ? '' : 's'}.`);
      prev.current = state.overall;
    }
  }, [state.overall, meta.label, count]);

  return (
    <header className="mission-bar">
      <div className="mission-bar__inner">
        <div className="brand">
          <svg className="brand__mark" width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
            <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".45" />
            <path d="M3 17h7l2.5-6 4 11 3-8 1.8 3H29" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h1 className="brand__name">Vigília</h1>
        </div>

        <div className="met" aria-label={`Dia de missão ${missionDay}, ${date} às ${time} GMT`}>
          <span className="met__day">D+{missionDay}</span>
          <span className="met__clock">
            {date} · {time} <abbr title="Greenwich Mean Time, horário de bordo da ISS">GMT</abbr>
          </span>
        </div>

        <dl className="crew">
          <div>
            <dt>Tripulante</dt>
            <dd>{state.name}</dd>
          </div>
          <div>
            <dt>Link com a Terra</dt>
            <dd className="crew__link" title="O app roda inteiro neste dispositivo. Ficar sem link é um estado esperado, não um erro.">
              <Satellite size={15} />
              {online ? 'Disponível' : 'Sem link · operação local'}
            </dd>
          </div>
        </dl>

        <button
          type="button"
          className="shell-btn shell-btn--theme"
          onClick={onToggleTheme}
          aria-pressed={theme === 'dark'}
          aria-label={theme === 'dark' ? 'Usar modo dia' : 'Usar modo pré-sono (luz sem azul)'}
          title="Pré-sono: luz sem azul, inspirada na iluminação de LED da ISS antes do sono"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          <span className="shell-btn__text">{theme === 'dark' ? 'Modo dia' : 'Modo pré-sono'}</span>
        </button>

        {count > 0 ? (
          <a
            href="#alert-action"
            className={`annunciator annunciator--${state.overall}`}
            key={state.overall}
            onClick={(e) => {
              e.preventDefault();
              onShowAlerts();
            }}
          >
            <SeverityIcon severity={state.overall} size={26} />
            <div>
              <span className="annunciator__label">{meta.label}</span>
              <span className="annunciator__sub">
                {count} alerta{count > 1 ? 's' : ''} ativo{count > 1 ? 's' : ''} · ver o que fazer
              </span>
            </div>
          </a>
        ) : (
          <div className={`annunciator annunciator--${state.overall}`} key={state.overall}>
            <SeverityIcon severity={state.overall} size={26} />
            <div>
              <span className="annunciator__label">{meta.label}</span>
              <span className="annunciator__sub">Nenhum alerta ativo</span>
            </div>
          </div>
        )}
      </div>
      <p className="visually-hidden" role="status" aria-live="polite">
        {announcement}
      </p>
    </header>
  );
}
