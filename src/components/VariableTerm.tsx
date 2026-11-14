import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { VariableId } from '../types/contract';
import { CLASS_LABEL, HAZARD_LABEL, VARIABLES } from '../config/variables';

const WIDTH = 340;
const GAP = 8;
const MARGIN = 12;

/**
 * Nome de um parâmetro com explicação ao passar o mouse, ao focar pelo teclado ou ao tocar.
 * Esc fecha. O texto vem de config/variables.ts — o mesmo do "O que mede e por que importa".
 */
export function VariableTerm({ variable, children }: { variable: VariableId; children?: React.ReactNode }) {
  const meta = VARIABLES[variable];
  const id = useId();
  const anchor = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<number>();
  const [pos, setPos] = useState<{ left: number; top: number; above: boolean } | null>(null);

  const open = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    const r = anchor.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.min(WIDTH, window.innerWidth - 2 * MARGIN);
    const left = Math.min(Math.max(MARGIN, r.left), window.innerWidth - width - MARGIN);
    const above = r.bottom + 240 > window.innerHeight && r.top > 260;
    setPos({ left, top: above ? r.top - GAP : r.bottom + GAP, above });
  }, []);

  const close = useCallback(() => setPos(null), []);
  const closeSoon = useCallback(() => {
    closeTimer.current = window.setTimeout(close, 120);
  }, [close]);

  useEffect(() => {
    if (!pos) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [pos, close]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  return (
    <>
      <button
        ref={anchor}
        type="button"
        className="term"
        aria-describedby={pos ? id : undefined}
        aria-expanded={!!pos}
        onMouseEnter={open}
        onMouseLeave={closeSoon}
        onFocus={open}
        onBlur={close}
        onClick={() => (pos ? close() : open())}
      >
        {children ?? meta.label}
        <svg className="term__icon" width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M12 11v6M12 7.5v.1" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </button>
      {pos && (
        <div
          id={id}
          role="tooltip"
          className={`term-pop${pos.above ? ' term-pop--above' : ''}`}
          style={{ left: pos.left, top: pos.top, width: Math.min(WIDTH, window.innerWidth - 2 * MARGIN) }}
          onMouseEnter={() => window.clearTimeout(closeTimer.current)}
          onMouseLeave={closeSoon}
        >
          <p className="term-pop__title">
            {meta.label} <span className="term-pop__unit">{meta.unit === '/5' ? 'escala 1–5' : meta.unit}</span>
          </p>
          <p className="term-pop__kicker">
            {CLASS_LABEL[meta.varClass]} · {HAZARD_LABEL[meta.hazards[0]]}
          </p>
          <p>
            <strong>O que mede:</strong> {meta.whatItMeasures}
          </p>
          <p>
            <strong>Por que importa no espaço:</strong> {meta.whyItMatters}
          </p>
          <p className="term-pop__foot">Alerta quando: {meta.ruleSummary}</p>
        </div>
      )}
    </>
  );
}
