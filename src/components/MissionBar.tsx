import { useEffect, useRef, useState } from 'react';
import type { AstronautState } from '../types/contract';
import { SEVERITY_META } from '../config/display';
import { useOnline, type Theme } from '../lib/theme';
import { Moon, Satellite, SeverityIcon, StatusIcon, Sun } from './Icons';
import { assessmentSummary } from '../lib/coverage';
import { BASELINE } from '../engine';

interface Props {
  state: AstronautState;
  asOf: string;
  missionDay: number;
  theme: Theme;
  onToggleTheme: () => void;
  /** Goes to the action of the most severe alert (Overview tab). */
  onShowAlerts: () => void;
}

function gmt(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC' });
  return { date, time };
}

/** Mission bar: identity, mission clock, crew member, link with Earth and the overall-status annunciator. */
export function MissionBar({ state, asOf, missionDay, theme, onToggleTheme, onShowAlerts }: Props) {
  const online = useOnline();
  const { date, time } = gmt(asOf);
  const count = state.alerts.length;
  const meta = SEVERITY_META[state.overall];
  const { unassessed: partial, none } = assessmentSummary(state);

  // Announces to screen readers only when the overall status changes (not on every track day).
  const [announcement, setAnnouncement] = useState('');
  const prev = useRef(state.overall);
  useEffect(() => {
    if (prev.current !== state.overall) {
      setAnnouncement(`Overall status changed to ${meta.label}. ${count} active alert${count === 1 ? '' : 's'}.`);
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

        <div className="met" aria-label={missionDay >= 1 ? `Mission day ${missionDay}, ${date} at ${time} GMT` : `Pre-flight, day ${missionDay + BASELINE.preflightDays} of ${BASELINE.preflightDays}, ${date} at ${time} GMT`}>
          <span className="met__day">{missionDay >= 1 ? `D+${missionDay}` : `PF ${missionDay + BASELINE.preflightDays}/${BASELINE.preflightDays}`}</span>
          <span className="met__clock">
            {date} · {time} <abbr title="Greenwich Mean Time, ISS onboard time">GMT</abbr>
          </span>
        </div>

        <dl className="crew">
          <div>
            <dt>Crew member</dt>
            <dd>{state.name}</dd>
          </div>
          <div>
            <dt>Link with Earth</dt>
            <dd className="crew__link" title="The app runs entirely on this device. Having no link is an expected state, not an error.">
              <Satellite size={15} />
              {online ? 'Available' : 'No link · local operation'}
            </dd>
          </div>
        </dl>

        <button
          type="button"
          className="shell-btn shell-btn--theme"
          onClick={onToggleTheme}
          aria-pressed={theme === 'dark'}
          aria-label={theme === 'dark' ? 'Use day mode' : 'Use night mode'}
          title={theme === 'dark' ? 'Back to day mode' : 'Night mode: dark, soft tones for low light'}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          <span className="shell-btn__text">{theme === 'dark' ? 'Day mode' : 'Night mode'}</span>
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
                {count} active alert{count > 1 ? 's' : ''}
                {partial.length > 0 && ` · ${partial.length} not assessed`} · see what to do
              </span>
            </div>
          </a>
        ) : (
          <div className={`annunciator annunciator--${partial.length ? 'unassessed' : state.overall}`} key={partial.length ? 'p' : state.overall}>
            {partial.length ? <StatusIcon status="unassessed" size={26} /> : <SeverityIcon severity={state.overall} size={26} />}
            <div>
              <span className="annunciator__label">{none ? 'No data' : partial.length ? 'Partial assessment' : meta.label}</span>
              <span className="annunciator__sub">
                {none
                  ? 'No signal could be assessed'
                  : partial.length
                    ? `No alerts · ${partial.length} of 7 signals not assessed`
                    : 'No active alerts'}
              </span>
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
