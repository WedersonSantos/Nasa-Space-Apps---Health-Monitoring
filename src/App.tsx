import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { Alert, Measurement, VariableId } from './types/contract';
import { SEVERITY_META } from './config/display';
import { CLASS_ROLE, VARIABLES } from './config/variables';
import { BASELINE, DISCLAIMER_BY_LOCALE } from './engine';
import {
  SCENARIOS,
  endOfMissionDay,
  evaluateState,
  initialScenarioId,
  missionDayOf,
  scenarioFile,
  store,
  type MissionContext,
  type ScenarioId,
} from './integration/dataSource';
import { useActionLog, type ActionKind } from './lib/actionLog';
import { assessmentSummary, coverageOf } from './lib/coverage';
import { computeMissionHistory } from './lib/missionHistory';
import {
  createOwnProfile,
  loadMode,
  loadOwnProfile,
  ownLaunchDate,
  saveMode,
  saveOwnProfile,
  type AppMode,
  type OwnProfile,
} from './lib/ownMission';
import { ChartColorsContext, readChartColors, useTheme, type ChartColors } from './lib/theme';
import { AboutPanel, LICENSE_URL, REPO_URL } from './components/AboutPanel';
import { ActionFollowUp } from './components/ActionFollowUp';
import { ActionsLogPanel } from './components/ActionsLogPanel';
import { AlertCard } from './components/AlertCard';
import { ClassChip } from './components/Badges';
import { CountermeasurePanel } from './components/CountermeasurePanel';
import { DemoBar } from './components/DemoBar';
import { EntryPanel } from './components/EntryPanel';
import { CheckCircle, SeverityIcon, StatusIcon } from './components/Icons';
import { IndicatorCard } from './components/IndicatorCard';
import { MissionBar } from './components/MissionBar';
import { MissionTrack, type ChartWindow } from './components/MissionTrack';
import { OwnMissionBar, OwnMissionSetup } from './components/OwnMission';
import { VitalsStrip } from './components/VitalsStrip';
import { useLang, useT, type L10n } from './i18n';

type Tab = 'overview' | 'countermeasure' | 'entry' | 'about';

const TABS: { id: Tab; label: L10n }[] = [
  { id: 'overview', label: { en: 'Overview', pt: 'Visão geral' } },
  { id: 'countermeasure', label: { en: 'Countermeasure', pt: 'Contramedida' } },
  { id: 'entry', label: { en: 'Log data', pt: 'Registrar' } },
  { id: 'about', label: { en: 'About & sources', pt: 'Sobre e fontes' } },
];

/** The three fast signals read together by the composite rule: stacked on the same time axis. */
const FAST_CLUSTER: VariableId[] = ['sleep', 'hrv', 'restingHeartRate'];
const SLOW_SIGNALS: VariableId[] = ['bloodPressure', 'selfReport'];

/** "6 weeks" chart window (visual only). */
const RECENT_WINDOW_DAYS = 42;
/** The own-mission clock follows the real clock; it updates every minute. */
const CLOCK_TICK_MS = 60_000;

const nowIso = () => new Date().toISOString();

export default function App() {
  const [theme, setTheme] = useTheme();
  const { lang } = useLang();
  const t = useT();
  const [colors, setColors] = useState<ChartColors | null>(null);

  // ---------- mode: demo or own mission ----------
  const [mode, setModeState] = useState<AppMode>(loadMode);
  const [ownProfile, setOwnProfile] = useState<OwnProfile | null>(loadOwnProfile);
  const setMode = useCallback((m: AppMode) => {
    saveMode(m);
    setModeState(m);
  }, []);

  const [scenarioId, setScenarioId] = useState<ScenarioId>(initialScenarioId);
  const [demoMeasurements, setDemoMeasurements] = useState<Measurement[]>(() =>
    store.loadOrSeed(scenarioFile(initialScenarioId()), nowIso()),
  );
  const [ownMeasurements, setOwnMeasurements] = useState<Measurement[]>(() => {
    const p = loadOwnProfile();
    return p ? (store.load(p.astronautId) ?? []) : [];
  });
  const [clock, setClock] = useState(nowIso);

  const isOwn = mode === 'own';
  const measurements = isOwn ? ownMeasurements : demoMeasurements;
  const setMeasurements = isOwn ? setOwnMeasurements : setDemoMeasurements;

  useEffect(() => {
    if (!isOwn) return;
    const timer = window.setInterval(() => setClock(nowIso()), CLOCK_TICK_MS);
    return () => window.clearInterval(timer);
  }, [isOwn]);

  const scenario = useMemo(() => scenarioFile(scenarioId), [scenarioId]);
  const mission: MissionContext = useMemo(
    () =>
      isOwn && ownProfile
        ? { profile: { astronautId: ownProfile.astronautId, name: ownProfile.name }, launchDate: ownLaunchDate(ownMeasurements, clock) }
        : scenario,
    [isOwn, ownProfile, ownMeasurements, clock, scenario],
  );
  const launch = mission.launchDate;
  const astronautId = mission.profile.astronautId;
  const clockIso = isOwn ? clock : scenario.asOf;

  const [selectedDay, setSelectedDay] = useState<number | null>(null); // null = most recent
  const [tab, setTab] = useState<Tab>(() => (loadMode() === 'own' ? 'entry' : 'overview'));
  const [chartWindow, setChartWindow] = useState<ChartWindow>('recent');
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ overview: null, countermeasure: null, entry: null, about: null });

  const entries = useMemo(() => measurements.filter((m) => m.origin !== 'synthetic'), [measurements]);
  const actionLog = useActionLog(astronautId);

  useEffect(() => {
    setColors(readChartColors());
  }, [theme]);

  const switchScenario = useCallback(
    (id: ScenarioId) => {
      if (id === scenarioId) return;
      const manual = demoMeasurements.filter((m) => m.origin !== 'synthetic').length;
      if (
        (manual > 0 || actionLog.entries.length > 0) &&
        !window.confirm(
          t({
            en: 'Switching scenario erases the manual entries and logged actions in the demo. Continue?',
            pt: 'Trocar de cenário apaga os registros manuais e as ações registradas na demonstração. Continuar?',
          }),
        )
      )
        return;
      setDemoMeasurements(store.reset(scenarioFile(id), nowIso()));
      actionLog.clear();
      setScenarioId(id);
      setSelectedDay(null);
    },
    [scenarioId, demoMeasurements, actionLog, t],
  );

  const goOwn = useCallback(() => {
    setMode('own');
    setSelectedDay(null);
    setClock(nowIso());
    setTab(ownProfile && ownMeasurements.length ? 'overview' : 'entry');
  }, [setMode, ownProfile, ownMeasurements.length]);
  const goDemo = useCallback(() => {
    setMode('demo');
    setSelectedDay(null);
    setTab('overview');
  }, [setMode]);
  const createOwn = useCallback(
    (name: string) => {
      const p = createOwnProfile(name, nowIso());
      saveOwnProfile(p);
      setOwnProfile(p);
      setOwnMeasurements(store.load(p.astronautId) ?? []);
      setTab('entry');
    },
    [],
  );
  const eraseOwn = useCallback(() => {
    if (!ownProfile) return;
    const msg = t({
      en: `Erase ${ownProfile.name}’s mission and all entries and actions on this device? This cannot be undone.`,
      pt: `Apagar a missão de ${ownProfile.name} e todos os registros e ações deste dispositivo? Não dá para desfazer.`,
    });
    if (!window.confirm(msg)) return;
    store.clear(ownProfile.astronautId, nowIso());
    actionLog.clear();
    saveOwnProfile(null);
    setOwnProfile(null);
    setOwnMeasurements([]);
  }, [ownProfile, actionLog, t]);

  // ---------- mission clock ----------
  const maxDay = useMemo(() => {
    let last = missionDayOf(clockIso, launch);
    for (const m of measurements) last = Math.max(last, missionDayOf(m.timestamp, launch));
    return last;
  }, [measurements, clockIso, launch]);
  const inFlight = maxDay >= 1;
  const minDay = inFlight ? 1 : maxDay;
  const day = selectedDay == null ? maxDay : Math.min(Math.max(minDay, selectedDay), maxDay);
  const asOf = endOfMissionDay(day, launch);
  const goToDay = useCallback((d: number) => setSelectedDay(d), []);
  /** Default time for a new entry: the end of the assessed day, never later than now. */
  const entryNow = isOwn && asOf > clock ? clock : asOf;
  /** "day 113" in flight; "pre-flight day 2 of 7" before launch. */
  const dayText = inFlight
    ? t({ en: `day ${day}`, pt: `dia ${day}` })
    : t({
        en: `pre-flight day ${day + BASELINE.preflightDays} of ${BASELINE.preflightDays}`,
        pt: `dia ${day + BASELINE.preflightDays} de ${BASELINE.preflightDays} do pré-voo`,
      });

  // Shortcuts: 1/2/3 switch scenario (demo only); ← → move one day.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.ctrlKey || e.metaKey || e.altKey || target.closest('input, select, textarea, button, [role=tab], [role=tooltip]')) return;
      const s = SCENARIOS.find((x) => String(x.number) === e.key);
      if (s && !isOwn) switchScenario(s.id);
      if (e.key === 'ArrowLeft') setSelectedDay(Math.max(minDay, day - 1));
      if (e.key === 'ArrowRight') setSelectedDay(Math.min(maxDay, day + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [switchScenario, day, minDay, maxDay, isOwn]);

  // ---------- evaluation (pure engine function) ----------
  const state = useMemo(() => evaluateState(measurements, mission, asOf, lang), [measurements, mission, asOf, lang]);
  const deferredMeasurements = useDeferredValue(measurements);
  const history = useMemo(
    () => computeMissionHistory(deferredMeasurements, mission, maxDay, lang),
    [deferredMeasurements, mission, maxDay, lang],
  );
  const visible = useMemo(() => measurements.filter((m) => m.timestamp <= asOf), [measurements, asOf]);
  const alerts = useMemo(
    () =>
      [...state.alerts].sort(
        (a, b) =>
          SEVERITY_META[b.severity].rank - SEVERITY_META[a.severity].rank ||
          b.variables.length - a.variables.length ||
          b.raisedAt.localeCompare(a.raisedAt),
      ),
    [state.alerts],
  );
  const assessment = useMemo(() => assessmentSummary(state), [state]);
  const missionDayOfAlert = useCallback((a: Alert) => missionDayOf(a.raisedAt, launch), [launch]);
  const fromDay = chartWindow === 'recent' ? day - RECENT_WINDOW_DAYS + 1 : null;
  const preflightDaysLogged = useMemo(() => {
    const days = new Set(measurements.map((m) => missionDayOf(m.timestamp, launch)).filter((d) => d <= 0));
    return days.size;
  }, [measurements, launch]);

  // ---------- action follow-up ----------
  const logAction = useCallback(
    (alert: Alert, kind: ActionKind) => actionLog.add({ alertId: alert.id, alertTitle: alert.title, kind, at: entryNow, missionDay: day }),
    [actionLog, entryNow, day],
  );
  const followUp = (a: Alert) => (
    <ActionFollowUp alert={a} entries={actionLog.entries} onLog={(k) => logAction(a, k)} onRemove={actionLog.remove} />
  );

  // ---------- manual entries (persisted on the device) ----------
  const addEntries = useCallback(
    (ms: Measurement[]): string | null => {
      let latest: Measurement[] | null = null;
      for (const m of ms) {
        const r = store.append(m, nowIso(), lang);
        if (!r.ok) return r.error;
        latest = r.measurements;
      }
      if (latest) setMeasurements(latest);
      if (isOwn) setClock(nowIso());
      return null;
    },
    [setMeasurements, isOwn, lang],
  );
  const removeEntry = useCallback(
    (id: string) => {
      setMeasurements((prev) => {
        const next = prev.filter((m) => m.id !== id);
        store.save(astronautId, next);
        return next;
      });
    },
    [astronautId, setMeasurements],
  );

  // Annunciator -> action of the most severe alert, in the Overview.
  const [focusAction, setFocusAction] = useState(0);
  const showAlerts = useCallback(() => {
    setTab('overview');
    setFocusAction((n) => n + 1);
  }, []);
  useEffect(() => {
    if (!focusAction) return;
    const el = document.getElementById('alert-action');
    el?.scrollIntoView({ block: 'center' });
    el?.focus({ preventScroll: true });
  }, [focusAction]);

  // Tabs follow the keyboard pattern: arrows, Home and End move the selection.
  const onTabKey = (e: ReactKeyboardEvent) => {
    const i = TABS.findIndex((x) => x.id === tab);
    let next = -1;
    if (e.key === 'ArrowRight') next = (i + 1) % TABS.length;
    if (e.key === 'ArrowLeft') next = (i - 1 + TABS.length) % TABS.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = TABS.length - 1;
    if (next < 0) return;
    e.preventDefault();
    setTab(TABS[next].id);
    tabRefs.current[TABS[next].id]?.focus();
  };

  const baselineOf = (v: VariableId) => state.baselines.find((b) => b.variable === v && b.kind === 'preflight');
  const card = (v: VariableId, variant: 'card' | 'row' = 'card') => (
    <IndicatorCard
      key={v}
      variable={v}
      latest={state.latest[v]}
      baseline={baselineOf(v)}
      alerts={state.alerts}
      measurements={visible}
      launchDate={launch}
      fromDay={fromDay}
      variant={variant}
      cursorIso={asOf}
      coverage={coverageOf(state, v)}
    />
  );

  if (!colors) return null;

  const needsSetup = isOwn && !ownProfile;

  return (
    <ChartColorsContext.Provider value={colors}>
      <a className="skip-link" href="#main">
        {t({ en: 'Skip to content', pt: 'Pular para o conteúdo' })}
      </a>

      <div className="shell">
        <MissionBar
          state={state}
          asOf={asOf}
          missionDay={day}
          crewName={isOwn && ownProfile ? ownProfile.name : t({ en: 'Astronaut A (fictional)', pt: 'Astronauta A (fictício)' })}
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onShowAlerts={showAlerts}
        />
        {!needsSetup && (
          <div className="shell__track">
            {inFlight ? (
              <MissionTrack
                day={day}
                maxDay={maxDay}
                preflightDays={BASELINE.preflightDays}
                history={history}
                actionDays={actionLog.entries.map((e) => e.missionDay)}
                onChange={goToDay}
                chartWindow={chartWindow}
                windowFrom={fromDay}
                onWindowChange={setChartWindow}
              />
            ) : (
              <section className="track preflight-track" aria-label={t({ en: 'Pre-flight', pt: 'Pré-voo' })}>
                <h2 className="track__title">{t({ en: 'Pre-flight', pt: 'Pré-voo' })}</h2>
                <p className="track__now">
                  {t({ en: 'Day', pt: 'Dia' })} <strong>{day + BASELINE.preflightDays}</strong> {t({ en: 'of', pt: 'de' })}{' '}
                  {BASELINE.preflightDays} ·{' '}
                  {t({
                    en: `${preflightDaysLogged} day(s) with data. The baseline forms from these days; assessment starts on flight day 1.`,
                    pt: `${preflightDaysLogged} dia(s) com registro. O baseline se forma com esses dias; a avaliação começa no dia 1 de voo.`,
                  })}
                </p>
                <ol className="preflight-steps" aria-hidden="true">
                  {Array.from({ length: BASELINE.preflightDays }, (_, i) => (
                    <li key={i} className={i < day + BASELINE.preflightDays ? 'is-past' : ''} />
                  ))}
                </ol>
              </section>
            )}
          </div>
        )}
      </div>

      <div className="page">
        {isOwn ? (
          ownProfile && (
            <OwnMissionBar
              profile={ownProfile}
              preflightDaysLogged={preflightDaysLogged}
              inFlight={inFlight}
              onDemo={goDemo}
              onErase={eraseOwn}
            />
          )
        ) : (
          <DemoBar current={scenarioId} onChange={switchScenario} onOwn={goOwn} />
        )}

        {needsSetup ? (
          <main id="main" tabIndex={-1} className="setup-main">
            <OwnMissionSetup onCreate={createOwn} onDemo={goDemo} />
          </main>
        ) : (
          <>
            <VitalsStrip state={state} measurements={visible} />

            <div className="tabs" role="tablist" aria-label={t({ en: 'Sections', pt: 'Seções' })} onKeyDown={onTabKey}>
              {TABS.map((x) => (
                <button
                  key={x.id}
                  ref={(el) => {
                    tabRefs.current[x.id] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`tab-${x.id}`}
                  aria-selected={tab === x.id}
                  aria-controls={`panel-${x.id}`}
                  tabIndex={tab === x.id ? 0 : -1}
                  className="tab"
                  onClick={() => setTab(x.id)}
                >
                  {t(x.label)}
                  {x.id === 'overview' && alerts.length > 0 && (
                    <span className={`tab__count tab__count--${state.overall}`}>
                      <SeverityIcon severity={state.overall} size={12} />
                      {alerts.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <main id="main" tabIndex={-1}>
              <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
                {tab === 'overview' && (
                  <div className="stack">
                    <section aria-labelledby="alerts-title">
                      <h2 id="alerts-title" className="section-title">
                        {t({ en: 'Active alerts', pt: 'Alertas ativos' })}
                      </h2>
                      {alerts.length === 0 ? (
                        assessment.unassessed.length === 0 ? (
                          <div className="all-clear">
                            <CheckCircle size={28} />
                            <div>
                              <strong>{t({ en: `No active alerts on ${dayText}.`, pt: `Nenhum alerta ativo no ${dayText}.` })}</strong>
                              <span>
                                {t({
                                  en: 'All seven signals were assessed and are within the individual baseline.',
                                  pt: 'Os sete sinais foram avaliados e estão dentro do baseline individual.',
                                })}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="partial-clear">
                            <StatusIcon status="unassessed" size={28} />
                            <div>
                              <strong>
                                {assessment.none
                                  ? t({ en: `Not enough data to assess ${dayText}.`, pt: `Sem dados suficientes para avaliar o ${dayText}.` })
                                  : t({
                                      en: `No alerts, but ${assessment.unassessed.length} of 7 signals could not be assessed on ${dayText}.`,
                                      pt: `Nenhum alerta, mas ${assessment.unassessed.length} de 7 sinais não puderam ser avaliados no ${dayText}.`,
                                    })}
                              </strong>
                              <span>
                                {t({
                                  en: 'No alert does not mean everything is normal. Data is missing for:',
                                  pt: 'Ausência de alerta não significa que está tudo normal. Faltam dados para:',
                                })}
                              </span>
                              <ul>
                                {assessment.unassessed.map((c) => (
                                  <li key={c.variable}>
                                    <strong>{t(VARIABLES[c.variable].label)}:</strong> {c.reason}
                                  </li>
                                ))}
                              </ul>
                              <button type="button" className="btn btn--small" onClick={() => setTab('entry')}>
                                {t({ en: 'Log a measurement', pt: 'Registrar medição' })}
                              </button>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="alerts">
                          {alerts.map((a, i) => (
                            <AlertCard
                              key={a.id}
                              alert={a}
                              missionDay={missionDayOfAlert(a)}
                              actionId={i === 0 ? 'alert-action' : undefined}
                              followUp={followUp(a)}
                            />
                          ))}
                        </div>
                      )}
                    </section>

                    <section aria-labelledby="group-signal" className="group">
                      <h2 id="group-signal" className="section-title">
                        {t({ en: 'Signals', pt: 'Sinais' })} <ClassChip varClass="signal" />{' '}
                        <span className="section-sub">{t(CLASS_ROLE.signal)}</span>
                      </h2>
                      <div className="cluster" role="group" aria-labelledby="cluster-title">
                        <div className="cluster__head">
                          <h3 id="cluster-title">
                            {t({ en: 'Fast cluster: sleep, HRV and resting HR', pt: 'Cluster rápido: sono, HRV e FC de repouso' })}
                          </h3>
                          <p>
                            {t({
                              en: 'Same time axis. The composite rule reads all three together: two or more deviating in the same window suggest overload.',
                              pt: 'Mesmo eixo de tempo. A regra composta lê os três juntos: dois ou mais em desvio na mesma janela indicam sobrecarga.',
                            })}
                          </p>
                        </div>
                        {FAST_CLUSTER.map((v) => card(v, 'row'))}
                      </div>
                      <div className="grid-2">{SLOW_SIGNALS.map((v) => card(v))}</div>
                    </section>

                    <section aria-labelledby="group-accum" className="group">
                      <h2 id="group-accum" className="section-title">
                        {t({ en: 'Accumulator and countermeasure', pt: 'Acumulador e contramedida' })}{' '}
                        <span className="section-sub">
                          {t({
                            en: 'long-term consequence and the action that closes the loop',
                            pt: 'consequência de longo prazo e a ação que fecha o ciclo',
                          })}
                        </span>
                      </h2>
                      <div className="grid-2">
                        {card('bodyMass')}
                        {card('exerciseLoad')}
                      </div>
                    </section>
                  </div>
                )}

                {tab === 'countermeasure' && (
                  <CountermeasurePanel
                    state={state}
                    measurements={visible}
                    launchDate={launch}
                    fromDay={fromDay}
                    cursorIso={asOf}
                    missionDayOfAlert={missionDayOfAlert}
                  />
                )}

                {tab === 'entry' && (
                  <div className="stack">
                    <EntryPanel astronautId={astronautId} nowIso={entryNow} entries={entries} onAdd={addEntries} onRemove={removeEntry} />
                    <ActionsLogPanel
                      entries={actionLog.entries}
                      activeAlertIds={new Set(state.alerts.map((x) => x.id))}
                      onRemove={actionLog.remove}
                      day={day}
                    />
                  </div>
                )}

                {tab === 'about' && <AboutPanel />}
              </div>
            </main>
          </>
        )}

        <footer className="app-foot">
          <p>
            {DISCLAIMER_BY_LOCALE[lang]}{' '}
            {t({
              en: 'If in doubt, contact the crew medical officer or ground control.',
              pt: 'Em caso de dúvida, acione o oficial médico da tripulação ou o controle em Terra.',
            })}
          </p>
          <p className="muted small">
            NASA Space Apps Challenge 2026 · {t({ en: 'Challenge 05', pt: 'Desafio 05' })} · Formandos UDI ·{' '}
            <a href={LICENSE_URL} target="_blank" rel="noreferrer">
              {t({ en: 'Apache-2.0 license', pt: 'Licença Apache-2.0' })}
            </a>{' '}
            ·{' '}
            <a href={REPO_URL} target="_blank" rel="noreferrer">
              {t({ en: 'Source code', pt: 'Código-fonte' })}
            </a>
          </p>
        </footer>
      </div>
    </ChartColorsContext.Provider>
  );
}
