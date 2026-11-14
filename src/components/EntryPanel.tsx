import { useId, useState, type FormEvent } from 'react';
import type { Measurement, VariableId } from '../types/contract';
import { SELF_REPORT_DIMENSIONS } from '../config/display';
import { VARIABLES } from '../config/variables';
import { PLAUSIBLE_RANGES } from '../engine';
import { createMeasurement, createSelfReport } from '../data/createMeasurement';
import { fmt, fmtDateTime } from '../lib/format';
import { OriginBadge } from './Badges';
import { VariableTerm } from './VariableTerm';

const MANUAL_VARIABLES: VariableId[] = ['restingHeartRate', 'hrv', 'bloodPressure', 'sleep', 'bodyMass', 'exerciseLoad'];

/** ISO -> valor de <input type="datetime-local">, em UTC (horário de bordo da ISS). */
function toLocalInput(iso: string): string {
  return iso.slice(0, 16);
}

interface Props {
  astronautId: string;
  /** Relógio da missão: dia sendo avaliado. Novos registros entram nesse instante por padrão. */
  nowIso: string;
  entries: Measurement[];
  /** Grava no armazenamento local; devolve mensagem de erro ou null. */
  onAdd: (ms: Measurement[]) => string | null;
  onRemove: (id: string) => void;
}

export function EntryPanel({ astronautId, nowIso, entries, onAdd, onRemove }: Props) {
  const [status, setStatus] = useState('');

  return (
    <div className="stack">
      <p className="note">
        Entradas manuais são marcadas como <OriginBadge origin="measured" />, gravadas neste dispositivo e reavaliadas na hora
        pelo motor de regras. Não dependem de conexão com a Terra.
      </p>
      <div className="entry-grid">
        <MeasurementForm astronautId={astronautId} nowIso={nowIso} onAdd={onAdd} announce={setStatus} />
        <SelfReportForm astronautId={astronautId} nowIso={nowIso} onAdd={onAdd} announce={setStatus} />
      </div>
      <p className="sr-status" role="status" aria-live="polite">
        {status}
      </p>
      <section className="panel" aria-labelledby="entries-title">
        <h2 id="entries-title">Registros manuais</h2>
        {entries.length === 0 ? (
          <p className="muted">Nenhum registro manual neste cenário.</p>
        ) : (
          <div className="table-scroll">
            <table className="evidence">
              <thead>
                <tr>
                  <th scope="col">Quando</th>
                  <th scope="col">Variável</th>
                  <th scope="col" className="num">
                    Valor
                  </th>
                  <th scope="col">Origem</th>
                  <th scope="col">
                    <span className="visually-hidden">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...entries].reverse().map((m) => (
                  <tr key={m.id}>
                    <td>{fmtDateTime(m.timestamp)}</td>
                    <td>
                      {VARIABLES[m.variable].label}
                      {m.variable === 'selfReport' && ` · ${SELF_REPORT_DIMENSIONS.find((d) => d.method === m.method)?.label ?? ''}`}
                    </td>
                    <td className="num">
                      {fmt(m.value, VARIABLES[m.variable].decimals)}
                      {m.secondaryValue != null && ` / ${fmt(m.secondaryValue, 0)}`} {m.unit === 'score 1-5' ? '/5' : m.unit}
                    </td>
                    <td>
                      <OriginBadge origin={m.origin} />
                    </td>
                    <td>
                      <button type="button" className="btn btn--small" onClick={() => onRemove(m.id)}>
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function MeasurementForm({
  astronautId,
  nowIso,
  onAdd,
  announce,
}: {
  astronautId: string;
  nowIso: string;
  onAdd: (ms: Measurement[]) => string | null;
  announce: (s: string) => void;
}) {
  const uid = useId();
  const [variable, setVariable] = useState<VariableId>('restingHeartRate');
  const [value, setValue] = useState('');
  const [secondary, setSecondary] = useState('');
  const [when, setWhen] = useState(() => toLocalInput(nowIso));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const meta = VARIABLES[variable];
  const range = PLAUSIBLE_RANGES[variable];
  const secondaryRequired = range.secondary?.required ?? false;

  function submit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (value.trim() === '') errs.value = 'Informe um valor.';
    if (meta.secondaryLabel && secondaryRequired && secondary.trim() === '')
      errs.secondary = `Informe ${meta.secondaryLabel.toLowerCase()}.`;
    const ts = when ? new Date(`${when}:00Z`) : null;
    if (!ts || Number.isNaN(ts.getTime())) errs.when = 'Informe data e hora.';

    if (!Object.keys(errs).length && ts) {
      // Validação de faixa, unidade e coerência: regra única do motor (Bloco A).
      const r = createMeasurement({
        astronautId,
        variable,
        value,
        secondaryValue: meta.secondaryLabel ? secondary : undefined,
        timestamp: ts.toISOString(),
        origin: 'measured',
      });
      if (!r.ok) {
        errs.value = `${r.error} Faixa plausível: ${range.min}–${range.max} ${meta.unit}.`;
      } else {
        const storeError = onAdd([r.measurement]);
        if (storeError) errs.when = `Não gravado: ${storeError}.`;
        else {
          announce(`Registrado: ${meta.label} ${fmt(r.measurement.value, meta.decimals)} ${meta.unit}. Estado reavaliado.`);
          setValue('');
          setSecondary('');
        }
      }
    }
    setErrors(errs);
    if (Object.keys(errs).length) announce('Registro não salvo: corrija os campos indicados.');
  }

  const err = (k: string) =>
    errors[k] ? (
      <span id={`${uid}-${k}-err`} className="field-error">
        {errors[k]}
      </span>
    ) : null;

  return (
    <form className="panel form" onSubmit={submit} noValidate aria-labelledby={`${uid}-title`}>
      <h2 id={`${uid}-title`}>Registrar medição</h2>
      <label className="field">
        <span>Variável</span>
        <select
          value={variable}
          onChange={(e) => {
            setVariable(e.target.value as VariableId);
            setErrors({});
            setSecondary('');
          }}
        >
          {MANUAL_VARIABLES.map((id) => (
            <option key={id} value={id}>
              {VARIABLES[id].label}
            </option>
          ))}
        </select>
      </label>
      <p className="muted small field-hint">
        <VariableTerm variable={variable} /> — {meta.whatItMeasures}
      </p>
      <div className="field-row">
        <label className="field">
          <span>
            {variable === 'bloodPressure' ? 'Sistólica' : variable === 'exerciseLoad' ? 'Completado' : 'Valor'} ({meta.unit})
          </span>
          <input
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-invalid={!!errors.value}
            aria-describedby={errors.value ? `${uid}-value-err` : undefined}
          />
          {err('value')}
        </label>
        {meta.secondaryLabel && (
          <label className="field">
            <span>
              {meta.secondaryLabel}
              {meta.secondaryUnit && meta.secondaryUnit !== '/5' ? ` (${meta.secondaryUnit})` : ''}
              {!secondaryRequired && ' — opcional'}
            </span>
            <input
              inputMode="decimal"
              value={secondary}
              onChange={(e) => setSecondary(e.target.value)}
              aria-invalid={!!errors.secondary}
              aria-describedby={errors.secondary ? `${uid}-secondary-err` : undefined}
            />
            {err('secondary')}
          </label>
        )}
      </div>
      <label className="field">
        <span>Data e hora da coleta (UTC, horário de bordo)</span>
        <input
          type="datetime-local"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
          aria-invalid={!!errors.when}
          aria-describedby={errors.when ? `${uid}-when-err` : undefined}
        />
        {err('when')}
      </label>
      <button type="submit" className="btn btn--primary">
        Registrar medição
      </button>
    </form>
  );
}

function SelfReportForm({
  astronautId,
  nowIso,
  onAdd,
  announce,
}: {
  astronautId: string;
  nowIso: string;
  onAdd: (ms: Measurement[]) => string | null;
  announce: (s: string) => void;
}) {
  const uid = useId();
  const [values, setValues] = useState<Record<string, number | undefined>>({});
  const [error, setError] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    const missing = SELF_REPORT_DIMENSIONS.filter((d) => values[d.method] == null).map((d) => d.label.toLowerCase());
    if (missing.length) {
      setError(`Responda: ${missing.join(', ')}.`);
      announce('Autorrelato não salvo: faltam respostas.');
      return;
    }
    const r = createSelfReport(astronautId, nowIso, {
      mood: values['self-report:mood'] as number,
      stress: values['self-report:stress'] as number,
      fatigue: values['self-report:fatigue'] as number,
    });
    const storeError = r.ok ? onAdd(r.measurements) : r.error;
    if (storeError) {
      setError(`Não gravado: ${storeError}.`);
      announce('Autorrelato não salvo.');
      return;
    }
    setError('');
    announce('Autorrelato registrado. Estado reavaliado.');
    setValues({});
  }

  return (
    <form className="panel form" onSubmit={submit} noValidate aria-labelledby={`${uid}-title`}>
      <h2 id={`${uid}-title`}>Autorrelato de hoje</h2>
      <p className="muted small">
        <VariableTerm variable="selfReport" /> — como você está agora? Escala de 1 a 5.
      </p>
      {SELF_REPORT_DIMENSIONS.map((d) => (
        <fieldset key={d.method} className="scale">
          <legend>{d.label}</legend>
          <div className="scale__options">
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="scale__opt">
                <input
                  type="radio"
                  name={`${uid}-${d.method}`}
                  value={n}
                  checked={values[d.method] === n}
                  onChange={() => setValues((prev) => ({ ...prev, [d.method]: n }))}
                />
                <span>{n}</span>
              </label>
            ))}
          </div>
          <div className="scale__ends small muted">
            <span>1 = {d.low}</span>
            <span>5 = {d.high}</span>
          </div>
        </fieldset>
      ))}
      {error && <span className="field-error">{error}</span>}
      <button type="submit" className="btn btn--primary">
        Registrar autorrelato
      </button>
    </form>
  );
}
