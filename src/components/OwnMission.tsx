import { useId, useState, type FormEvent } from 'react';
import { BASELINE } from '../engine';
import {
  CREW_MAX,
  CREW_ROLES,
  CREW_ROLE_LABEL,
  MISSION_NAME_MAX,
  NAME_MAX,
  crewNameError,
  type Crew,
  type CrewMember,
  type CrewRole,
} from '../lib/ownMission';
import { useT, type L10n } from '../i18n';
import { OriginBadge } from './Badges';

/** "My mission" mode bar: mission, which crew member is on screen, baseline status and the way back to the demo. */
export function OwnMissionBar({
  crew,
  member,
  preflightDaysLogged,
  inFlight,
  crewOpen,
  onSelect,
  onToggleCrew,
  onDemo,
  onErase,
}: {
  crew: Crew;
  member: CrewMember;
  preflightDaysLogged: number;
  inFlight: boolean;
  crewOpen: boolean;
  onSelect: (astronautId: string) => void;
  onToggleCrew: () => void;
  onDemo: () => void;
  onErase: () => void;
}) {
  const t = useT();
  const id = useId();
  const total = BASELINE.preflightDays;
  return (
    <section className="demo-bar own-bar" aria-label={t({ en: 'My mission', pt: 'Minha missão' })}>
      <span className="demo-bar__label">{crew.missionName || t({ en: 'My mission', pt: 'Minha missão' })}</span>
      {crew.members.length > 1 ? (
        <label className="own-bar__member" htmlFor={`${id}-member`}>
          <span className="visually-hidden">{t({ en: 'Crew member on screen', pt: 'Tripulante em exibição' })}</span>
          <select id={`${id}-member`} value={member.astronautId} onChange={(e) => onSelect(e.target.value)}>
            {crew.members.map((m) => (
              <option key={m.astronautId} value={m.astronautId}>
                {m.name} · {t(CREW_ROLE_LABEL[m.role])}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <>
          <strong>{member.name}</strong>
          <span className="own-bar__id">{t(CREW_ROLE_LABEL[member.role])}</span>
        </>
      )}
      <span className="own-bar__id">{member.astronautId}</span>
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
        <button type="button" className="console-btn" aria-expanded={crewOpen} aria-controls="crew-panel" onClick={onToggleCrew}>
          {t({ en: `Crew (${crew.members.length})`, pt: `Tripulação (${crew.members.length})` })}
        </button>
        <button type="button" className="console-btn" onClick={onDemo}>
          {t({ en: 'Go to the demo', pt: 'Ir para a demonstração' })}
        </button>
        <button type="button" className="console-btn console-btn--danger" onClick={onErase}>
          {t({ en: 'Erase mission', pt: 'Apagar missão' })}
        </button>
      </div>
    </section>
  );
}

/** Nickname + role fields, shared by the setup and the "add crew member" form. */
function MemberFields({
  idBase,
  name,
  role,
  error,
  onName,
  onRole,
}: {
  idBase: string;
  name: string;
  role: CrewRole;
  error: L10n | null;
  onName: (v: string) => void;
  onRole: (r: CrewRole) => void;
}) {
  const t = useT();
  return (
    <div className="field-row">
      <label className="field">
        <span>{t({ en: 'Nickname or fictitious ID', pt: 'Apelido ou identificação fictícia' })}</span>
        <input
          value={name}
          onChange={(e) => onName(e.target.value)}
          maxLength={NAME_MAX}
          aria-invalid={!!error}
          aria-describedby={`${idBase}-hint${error ? ` ${idBase}-err` : ''}`}
        />
        <span id={`${idBase}-hint`} className="muted small">
          {t({ en: 'Do not use full names or personal data.', pt: 'Não use nome completo nem dados pessoais.' })}
        </span>
        {error && (
          <span id={`${idBase}-err`} className="field-error">
            {t(error)}
          </span>
        )}
      </label>
      <label className="field">
        <span>{t({ en: 'Role on board', pt: 'Função a bordo' })}</span>
        <select value={role} onChange={(e) => onRole(e.target.value as CrewRole)}>
          {CREW_ROLES.map((r) => (
            <option key={r} value={r}>
              {t(CREW_ROLE_LABEL[r])}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

/** Creates the own mission: mission name and the first crew member. Personal data is neither requested nor stored. */
export function OwnMissionSetup({
  onCreate,
  onDemo,
}: {
  onCreate: (missionName: string, name: string, role: CrewRole) => void;
  onDemo: () => void;
}) {
  const t = useT();
  const id = useId();
  const [mission, setMission] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<CrewRole>('commander');
  const [error, setError] = useState<L10n | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    const err = crewNameError(name, null);
    setError(err);
    if (!err) onCreate(mission.trim(), name, role);
  }

  return (
    <section className="panel setup" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{t({ en: 'Create my mission', pt: 'Criar minha missão' })}</h2>
      <p>
        {t({
          en: 'Use Vigília with your own entries, separate from the demo. Register the crew and log each member’s measurements separately. It works offline and the data stays only on this device.',
          pt: 'Use o Vigília com os seus próprios registros, separados da demonstração. Cadastre a tripulação e registre as medições de cada tripulante separadamente. Funciona sem internet e os dados ficam só neste dispositivo.',
        })}
      </p>
      <ol className="setup__steps">
        <li>
          <strong>{t({ en: 'Crew.', pt: 'Tripulação.' })}</strong>{' '}
          {t({
            en: `Register the first crew member now; add up to ${CREW_MAX} later from the Crew button.`,
            pt: `Cadastre o primeiro tripulante agora; adicione até ${CREW_MAX} depois, pelo botão Tripulação.`,
          })}
        </li>
        <li>
          <strong>
            {t({ en: `Pre-flight, ${BASELINE.preflightDays} days.`, pt: `Pré-voo, ${BASELINE.preflightDays} dias.` })}
          </strong>{' '}
          {t({
            en: 'Each crew member logs measurements every day. They form that person’s individual baseline; nothing is assessed yet.',
            pt: 'Cada tripulante registra as medições todos os dias. Elas formam o baseline individual daquela pessoa; nada é avaliado ainda.',
          })}
        </li>
        <li>
          <strong>{t({ en: 'In flight.', pt: 'Em voo.' })}</strong>{' '}
          {t({
            en: 'From day 1, the engine compares each entry with the crew member’s own baseline and shows alerts, or “Not assessed” when data is missing.',
            pt: 'A partir do dia 1, o motor compara cada registro com o baseline do próprio tripulante e mostra alertas, ou “Não avaliado” quando faltam dados.',
          })}
        </li>
      </ol>
      <form className="form setup__form" onSubmit={submit} noValidate>
        <label className="field">
          <span>
            {t({ en: 'Mission name', pt: 'Nome da missão' })} <span className="muted small">{t({ en: '(optional)', pt: '(opcional)' })}</span>
          </span>
          <input value={mission} onChange={(e) => setMission(e.target.value)} maxLength={MISSION_NAME_MAX} />
        </label>
        <MemberFields
          idBase={id}
          name={name}
          role={role}
          error={error}
          onName={(v) => {
            setName(v);
            if (error) setError(null);
          }}
          onRole={setRole}
        />
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

/** Crew roster: list, switch, add and remove crew members. */
export function CrewPanel({
  crew,
  entriesOf,
  onSelect,
  onAdd,
  onRemove,
  onClose,
}: {
  crew: Crew;
  entriesOf: (astronautId: string) => number;
  onSelect: (astronautId: string) => void;
  onAdd: (name: string, role: CrewRole) => void;
  onRemove: (astronautId: string) => void;
  onClose: () => void;
}) {
  const t = useT();
  const id = useId();
  const [name, setName] = useState('');
  const [role, setRole] = useState<CrewRole>('mission-specialist');
  const [error, setError] = useState<L10n | null>(null);
  const full = crew.members.length >= CREW_MAX;

  function submit(e: FormEvent) {
    e.preventDefault();
    const err = crewNameError(name, crew);
    setError(err);
    if (err) return;
    onAdd(name, role);
    setName('');
  }

  return (
    <section id="crew-panel" className="panel crew" aria-labelledby={`${id}-title`}>
      <div className="panel__head">
        <h2 id={`${id}-title`}>{t({ en: 'Crew', pt: 'Tripulação' })}</h2>
        <p>
          {t({
            en: 'Each crew member has their own ID, baseline, entries and action log. The engine never mixes data between people.',
            pt: 'Cada tripulante tem a própria identificação, baseline, registros e ações. O motor nunca mistura dados entre pessoas.',
          })}
        </p>
      </div>

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">{t({ en: 'Nickname', pt: 'Apelido' })}</th>
              <th scope="col">{t({ en: 'Role', pt: 'Função' })}</th>
              <th scope="col">ID</th>
              <th scope="col" className="num">
                {t({ en: 'Entries', pt: 'Registros' })}
              </th>
              <th scope="col">
                <span className="visually-hidden">{t({ en: 'Actions', pt: 'Ações' })}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {crew.members.map((m) => {
              const active = m.astronautId === crew.activeId;
              return (
                <tr key={m.astronautId} aria-current={active ? 'true' : undefined}>
                  <th scope="row">
                    {m.name}
                    {active && <span className="crew__active">{t({ en: 'on screen', pt: 'em exibição' })}</span>}
                  </th>
                  <td>{t(CREW_ROLE_LABEL[m.role])}</td>
                  <td className="own-bar__id">{m.astronautId}</td>
                  <td className="num">{entriesOf(m.astronautId)}</td>
                  <td className="crew__row-actions">
                    {!active && (
                      <button type="button" className="btn btn--small" onClick={() => onSelect(m.astronautId)}>
                        {t({ en: 'View', pt: 'Ver' })}
                      </button>
                    )}
                    {crew.members.length > 1 && (
                      <button
                        type="button"
                        className="btn btn--small crew__remove"
                        onClick={() => onRemove(m.astronautId)}
                        aria-label={t({ en: `Remove ${m.name}`, pt: `Remover ${m.name}` })}
                      >
                        {t({ en: 'Remove', pt: 'Remover' })}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {full ? (
        <p className="muted small">
          {t({ en: `The crew is full (${CREW_MAX} members).`, pt: `A tripulação está completa (${CREW_MAX} tripulantes).` })}
        </p>
      ) : (
        <form className="form crew__form" onSubmit={submit} noValidate aria-labelledby={`${id}-add`}>
          <h3 id={`${id}-add`}>{t({ en: 'Add crew member', pt: 'Adicionar tripulante' })}</h3>
          <MemberFields
            idBase={`${id}-new`}
            name={name}
            role={role}
            error={error}
            onName={(v) => {
              setName(v);
              if (error) setError(null);
            }}
            onRole={setRole}
          />
          <div className="setup__buttons">
            <button type="submit" className="btn btn--primary">
              {t({ en: 'Add to crew', pt: 'Adicionar à tripulação' })}
            </button>
            <button type="button" className="btn" onClick={onClose}>
              {t({ en: 'Close', pt: 'Fechar' })}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
