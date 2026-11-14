import { useEffect, useId, useState } from 'react';
import { SEVERITY_META } from '../config/display';
import type { MissionHistory } from '../lib/missionHistory';
import { ChevronLeft, ChevronRight, Crosshair, Pause, Play, SeverityIcon } from './Icons';

export type ChartWindow = 'recent' | 'all';

interface Props {
  day: number;
  maxDay: number;
  preflightDays: number;
  history: MissionHistory;
  onChange: (day: number) => void;
  chartWindow: ChartWindow;
  /** Primeiro dia exibido pelos gráficos (null = missão inteira). */
  windowFrom: number | null;
  onWindowChange: (w: ChartWindow) => void;
}

const PLAY_STEP_MS = 160;
/** Inícios a menos de N dias um do outro vão para a linha de cima, para não se sobreporem. */
const ONSET_MIN_GAP_DAYS = 4;

function withLevels(onsets: MissionHistory['onsets']) {
  const lastDayAt = [-Infinity, -Infinity];
  return onsets.map((o) => {
    const level = o.day - lastDayAt[0] >= ONSET_MIN_GAP_DAYS ? 0 : 1;
    lastDayAt[level] = o.day;
    return { o, level };
  });
}

/**
 * Trilha da missão: cada dia de voo com o estado geral (altura + cor), o início de cada alerta
 * e o cursor do dia avaliado. Arrastar ou usar os botões reavalia o estado naquele dia.
 */
export function MissionTrack({ day, maxDay, preflightDays, history, onChange, chartWindow, windowFrom, onWindowChange }: Props) {
  const id = useId();
  const [playing, setPlaying] = useState(false);
  const first = 1 - preflightDays; // primeiro dia de pré-voo
  const span = maxDay - first + 1;
  const pct = (d: number) => ((d - first + 0.5) / span) * 100;
  const atEnd = day >= maxDay;
  const wf = Math.max(first, windowFrom ?? first);

  useEffect(() => {
    if (!playing) return;
    if (day >= maxDay) {
      setPlaying(false);
      return;
    }
    const t = window.setTimeout(() => onChange(day + 1), PLAY_STEP_MS);
    return () => window.clearTimeout(t);
  }, [playing, day, maxDay, onChange]);

  const ticks: number[] = [1];
  for (let d = 14; d < maxDay - 4; d += 14) ticks.push(d);
  ticks.push(maxDay);

  return (
    <section className="track" aria-labelledby={`${id}-title`}>
      <div className="track__head">
        <h2 id={`${id}-title`} className="track__title">
          Trilha da missão
        </h2>
        <p className="track__now">
          Avaliando o <strong>dia {day}</strong> de {maxDay}
          {atEnd && <span> · mais recente</span>}
        </p>
        <div className="track__controls">
          <button type="button" className="shell-btn shell-btn--icon" onClick={() => onChange(Math.max(1, day - 1))} disabled={day <= 1} aria-label="Dia anterior" title="Dia anterior (←)">
            <ChevronLeft />
          </button>
          <button
            type="button"
            className="shell-btn"
            aria-pressed={playing}
            onClick={() => {
              if (!playing && atEnd) onChange(Math.max(1, maxDay - 35));
              setPlaying((p) => !p);
            }}
          >
            {playing ? <Pause size={14} /> : <Play size={14} />}
            {playing ? 'Pausar' : 'Reproduzir'}
          </button>
          <button type="button" className="shell-btn shell-btn--icon" onClick={() => onChange(Math.min(maxDay, day + 1))} disabled={atEnd} aria-label="Próximo dia" title="Próximo dia (→)">
            <ChevronRight />
          </button>
          <button type="button" className="shell-btn" onClick={() => onChange(maxDay)} disabled={atEnd}>
            <Crosshair size={14} />
            Hoje
          </button>
          <div className="segmented" role="group" aria-label="Período dos gráficos">
            <button type="button" aria-pressed={chartWindow === 'recent'} onClick={() => onWindowChange('recent')}>
              6 semanas
            </button>
            <button type="button" aria-pressed={chartWindow === 'all'} onClick={() => onWindowChange('all')}>
              Missão inteira
            </button>
          </div>
        </div>
      </div>

      <div className="track__lane">
        <div className="track__preflight" style={{ left: 0, width: `${(preflightDays / span) * 100}%` }}>
          <span>pré-voo</span>
        </div>

        <div className="track__days" aria-hidden="true">
          {history.days.map((d) => (
            <span
              key={d.day}
              className={`track__day track__day--${d.overall}${d.day > day ? ' is-future' : ''}`}
              style={{ left: `${pct(d.day)}%`, width: `${100 / span}%` }}
            />
          ))}
        </div>

        {withLevels(history.onsets).map(({ o, level }) => (
          <button
            key={o.id}
            type="button"
            className={`track__onset sev-${o.severity}`}
            style={{ left: `${pct(o.day)}%`, top: `${level * 28}px` }}
            onClick={() => onChange(o.day)}
            title={`${SEVERITY_META[o.severity].label} · dia ${o.day}: ${o.title}`}
            aria-label={`Ir ao dia ${o.day}: início de ${SEVERITY_META[o.severity].label.toLowerCase()}, ${o.title}`}
          >
            <SeverityIcon severity={o.severity} size={14} />
          </button>
        ))}

        <div
          className="track__window"
          style={{ left: `${pct(wf) - 50 / span}%`, width: `${((day - wf + 1) / span) * 100}%` }}
          aria-hidden="true"
        />

        <div className="track__cursor" style={{ left: `${pct(day)}%` }} aria-hidden="true" />

        <input
          className="track__range"
          type="range"
          min={1}
          max={maxDay}
          value={day}
          aria-label="Dia de missão avaliado"
          aria-valuetext={`Dia ${day} de ${maxDay}`}
          style={{ left: `${pct(1) - 50 / span}%`, width: `${((maxDay) / span) * 100}%` }}
          onChange={(e) => {
            setPlaying(false);
            onChange(Number(e.target.value));
          }}
        />
      </div>

      <div className="track__ticks" aria-hidden="true">
        {ticks.map((t) => (
          <span key={t} style={{ left: `${pct(t)}%` }}>
            D{t}
          </span>
        ))}
      </div>

      <ul className="track__legend" aria-label="Legenda da trilha">
        {(['normal', 'attention', 'critical'] as const).map((s) => (
          <li key={s}>
            <span className={`track__key track__day--${s}`} />
            {SEVERITY_META[s].label}
          </li>
        ))}
        <li>
          <SeverityIcon severity="attention" size={13} /> início de um alerta (clique para ir ao dia)
        </li>
        <li>
          <span className="track__key track__key--window" /> período mostrado nos gráficos
        </li>
      </ul>
    </section>
  );
}
