import { useEffect, useId, useState } from 'react';
import { SEVERITY_META } from '../config/display';
import type { MissionHistory } from '../lib/missionHistory';
import { useT } from '../i18n';
import { ChevronLeft, ChevronRight, Crosshair, Pause, Play, SeverityIcon } from './Icons';

export type ChartWindow = 'recent' | 'all';

interface Props {
  day: number;
  maxDay: number;
  preflightDays: number;
  history: MissionHistory;
  /** Days with actions logged by the astronaut (follow-up). */
  actionDays?: number[];
  onChange: (day: number) => void;
  chartWindow: ChartWindow;
  /** First day shown by the charts (null = whole mission). */
  windowFrom: number | null;
  onWindowChange: (w: ChartWindow) => void;
}

const PLAY_STEP_MS = 160;
/** Onsets less than N days apart go on the upper row so they do not overlap. */
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
 * Mission track: each flight day with its overall status (height + color), when each alert began
 * and the cursor for the assessed day. Dragging or using the buttons re-evaluates the state on that day.
 */
export function MissionTrack({ day, maxDay, preflightDays, history, actionDays = [], onChange, chartWindow, windowFrom, onWindowChange }: Props) {
  const t = useT();
  const id = useId();
  const [playing, setPlaying] = useState(false);
  const first = 1 - preflightDays; // first pre-flight day
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
    const timer = window.setTimeout(() => onChange(day + 1), PLAY_STEP_MS);
    return () => window.clearTimeout(timer);
  }, [playing, day, maxDay, onChange]);

  const ticks: number[] = [1];
  for (let d = 14; d < maxDay - 4; d += 14) ticks.push(d);
  ticks.push(maxDay);

  return (
    <section className="track" aria-labelledby={`${id}-title`}>
      <div className="track__head">
        <h2 id={`${id}-title`} className="track__title">
          {t({ en: 'Mission track', pt: 'Trilha da missão' })}
        </h2>
        <p className="track__now">
          {t({ en: 'Assessing', pt: 'Avaliando o' })} <strong>{t({ en: `day ${day}`, pt: `dia ${day}` })}</strong>{' '}
          {t({ en: 'of', pt: 'de' })} {maxDay}
          {atEnd && <span> · {t({ en: 'latest', pt: 'mais recente' })}</span>}
        </p>
        <div className="track__controls">
          <button type="button" className="shell-btn shell-btn--icon" onClick={() => onChange(Math.max(1, day - 1))} disabled={day <= 1} aria-label={t({ en: 'Previous day', pt: 'Dia anterior' })} title={t({ en: 'Previous day (←)', pt: 'Dia anterior (←)' })}>
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
            {playing ? t({ en: 'Pause', pt: 'Pausar' }) : t({ en: 'Play', pt: 'Reproduzir' })}
          </button>
          <button type="button" className="shell-btn shell-btn--icon" onClick={() => onChange(Math.min(maxDay, day + 1))} disabled={atEnd} aria-label={t({ en: 'Next day', pt: 'Próximo dia' })} title={t({ en: 'Next day (→)', pt: 'Próximo dia (→)' })}>
            <ChevronRight />
          </button>
          <button type="button" className="shell-btn" onClick={() => onChange(maxDay)} disabled={atEnd}>
            <Crosshair size={14} />
            {t({ en: 'Today', pt: 'Hoje' })}
          </button>
          <div className="segmented" role="group" aria-label={t({ en: 'Chart period', pt: 'Período dos gráficos' })}>
            <button type="button" aria-pressed={chartWindow === 'recent'} onClick={() => onWindowChange('recent')}>
              {t({ en: '6 weeks', pt: '6 semanas' })}
            </button>
            <button type="button" aria-pressed={chartWindow === 'all'} onClick={() => onWindowChange('all')}>
              {t({ en: 'Whole mission', pt: 'Missão inteira' })}
            </button>
          </div>
        </div>
      </div>

      <div className="track__lane">
        <div className="track__preflight" style={{ left: 0, width: `${(preflightDays / span) * 100}%` }}>
          <span>{t({ en: 'pre-flight', pt: 'pré-voo' })}</span>
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
            style={{ left: `${pct(o.day)}%`, top: `${level * 24}px` }}
            onClick={() => onChange(o.day)}
            title={t({
              en: `${t(SEVERITY_META[o.severity].label)} · day ${o.day}: ${o.title}`,
              pt: `${t(SEVERITY_META[o.severity].label)} · dia ${o.day}: ${o.title}`,
            })}
            aria-label={t({
              en: `Go to day ${o.day}: ${t(SEVERITY_META[o.severity].label).toLowerCase()} onset, ${o.title}`,
              pt: `Ir ao dia ${o.day}: início de ${t(SEVERITY_META[o.severity].label).toLowerCase()}, ${o.title}`,
            })}
          >
            <SeverityIcon severity={o.severity} size={14} />
          </button>
        ))}

        {[...new Set(actionDays)].filter((d) => d >= 1 && d <= maxDay).map((d) => (
          <span key={`act-${d}`} className="track__action" style={{ left: `${pct(d)}%` }} title={t({ en: `Action logged on day ${d}`, pt: `Ação registrada no dia ${d}` })} aria-hidden="true" />
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
          aria-label={t({ en: 'Assessed mission day', pt: 'Dia de missão avaliado' })}
          aria-valuetext={t({ en: `Day ${day} of ${maxDay}`, pt: `Dia ${day} de ${maxDay}` })}
          style={{ left: `${pct(1) - 50 / span}%`, width: `${((maxDay) / span) * 100}%` }}
          onChange={(e) => {
            setPlaying(false);
            onChange(Number(e.target.value));
          }}
        />
      </div>

      <div className="track__ticks" aria-hidden="true">
        {ticks.map((tick) => (
          <span key={tick} style={{ left: `${pct(tick)}%` }}>
            D{tick}
          </span>
        ))}
      </div>

      <ul className="track__legend" aria-label={t({ en: 'Track legend', pt: 'Legenda da trilha' })}>
        {(['normal', 'attention', 'critical'] as const).map((s) => (
          <li key={s}>
            <span className={`track__key track__day--${s}`} />
            {t(SEVERITY_META[s].label)}
          </li>
        ))}
        <li>
          <SeverityIcon severity="attention" size={13} />{' '}
          {t({ en: 'alert onset (click to go to that day)', pt: 'início de um alerta (clique para ir ao dia)' })}
        </li>
        <li>
          <span className="track__key track__key--window" />{' '}
          {t({ en: 'period shown in the charts', pt: 'período mostrado nos gráficos' })}
        </li>
        {actionDays.length > 0 && (
          <li>
            <span className="track__key track__key--action" /> {t({ en: 'action logged', pt: 'ação registrada' })}
          </li>
        )}
      </ul>
    </section>
  );
}
