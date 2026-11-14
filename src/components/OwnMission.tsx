import { useId, useState, type FormEvent } from 'react';
import { BASELINE } from '../engine';
import type { OwnProfile } from '../lib/ownMission';
import { OriginBadge } from './Badges';

/** "My mission" mode bar: who it is, how the baseline stands and the way back to the demo. */
export function OwnMissionBar({
  profile,
  preflightDaysLogged,
  inFlight,
  onDemo,
  onErase,
}: {
  profile: OwnProfile;
  preflightDaysLogged: number;
  inFlight: boolean;
  onDemo: () => void;
  onErase: () => void;
}) {
  const total = BASELINE.preflightDays;
  return (
    <section className="demo-bar own-bar" aria-label="My mission">
      <span className="demo-bar__label">My mission</span>
      <strong>{profile.name}</strong>
      <span className="own-bar__id">{profile.astronautId}</span>
      <OriginBadge origin="measured" />
      <span className="own-bar__baseline">
        {inFlight
          ? `Baseline formed from ${Math.min(preflightDaysLogged, total)} of ${total} pre-flight days`
          : `Pre-flight: ${preflightDaysLogged} of ${total} days logged — the baseline forms at the end of pre-flight`}
      </span>
      <div className="own-bar__actions">
        <button type="button" className="console-btn" onClick={onDemo}>
          Go to the demo
        </button>
        <button type="button" className="console-btn console-btn--danger" onClick={onErase}>
          Erase my data
        </button>
      </div>
    </section>
  );
}

/** Creates the own mission: just a nickname; personal data is neither requested nor stored. */
export function OwnMissionSetup({ onCreate, onDemo }: { onCreate: (name: string) => void; onDemo: () => void }) {
  const id = useId();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError('Enter a nickname of at least 2 letters.');
      return;
    }
    onCreate(name);
  }

  return (
    <section className="panel setup" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>Create my mission</h2>
      <p>
        Use Vigília with your own entries, separate from the demo. It works offline and the data stays only on this
        device.
      </p>
      <ol className="setup__steps">
        <li>
          <strong>Pre-flight, {BASELINE.preflightDays} days.</strong> Log your measurements every day. They form your
          individual baseline; nothing is assessed yet.
        </li>
        <li>
          <strong>In flight.</strong> From day 1, the engine compares each entry with your baseline and shows alerts, or
          “Not assessed” when data is missing.
        </li>
        <li>
          <strong>Follow up.</strong> Log what you did with each piece of guidance and see how things evolve on the mission track.
        </li>
      </ol>
      <form className="form setup__form" onSubmit={submit} noValidate>
        <label className="field">
          <span>Nickname or fictitious ID</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            aria-invalid={!!error}
            aria-describedby={`${id}-hint${error ? ` ${id}-err` : ''}`}
          />
          <span id={`${id}-hint`} className="muted small">
            Do not use your full name or personal data.
          </span>
          {error && (
            <span id={`${id}-err`} className="field-error">
              {error}
            </span>
          )}
        </label>
        <div className="setup__buttons">
          <button type="submit" className="btn btn--primary">
            Create and start pre-flight
          </button>
          <button type="button" className="btn" onClick={onDemo}>
            Back to the demo
          </button>
        </div>
      </form>
    </section>
  );
}
