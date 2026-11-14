import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { Alert, Measurement, VariableId } from './types/contract';
import { SEVERITY_META } from './config/display';
import { CLASS_ROLE, VARIABLES } from './config/variables';
import { BASELINE, DISCLAIMER } from './engine';
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

type Tab = 'overview' | 'countermeasure' | 'entry' | 'about';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'countermeasure', label: 'Countermeasure' },
  { id: 'entry', label: 'Log data' },
  { id: 'about', label: 'About & sources' },
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
    const t = window.setInterval(() => setClock(nowIso()), CLOCK_TICK_MS);
    return () => window.clearInterval(t);
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
        !window.confirm('Switching scenario erases the manual entries and logged actions in the demo. Continue?')
      )
        return;
      setDemoMeasurements(store.reset(scenarioFile(id), nowIso()));
      actionLog.clear();
      setScenarioId(id);
      setSelectedDay(null);
    },
    [scenarioId, demoMeasurements, actionLog],
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
    if (!window.confirm(`Erase ${ownProfile.name}’s mission and all entries and actions on this device? This cannot be undone.`)) return;
    store.clear(ownProfile.astronautId, nowIso());
    actionLog.clear();
    saveOwnProfile(null);
    setOwnProfile(null);
    setOwnMeasurements([]);
  }, [ownProfile, actionLog]);

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
  const dayText = inFlight ? `day ${day}` : `pre-flight day ${day + BASELINE.preflightDays} of ${BASELINE.preflightDays}`;

  // Shortcuts: 1/2/3 switch scenario (demo only); ← → move one day.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.ctrlKey || e.metaKey || e.altKey || t.closest('input, select, textarea, button, [role=tab], [role=tooltip]')) return;
      const s = SCENARIOS.find((x) => String(x.number) === e.key);
      if (s && !isOwn) switchScenario(s.id);
      if (e.key === 'ArrowLeft') setSelectedDay(Math.max(minDay, day - 1));
      if (e.key === 'ArrowRight') setSelectedDay(Math.min(maxDay, day + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [switchScenario, day, minDay, maxDay, isOwn]);

  // ---------- evaluation (pure engine function) ----------
  const state = useMemo(() => evaluateState(measurements, mission, asOf), [measurements, mission, asOf]);
  const deferredMeasurements = useDeferredValue(measurements);
  const history = useMemo(
    () => computeMissionHistory(deferredMeasurements, mission, maxDay),
    [deferredMeasurements, mission, maxDay],
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
        const r = store.append(m, nowIso());
        if (!r.ok) return r.error;
        latest = r.measurements;
      }
      if (latest) setMeasurements(latest);
      if (isOwn) setClock(nowIso());
      return null;
    },
    [setMeasurements, isOwn],
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
    const i = TABS.findIndex((t) => t.id === tab);
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
        Skip to content
      </a>

      <div className="shell">
        <MissionBar
          state={state}
          asOf={asOf}
          missionDay={day}
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
              <section className="track preflight-track" aria-label="Pre-flight">
                <h2 className="track__title">Pre-flight</h2>
                <p className="track__now">
                  Day <strong>{day + BASELINE.preflightDays}</strong> of {BASELINE.preflightDays} · {preflightDaysLogged} day(s)
                  with data. The baseline forms from these days; assessment starts on flight day 1.
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

            <div className="tabs" role="tablist" aria-label="Sections" onKeyDown={onTabKey}>
              {TABS.map((t) => (
                <button
                  key={t.id}
                  ref={(el) => {
                    tabRefs.current[t.id] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`tab-${t.id}`}
                  aria-selected={tab === t.id}
                  aria-controls={`panel-${t.id}`}
                  tabIndex={tab === t.id ? 0 : -1}
                  className="tab"
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                  {t.id === 'overview' && alerts.length > 0 && (
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
                        Active alerts
                      </h2>
                      {alerts.length === 0 ? (
                        assessment.unassessed.length === 0 ? (
                          <div className="all-clear">
                            <CheckCircle size={28} />
                            <div>
                              <strong>No active alerts on {dayText}.</strong>
                              <span>All seven signals were assessed and are within the individual baseline.</span>
                            </div>
                          </div>
                        ) : (
                          <div className="partial-clear">
                            <StatusIcon status="unassessed" size={28} />
                            <div>
                              <strong>
                                {assessment.none
                                  ? `Not enough data to assess ${dayText}.`
                                  : `No alerts, but ${assessment.unassessed.length} of 7 signals could not be assessed on ${dayText}.`}
                              </strong>
                              <span>No alert does not mean everything is normal. Data is missing for:</span>
                              <ul>
                                {assessment.unassessed.map((c) => (
                                  <li key={c.variable}>
                                    <strong>{VARIABLES[c.variable].label}:</strong> {c.reason}
                                  </li>
                                ))}
                              </ul>
                              <button type="button" className="btn btn--small" onClick={() => setTab('entry')}>
                                Log a measurement
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
                        Signals <ClassChip varClass="signal" /> <span className="section-sub">{CLASS_ROLE.signal}</span>
                      </h2>
                      <div className="cluster" role="group" aria-labelledby="cluster-title">
                        <div className="cluster__head">
                          <h3 id="cluster-title">Fast cluster: sleep, HRV and resting HR</h3>
                          <p>Same time axis. The composite rule reads all three together: two or more deviating in the same window suggest overload.</p>
                        </div>
                        {FAST_CLUSTER.map((v) => card(v, 'row'))}
                      </div>
                      <div className="grid-2">{SLOW_SIGNALS.map((v) => card(v))}</div>
                    </section>

                    <section aria-labelledby="group-accum" className="group">
                      <h2 id="group-accum" className="section-title">
                        Accumulator and countermeasure <span className="section-sub">long-term consequence and the action that closes the loop</span>
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
          <p>{DISCLAIMER} If in doubt, contact the crew medical officer or ground control.</p>
          <p className="muted small">
            NASA Space Apps Challenge 2026 · Challenge 05 · Formandos UDI ·{' '}
            <a href={LICENSE_URL} target="_blank" rel="noreferrer">
              Apache-2.0 license
            </a>{' '}
            ·{' '}
            <a href={REPO_URL} target="_blank" rel="noreferrer">
              Source code
            </a>
          </p>
        </footer>
      </div>
    </ChartColorsContext.Provider>
  );
}
