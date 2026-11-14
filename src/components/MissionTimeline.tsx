import { useEffect, useId, useState } from 'react';

interface Props {
  day: number;
  minDay: number;
  maxDay: number;
  onChange: (day: number) => void;
}

const PLAY_STEP_MS = 180;

/** Linha do tempo da missão: reavalia o estado em qualquer dia para mostrar quando cada padrão surgiu. */
export function MissionTimeline({ day, minDay, maxDay, onChange }: Props) {
  const id = useId();
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    if (day >= maxDay) {
      setPlaying(false);
      return;
    }
    const t = window.setTimeout(() => onChange(day + 1), PLAY_STEP_MS);
    return () => window.clearTimeout(t);
  }, [playing, day, maxDay, onChange]);

  const atEnd = day >= maxDay;

  return (
    <section className="timeline" aria-label="Linha do tempo da missão">
      <label htmlFor={id} className="timeline__label">
        Avaliar no dia de missão <strong>{day}</strong>
        {atEnd ? <span className="muted"> (mais recente)</span> : <span className="muted"> de {maxDay}</span>}
      </label>
      <div className="timeline__controls">
        <button type="button" className="btn btn--small" onClick={() => onChange(Math.max(minDay, day - 1))} disabled={day <= minDay} aria-label="Dia anterior">
          ◀
        </button>
        <input
          id={id}
          type="range"
          min={minDay}
          max={maxDay}
          value={day}
          onChange={(e) => {
            setPlaying(false);
            onChange(Number(e.target.value));
          }}
        />
        <button type="button" className="btn btn--small" onClick={() => onChange(Math.min(maxDay, day + 1))} disabled={atEnd} aria-label="Próximo dia">
          ▶
        </button>
        <button
          type="button"
          className="btn btn--small"
          onClick={() => {
            if (atEnd) onChange(Math.max(minDay, maxDay - 35));
            setPlaying((p) => !p);
          }}
          aria-pressed={playing}
        >
          {playing ? 'Pausar' : 'Reproduzir'}
        </button>
        <button type="button" className="btn btn--small" onClick={() => onChange(maxDay)} disabled={atEnd}>
          Hoje
        </button>
      </div>
    </section>
  );
}
