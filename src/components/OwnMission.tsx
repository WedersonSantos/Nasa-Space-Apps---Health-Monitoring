import { useId, useState, type FormEvent } from 'react';
import { BASELINE } from '../engine';
import type { OwnProfile } from '../lib/ownMission';
import { useT, type L10n } from '../i18n';
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
  const t = useT();
  const total = BASELINE.preflightDays;
  return (
    <section className="demo-bar own-bar" aria-label={t({ en: 'My mission', pt: 'Minha missão' })}>
      <span className="demo-bar__label">{t({ en: 'My mission', pt: 'Minha missão' })}</span>
      <strong>{profile.name}</strong>
      <span className="own-bar__id">{profile.astronautId}</span>
      <OriginBadge origin="measured" />
      <span className="own-bar__baseline">
        {inFlight
          ? t({
              en: `Baseline formed from ${Math.min(preflightDaysLogged, total)} of ${total} pre-flight days`,
              pt: `Baseline formado com ${Math.min(preflightDaysLogged, total)} de ${total} dias de pré-voo`,
            })
          : t({
              en: `Pre-flight: ${preflightDaysLogged} of ${total} days logged — the baseline forms at the end of pre-flight`,
              pt: `Pré-voo: ${preflightDaysLogged} de ${total} dias registrados — o baseline se forma ao fim do pré-voo`,
            })}
      </span>
      <div className="own-bar__actions">
        <button type="button" className="console-btn" onClick={onDemo}>
          {t({ en: 'Go to the demo', pt: 'Ir para a demonstração' })}
        </button>
        <button type="button" className="console-btn console-btn--danger" onClick={onErase}>
          {t({ en: 'Erase my data', pt: 'Apagar meus dados' })}
        </button>
      </div>
    </section>
  );
}

/** Creates the own mission: just a nickname; personal data is neither requested nor stored. */
export function OwnMissionSetup({ onCreate, onDemo }: { onCreate: (name: string) => void; onDemo: () => void }) {
  const t = useT();
  const id = useId();
  const [name, setName] = useState('');
  const [error, setError] = useState<L10n | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError({ en: 'Enter a nickname of at least 2 letters.', pt: 'Escreva um apelido com pelo menos 2 letras.' });
      return;
    }
    onCreate(name);
  }

  return (
    <section className="panel setup" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{t({ en: 'Create my mission', pt: 'Criar minha missão' })}</h2>
      <p>
        {t({
          en: 'Use Vigília with your own entries, separate from the demo. It works offline and the data stays only on this device.',
          pt: 'Use o Vigília com os seus próprios registros, separados da demonstração. Funciona sem internet e os dados ficam só neste dispositivo.',
        })}
      </p>
      <ol className="setup__steps">
        <li>
          <strong>
            {t({ en: `Pre-flight, ${BASELINE.preflightDays} days.`, pt: `Pré-voo, ${BASELINE.preflightDays} dias.` })}
          </strong>{' '}
          {t({
            en: 'Log your measurements every day. They form your individual baseline; nothing is assessed yet.',
            pt: 'Registre as medições todos os dias. Elas formam o seu baseline individual; nada é avaliado ainda.',
          })}
        </li>
        <li>
          <strong>{t({ en: 'In flight.', pt: 'Em voo.' })}</strong>{' '}
          {t({
            en: 'From day 1, the engine compares each entry with your baseline and shows alerts, or “Not assessed” when data is missing.',
            pt: 'A partir do dia 1, o motor compara cada registro com o seu baseline e mostra alertas, ou “Não avaliado” quando faltam dados.',
          })}
        </li>
        <li>
          <strong>{t({ en: 'Follow up.', pt: 'Acompanhe.' })}</strong>{' '}
          {t({
            en: 'Log what you did with each piece of guidance and see how things evolve on the mission track.',
            pt: 'Registre o que fez com cada orientação e veja a evolução na trilha da missão.',
          })}
        </li>
      </ol>
      <form className="form setup__form" onSubmit={submit} noValidate>
        <label className="field">
          <span>{t({ en: 'Nickname or fictitious ID', pt: 'Apelido ou identificação fictícia' })}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            aria-invalid={!!error}
            aria-describedby={`${id}-hint${error ? ` ${id}-err` : ''}`}
          />
          <span id={`${id}-hint`} className="muted small">
            {t({ en: 'Do not use your full name or personal data.', pt: 'Não use nome completo nem dados pessoais.' })}
          </span>
          {error && (
            <span id={`${id}-err`} className="field-error">
              {t(error)}
            </span>
          )}
        </label>
        <div className="setup__buttons">
          <button type="submit" className="btn btn--primary">
            {t({ en: 'Create and start pre-flight', pt: 'Criar e começar o pré-voo' })}
          </button>
          <button type="button" className="btn" onClick={onDemo}>
            {t({ en: 'Back to the demo', pt: 'Voltar à demonstração' })}
          </button>
        </div>
      </form>
    </section>
  );
}
