import { useId, useState, type FormEvent } from 'react';
import type { Measurement, VariableId } from '../types/contract';
import { SELF_REPORT_DIMENSIONS } from '../config/display';
import { VARIABLES } from '../config/variables';
import { PLAUSIBLE_RANGES } from '../engine';
import { createMeasurement, createSelfReport } from '../data/createMeasurement';
import { fmt, fmtDateTime } from '../lib/format';
import { useLang, useT, type L10n } from '../i18n';
import { OriginBadge } from './Badges';
import { HowToMeasure } from './HowToMeasure';
import { VariableTerm } from './VariableTerm';

const MANUAL_VARIABLES: VariableId[] = ['restingHeartRate', 'hrv', 'bloodPressure', 'sleep', 'bodyMass', 'exerciseLoad'];

// Store both variants so existing feedback follows the language toggle without
// submitting again, resetting the form or writing the measurement a second time.
function saveError(error: string): L10n {
  const duplicate = error === 'duplicate measurement' || error === 'medição duplicada';
  return {
    en: `Not saved: ${duplicate ? 'duplicate measurement' : error}.`,
    pt: `Não gravado: ${duplicate ? 'medição duplicada' : error}.`,
  };
}

/** ISO -> <input type="datetime-local"> value, in UTC (ISS onboard time). */
function toLocalInput(iso: string): string {
  return iso.slice(0, 16);
}

interface Props {
  astronautId: string;
  /** Mission clock: the day being assessed. New entries default to this instant. */
  nowIso: string;
  entries: Measurement[];
  /** Writes to local storage; returns an error message or null. */
  onAdd: (ms: Measurement[]) => string | null;
  onRemove: (id: string) => void;
}

export function EntryPanel({ astronautId, nowIso, entries, onAdd, onRemove }: Props) {
  const t = useT();
  const [status, setStatus] = useState<L10n | string>('');

  return (
    <div className="stack">
      <p className="note">
        {t({ en: 'Manual entries are marked as', pt: 'Entradas manuais são marcadas como' })} <OriginBadge origin="measured" />
        {t({
          en: ', saved on this device and re-evaluated immediately by the rule engine. They do not depend on a connection to Earth.',
          pt: ', gravadas neste dispositivo e reavaliadas na hora pelo motor de regras. Não dependem de conexão com a Terra.',
        })}
      </p>
      <div className="entry-grid">
        <MeasurementForm astronautId={astronautId} nowIso={nowIso} onAdd={onAdd} announce={setStatus} />
        <SelfReportForm astronautId={astronautId} nowIso={nowIso} onAdd={onAdd} announce={setStatus} />
      </div>
      <p className="sr-status" role="status" aria-live="polite">
        {t(status)}
      </p>
      <section className="panel" aria-labelledby="entries-title">
        <h2 id="entries-title">{t({ en: 'Manual entries', pt: 'Registros manuais' })}</h2>
        {entries.length === 0 ? (
          <p className="muted">{t({ en: 'No manual entries in this scenario.', pt: 'Nenhum registro manual neste cenário.' })}</p>
        ) : (
          <div className="table-scroll">
            <table className="evidence">
              <thead>
                <tr>
                  <th scope="col">{t({ en: 'When', pt: 'Quando' })}</th>
                  <th scope="col">{t({ en: 'Variable', pt: 'Variável' })}</th>
                  <th scope="col" className="num">
                    {t({ en: 'Value', pt: 'Valor' })}
                  </th>
                  <th scope="col">{t({ en: 'Origin', pt: 'Origem' })}</th>
                  <th scope="col">
                    <span className="visually-hidden">{t({ en: 'Actions', pt: 'Ações' })}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...entries].reverse().map((m) => (
                  <tr key={m.id}>
                    <td>{fmtDateTime(m.timestamp)}</td>
                    <td>
                      {t(VARIABLES[m.variable].label)}
                      {m.variable === 'selfReport' &&
                        ` · ${t(SELF_REPORT_DIMENSIONS.find((d) => d.method === m.method)?.label ?? '')}`}
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
                        {t({ en: 'Remove', pt: 'Remover' })}
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
  announce: (s: L10n) => void;
}) {
  const t = useT();
  const { lang } = useLang();
  const uid = useId();
  const [variable, setVariable] = useState<VariableId>('restingHeartRate');
  const [value, setValue] = useState('');
  const [secondary, setSecondary] = useState('');
  const [when, setWhen] = useState(() => toLocalInput(nowIso));
  const [errors, setErrors] = useState<Record<string, L10n>>({});
  const meta = VARIABLES[variable];
  const range = PLAUSIBLE_RANGES[variable];
  const secondaryRequired = range.secondary?.required ?? false;

  function submit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, L10n> = {};
    if (value.trim() === '') errs.value = { en: 'Enter a value.', pt: 'Informe um valor.' };
    if (meta.secondaryLabel && secondaryRequired && secondary.trim() === '') {
      errs.secondary = {
        en: `Enter ${meta.secondaryLabel.en.toLowerCase()}.`,
        pt: `Informe ${meta.secondaryLabel.pt.toLowerCase()}.`,
      };
    }
    const ts = when ? new Date(`${when}:00Z`) : null;
    if (!ts || Number.isNaN(ts.getTime())) errs.when = { en: 'Enter date and time.', pt: 'Informe data e hora.' };

    if (!Object.keys(errs).length && ts) {
      // Range, unit and consistency validation: single engine rule (Bloco A).
      const r = createMeasurement(
        {
          astronautId,
          variable,
          value,
          secondaryValue: meta.secondaryLabel ? secondary : undefined,
          timestamp: ts.toISOString(),
          origin: 'measured',
        },
        lang,
      );
      if (!r.ok) {
        const validationError = (locale: 'en' | 'pt') => {
          const result = createMeasurement({ astronautId, variable, value,
            secondaryValue: meta.secondaryLabel ? secondary : undefined,
            timestamp: ts.toISOString(), origin: 'measured' }, locale);
          return result.ok ? '' : result.error;
        };
        errs.value = {
          en: `${validationError('en')} Plausible range: ${range.min}–${range.max} ${meta.unit}.`,
          pt: `${validationError('pt')} Faixa plausível: ${range.min}–${range.max} ${meta.unit}.`,
        };
      } else {
        const storeError = onAdd([r.measurement]);
        if (storeError) errs.when = saveError(storeError);
        else {
          const number = (locale: string) => r.measurement.value.toLocaleString(locale, {
            minimumFractionDigits: meta.decimals, maximumFractionDigits: meta.decimals,
          });
          announce({
            en: `Logged: ${meta.label.en} ${number('en-US')} ${meta.unit}. Status re-evaluated.`,
            pt: `Registrado: ${meta.label.pt} ${number('pt-BR')} ${meta.unit}. Estado reavaliado.`,
          });
          setValue('');
          setSecondary('');
        }
      }
    }
    setErrors(errs);
    if (Object.keys(errs).length)
      announce({ en: 'Entry not saved: fix the highlighted fields.', pt: 'Registro não salvo: corrija os campos indicados.' });
  }

  const err = (k: string) =>
    errors[k] ? (
      <span id={`${uid}-${k}-err`} className="field-error">
        {t(errors[k])}
      </span>
    ) : null;

  return (
    <form className="panel form" onSubmit={submit} noValidate aria-labelledby={`${uid}-title`}>
      <h2 id={`${uid}-title`}>{t({ en: 'Log a measurement', pt: 'Registrar medição' })}</h2>
      <label className="field">
        <span>{t({ en: 'Variable', pt: 'Variável' })}</span>
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
              {t(VARIABLES[id].label)}
            </option>
          ))}
        </select>
      </label>
      <HowToMeasure variable={variable} compact />
      <div className="field-row">
        <label className="field">
          <span>
            {variable === 'bloodPressure'
              ? t({ en: 'Systolic', pt: 'Sistólica' })
              : variable === 'exerciseLoad'
                ? t({ en: 'Completed', pt: 'Completado' })
                : t({ en: 'Value', pt: 'Valor' })}{' '}
            ({meta.unit})
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
              {t(meta.secondaryLabel)}
              {meta.secondaryUnit && meta.secondaryUnit !== '/5' ? ` (${meta.secondaryUnit})` : ''}
              {!secondaryRequired && t({ en: ' — optional', pt: ' — opcional' })}
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
        <span>{t({ en: 'Date and time of collection (UTC, onboard time)', pt: 'Data e hora da coleta (UTC, horário de bordo)' })}</span>
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
        {t({ en: 'Log measurement', pt: 'Registrar medição' })}
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
  announce: (s: L10n) => void;
}) {
  const t = useT();
  const { lang } = useLang();
  const uid = useId();
  const [values, setValues] = useState<Record<string, number | undefined>>({});
  const [error, setError] = useState<L10n | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    const missing = SELF_REPORT_DIMENSIONS.filter((d) => values[d.method] == null);
    if (missing.length) {
      setError({
        en: `Please answer: ${missing.map(d => d.label.en.toLowerCase()).join(', ')}.`,
        pt: `Responda: ${missing.map(d => d.label.pt.toLowerCase()).join(', ')}.`,
      });
      announce({ en: 'Self-report not saved: answers missing.', pt: 'Autorrelato não salvo: faltam respostas.' });
      return;
    }
    const r = createSelfReport(
      astronautId,
      nowIso,
      {
        mood: values['self-report:mood'] as number,
        stress: values['self-report:stress'] as number,
        fatigue: values['self-report:fatigue'] as number,
      },
      lang,
    );
    const storeError = r.ok ? onAdd(r.measurements) : r.error;
    if (storeError) {
      setError(saveError(storeError));
      announce({ en: 'Self-report not saved.', pt: 'Autorrelato não salvo.' });
      return;
    }
    setError(null);
    announce({ en: 'Self-report logged. Status re-evaluated.', pt: 'Autorrelato registrado. Estado reavaliado.' });
    setValues({});
  }

  return (
    <form className="panel form" onSubmit={submit} noValidate aria-labelledby={`${uid}-title`}>
      <h2 id={`${uid}-title`}>{t({ en: 'Today’s self-report', pt: 'Autorrelato de hoje' })}</h2>
      <p className="muted small">
        <VariableTerm variable="selfReport" />{' '}
        {t({ en: '— how are you right now? Scale of 1 to 5.', pt: '— como você está agora? Escala de 1 a 5.' })}
      </p>
      <HowToMeasure variable="selfReport" compact />
      {SELF_REPORT_DIMENSIONS.map((d) => (
        <fieldset key={d.method} className="scale">
          <legend>{t(d.label)}</legend>
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
            <span>1 = {t(d.low)}</span>
            <span>5 = {t(d.high)}</span>
          </div>
        </fieldset>
      ))}
      {error && <span className="field-error">{t(error)}</span>}
      <button type="submit" className="btn btn--primary">
        {t({ en: 'Log self-report', pt: 'Registrar autorrelato' })}
      </button>
    </form>
  );
}
