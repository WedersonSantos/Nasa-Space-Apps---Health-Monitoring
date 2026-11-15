import { useEffect, useRef, useState } from 'react';
import type { AstronautState } from '../types/contract';
import { SEVERITY_META } from '../config/display';
import { useOnline, type Theme } from '../lib/theme';
import { LANG_LABEL, useLang, useT, type Lang, type L10n } from '../i18n';
import { fmtDate } from '../lib/format';
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
  /** Crew member name already localized by the caller. */
  crewName: string;
}

function gmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC' });
}

/** EN | PT switch: the site starts in English; Portuguese on demand. */
function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="lang-toggle" role="group" aria-label="Language / Idioma">
      {(['en', 'pt'] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          lang={l === 'pt' ? 'pt-BR' : 'en'}
          aria-pressed={lang === l}
          aria-label={LANG_LABEL[l].name}
          title={LANG_LABEL[l].name}
          onClick={() => setLang(l)}
        >
          {LANG_LABEL[l].code}
        </button>
      ))}
    </div>
  );
}

/** Mission bar: identity, mission clock, crew member, link with Earth, language, theme and the overall-status annunciator. */
export function MissionBar({ state, asOf, missionDay, theme, onToggleTheme, onShowAlerts, crewName }: Props) {
  const t = useT();
  const online = useOnline();
  const date = fmtDate(asOf);
  const time = gmtTime(asOf);
  const count = state.alerts.length;
  const sevLabel = t(SEVERITY_META[state.overall].label);
  const { unassessed: partial, none } = assessmentSummary(state);
  const pfDay = missionDay + BASELINE.preflightDays;
  const total = BASELINE.preflightDays;

  // Announces to screen readers only when the overall status changes (not on every track day).
  const [announcement, setAnnouncement] = useState<L10n | string>('');
  const prev = useRef(state.overall);
  useEffect(() => {
    if (prev.current !== state.overall) {
      setAnnouncement(
        {
          en: `Overall status changed to ${SEVERITY_META[state.overall].label.en}. ${count} active alert${count === 1 ? '' : 's'}.`,
          pt: `Estado geral mudou para ${SEVERITY_META[state.overall].label.pt}. ${count} alerta${count === 1 ? '' : 's'} ativo${count === 1 ? '' : 's'}.`,
        },
      );
      prev.current = state.overall;
    }
  }, [state.overall, sevLabel, count, t]);

  const plural = count > 1;

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

        <div
          className="met"
          aria-label={
            missionDay >= 1
              ? t({ en: `Mission day ${missionDay}, ${date} at ${time} GMT`, pt: `Dia de missão ${missionDay}, ${date} às ${time} GMT` })
              : t({ en: `Pre-flight, day ${pfDay} of ${total}, ${date} at ${time} GMT`, pt: `Pré-voo, dia ${pfDay} de ${total}, ${date} às ${time} GMT` })
          }
        >
          <span className="met__day">{missionDay >= 1 ? `D+${missionDay}` : `${t({ en: 'PF', pt: 'PV' })} ${pfDay}/${total}`}</span>
          <span className="met__clock">
            {date} · {time}{' '}
            <abbr title={t({ en: 'Greenwich Mean Time, ISS onboard time', pt: 'Greenwich Mean Time, horário de bordo da ISS' })}>GMT</abbr>
          </span>
        </div>

        <dl className="crew">
          <div>
            <dt>{t({ en: 'Crew member', pt: 'Tripulante' })}</dt>
            <dd>{crewName}</dd>
          </div>
          <div>
            <dt>{t({ en: 'Link with Earth', pt: 'Link com a Terra' })}</dt>
            <dd
              className="crew__link"
              title={t({
                en: 'The app runs entirely on this device. Having no link is an expected state, not an error.',
                pt: 'O app roda inteiro neste dispositivo. Ficar sem link é um estado esperado, não um erro.',
              })}
            >
              <Satellite size={15} />
              {online ? t({ en: 'Available', pt: 'Disponível' }) : t({ en: 'No link · local operation', pt: 'Sem link · operação local' })}
            </dd>
          </div>
        </dl>

        <div className="bar-controls">
          <LangToggle />
          <button
            type="button"
            className="shell-btn shell-btn--theme"
            onClick={onToggleTheme}
            aria-pressed={theme === 'dark'}
            aria-label={theme === 'dark' ? t({ en: 'Use day mode', pt: 'Usar modo dia' }) : t({ en: 'Use night mode', pt: 'Usar modo noturno' })}
            title={
              theme === 'dark'
                ? t({ en: 'Back to day mode', pt: 'Voltar ao modo dia' })
                : t({ en: 'Night mode: dark, soft tones for low light', pt: 'Modo noturno: tons escuros e suaves para pouca luz' })
            }
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            <span className="shell-btn__text">
              {theme === 'dark' ? t({ en: 'Day mode', pt: 'Modo dia' }) : t({ en: 'Night mode', pt: 'Modo noturno' })}
            </span>
          </button>
        </div>

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
              <span className="annunciator__label">{sevLabel}</span>
              <span className="annunciator__sub">
                {t({
                  en: `${count} active alert${plural ? 's' : ''}${partial.length ? ` · ${partial.length} not assessed` : ''} · see what to do`,
                  pt: `${count} alerta${plural ? 's' : ''} ativo${plural ? 's' : ''}${partial.length ? ` · ${partial.length} não avaliado${partial.length > 1 ? 's' : ''}` : ''} · ver o que fazer`,
                })}
              </span>
            </div>
          </a>
        ) : (
          <div className={`annunciator annunciator--${partial.length ? 'unassessed' : state.overall}`} key={partial.length ? 'p' : state.overall}>
            {partial.length ? <StatusIcon status="unassessed" size={26} /> : <SeverityIcon severity={state.overall} size={26} />}
            <div>
              <span className="annunciator__label">
                {none
                  ? t({ en: 'No data', pt: 'Sem dados' })
                  : partial.length
                    ? t({ en: 'Partial assessment', pt: 'Avaliação parcial' })
                    : sevLabel}
              </span>
              <span className="annunciator__sub">
                {none
                  ? t({ en: 'No signal could be assessed', pt: 'Nenhum sinal pôde ser avaliado' })
                  : partial.length
                    ? t({
                        en: `No alerts · ${partial.length} of 7 signals not assessed`,
                        pt: `Sem alertas · ${partial.length} de 7 sinais não avaliados`,
                      })
                    : t({ en: 'No active alerts', pt: 'Nenhum alerta ativo' })}
              </span>
            </div>
          </div>
        )}
      </div>
      <p className="visually-hidden" role="status" aria-live="polite">
        {t(announcement)}
      </p>
    </header>
  );
}
