import { useId, useState, type FormEvent } from 'react';
import { BASELINE } from '../engine';
import type { OwnProfile } from '../lib/ownMission';
import { OriginBadge } from './Badges';

/** Barra do modo "Minha missão": quem é, como está o baseline e a saída para a demonstração. */
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
    <section className="demo-bar own-bar" aria-label="Minha missão">
      <span className="demo-bar__label">Minha missão</span>
      <strong>{profile.name}</strong>
      <span className="own-bar__id">{profile.astronautId}</span>
      <OriginBadge origin="measured" />
      <span className="own-bar__baseline">
        {inFlight
          ? `Baseline formado com ${Math.min(preflightDaysLogged, total)} de ${total} dias de pré-voo`
          : `Pré-voo: ${preflightDaysLogged} de ${total} dias registrados — o baseline se forma ao fim do pré-voo`}
      </span>
      <div className="own-bar__actions">
        <button type="button" className="console-btn" onClick={onDemo}>
          Ir para a demonstração
        </button>
        <button type="button" className="console-btn console-btn--danger" onClick={onErase}>
          Apagar meus dados
        </button>
      </div>
    </section>
  );
}

/** Criação da missão própria: só um apelido; dados pessoais não são pedidos nem guardados. */
export function OwnMissionSetup({ onCreate, onDemo }: { onCreate: (name: string) => void; onDemo: () => void }) {
  const id = useId();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError('Escreva um apelido com pelo menos 2 letras.');
      return;
    }
    onCreate(name);
  }

  return (
    <section className="panel setup" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>Criar minha missão</h2>
      <p>
        Use o Vigília com os seus próprios registros, separados da demonstração. Funciona sem internet e os dados ficam só
        neste dispositivo.
      </p>
      <ol className="setup__steps">
        <li>
          <strong>Pré-voo, {BASELINE.preflightDays} dias.</strong> Registre as medições todos os dias. Elas formam o seu
          baseline individual; nada é avaliado ainda.
        </li>
        <li>
          <strong>Em voo.</strong> A partir do dia 1, o motor compara cada registro com o seu baseline e mostra alertas,
          ou “Não avaliado” quando faltam dados.
        </li>
        <li>
          <strong>Acompanhe.</strong> Registre o que fez com cada orientação e veja a evolução na trilha da missão.
        </li>
      </ol>
      <form className="form setup__form" onSubmit={submit} noValidate>
        <label className="field">
          <span>Apelido ou identificação fictícia</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            aria-invalid={!!error}
            aria-describedby={`${id}-hint${error ? ` ${id}-err` : ''}`}
          />
          <span id={`${id}-hint`} className="muted small">
            Não use nome completo nem dados pessoais.
          </span>
          {error && (
            <span id={`${id}-err`} className="field-error">
              {error}
            </span>
          )}
        </label>
        <div className="setup__buttons">
          <button type="submit" className="btn btn--primary">
            Criar e começar o pré-voo
          </button>
          <button type="button" className="btn" onClick={onDemo}>
            Voltar à demonstração
          </button>
        </div>
      </form>
    </section>
  );
}
