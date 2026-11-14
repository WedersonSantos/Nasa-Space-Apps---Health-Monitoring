import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { Alert, Measurement, VariableId } from './types/contract';
import { SEVERITY_META } from './config/display';
import { CLASS_ROLE } from './config/variables';
import { DISCLAIMER } from './engine';
import {
  SCENARIOS,
  endOfMissionDay,
  evaluateState,
  initialScenarioId,
  missionDayOf,
  scenarioFile,
  store,
  type ScenarioId,
} from './integration/dataSource';
import { computeMissionHistory } from './lib/missionHistory';
import { ChartColorsContext, readChartColors, useTheme, type ChartColors } from './lib/theme';
import { AboutPanel, LICENSE_URL, REPO_URL } from './components/AboutPanel';
import { AlertCard } from './components/AlertCard';
import { ClassChip } from './components/Badges';
import { CountermeasurePanel } from './components/CountermeasurePanel';
import { DemoBar } from './components/DemoBar';
import { EntryPanel } from './components/EntryPanel';
import { CheckCircle, SeverityIcon } from './components/Icons';
import { IndicatorCard } from './components/IndicatorCard';
import { MissionBar } from './components/MissionBar';
import { MissionTrack, type ChartWindow } from './components/MissionTrack';
import { VitalsStrip } from './components/VitalsStrip';

type Tab = 'overview' | 'countermeasure' | 'entry' | 'about';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Visão geral' },
  { id: 'countermeasure', label: 'Contramedida' },
  { id: 'entry', label: 'Registrar' },
  { id: 'about', label: 'Sobre e fontes' },
];

/** Os três sinais rápidos lidos juntos pela regra composta: empilhados no mesmo eixo de tempo. */
const FAST_CLUSTER: VariableId[] = ['sleep', 'hrv', 'restingHeartRate'];
const SLOW_SIGNALS: VariableId[] = ['bloodPressure', 'selfReport'];

/** Dias de pré-voo exibidos na trilha (baseline congelado). */
const PREFLIGHT_DAYS = 7;
/** Janela "6 semanas" dos gráficos. */
const RECENT_WINDOW_DAYS = 42;

const nowIso = () => new Date().toISOString();

export default function App() {
  const [theme, setTheme] = useTheme();
  const [colors, setColors] = useState<ChartColors | null>(null);
  const [scenarioId, setScenarioId] = useState<ScenarioId>(initialScenarioId);
  const [measurements, setMeasurements] = useState<Measurement[]>(() =>
    store.loadOrSeed(scenarioFile(initialScenarioId()), nowIso()),
  );
  const [selectedDay, setSelectedDay] = useState<number | null>(null); // null = mais recente
  const [tab, setTab] = useState<Tab>('overview');
  const [chartWindow, setChartWindow] = useState<ChartWindow>('recent');
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ overview: null, countermeasure: null, entry: null, about: null });

  const scenario = useMemo(() => scenarioFile(scenarioId), [scenarioId]);
  const launch = scenario.launchDate;
  const astronautId = scenario.profile.astronautId;
  const entries = useMemo(() => measurements.filter((m) => m.origin !== 'synthetic'), [measurements]);

  useEffect(() => {
    setColors(readChartColors());
  }, [theme]);

  const switchScenario = useCallback(
    (id: ScenarioId) => {
      if (id === scenarioId) return;
      if (
        entries.length > 0 &&
        !window.confirm(`Trocar de cenário apaga ${entries.length} registro(s) manual(is) deste dispositivo. Continuar?`)
      )
        return;
      setMeasurements(store.reset(scenarioFile(id), nowIso()));
      setScenarioId(id);
      setSelectedDay(null);
    },
    [scenarioId, entries.length],
  );

  // ---------- relógio da missão ----------
  const maxDay = useMemo(() => {
    let last = missionDayOf(scenario.asOf, launch);
    for (const m of measurements) last = Math.max(last, missionDayOf(m.timestamp, launch));
    return last;
  }, [measurements, scenario.asOf, launch]);
  const day = selectedDay == null ? maxDay : Math.min(Math.max(1, selectedDay), maxDay);
  const asOf = endOfMissionDay(day, launch);
  const goToDay = useCallback((d: number) => setSelectedDay(d), []);

  // Atalhos da demo: 1/2/3 trocam o cenário; ← → movem um dia.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.ctrlKey || e.metaKey || e.altKey || t.closest('input, select, textarea, button, [role=tab], [role=tooltip]')) return;
      const s = SCENARIOS.find((x) => String(x.number) === e.key);
      if (s) switchScenario(s.id);
      if (e.key === 'ArrowLeft') setSelectedDay(Math.max(1, day - 1));
      if (e.key === 'ArrowRight') setSelectedDay(Math.min(maxDay, day + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [switchScenario, day, maxDay]);

  // ---------- avaliação (função pura do motor) ----------
  const state = useMemo(() => evaluateState(measurements, scenario, asOf), [measurements, scenario, asOf]);
  const deferredMeasurements = useDeferredValue(measurements);
  const history = useMemo(
    () => computeMissionHistory(deferredMeasurements, scenario, maxDay),
    [deferredMeasurements, scenario, maxDay],
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
  const missionDayOfAlert = useCallback((a: Alert) => missionDayOf(a.raisedAt, launch), [launch]);
  const fromDay = chartWindow === 'recent' ? day - RECENT_WINDOW_DAYS + 1 : null;

  // ---------- registros manuais (persistidos no dispositivo) ----------
  const addEntries = useCallback((ms: Measurement[]): string | null => {
    let latest: Measurement[] | null = null;
    for (const m of ms) {
      const r = store.append(m, nowIso());
      if (!r.ok) return r.error;
      latest = r.measurements;
    }
    if (latest) setMeasurements(latest);
    return null;
  }, []);
  const removeEntry = useCallback(
    (id: string) => {
      setMeasurements((prev) => {
        const next = prev.filter((m) => m.id !== id);
        store.save(astronautId, next);
        return next;
      });
    },
    [astronautId],
  );

  // Anunciador -> ação do alerta mais grave, na Visão geral.
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

  // Abas no padrão do teclado: setas, Home e End movem a seleção.
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
    />
  );

  if (!colors) return null;

  return (
    <ChartColorsContext.Provider value={colors}>
      <a className="skip-link" href="#main">
        Pular para o conteúdo
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
        <div className="shell__track">
          <MissionTrack
            day={day}
            maxDay={maxDay}
            preflightDays={PREFLIGHT_DAYS}
            history={history}
            onChange={goToDay}
            chartWindow={chartWindow}
            windowFrom={fromDay}
            onWindowChange={setChartWindow}
          />
        </div>
      </div>

      <div className="page">
        <DemoBar current={scenarioId} onChange={switchScenario} />
        <VitalsStrip state={state} measurements={visible} />

        <div className="tabs" role="tablist" aria-label="Seções" onKeyDown={onTabKey}>
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
                    Alertas ativos
                  </h2>
                  {alerts.length === 0 ? (
                    <div className="all-clear">
                      <CheckCircle size={28} />
                      <div>
                        <strong>Nenhum alerta ativo no dia {day}.</strong>
                        <span>Os sete sinais estão dentro do baseline individual e a aderência ao exercício está adequada.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="alerts">
                      {alerts.map((a, i) => (
                        <AlertCard key={a.id} alert={a} missionDay={missionDayOfAlert(a)} actionId={i === 0 ? 'alert-action' : undefined} />
                      ))}
                    </div>
                  )}
                </section>

                <section aria-labelledby="group-signal" className="group">
                  <h2 id="group-signal" className="section-title">
                    Sinais <ClassChip varClass="signal" /> <span className="section-sub">{CLASS_ROLE.signal}</span>
                  </h2>
                  <div className="cluster" role="group" aria-labelledby="cluster-title">
                    <div className="cluster__head">
                      <h3 id="cluster-title">Cluster rápido: sono, HRV e FC de repouso</h3>
                      <p>Mesmo eixo de tempo. A regra composta lê os três juntos: dois ou mais em desvio na mesma janela indicam sobrecarga.</p>
                    </div>
                    {FAST_CLUSTER.map((v) => card(v, 'row'))}
                  </div>
                  <div className="grid-2">{SLOW_SIGNALS.map((v) => card(v))}</div>
                </section>

                <section aria-labelledby="group-accum" className="group">
                  <h2 id="group-accum" className="section-title">
                    Acumulador e contramedida <span className="section-sub">consequência de longo prazo e a ação que fecha o ciclo</span>
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
              <EntryPanel astronautId={astronautId} nowIso={asOf} entries={entries} onAdd={addEntries} onRemove={removeEntry} />
            )}

            {tab === 'about' && <AboutPanel />}
          </div>
        </main>

        <footer className="app-foot">
          <p>{DISCLAIMER} Em caso de dúvida, acione o oficial médico da tripulação ou o controle em Terra.</p>
          <p className="muted small">
            NASA Space Apps Challenge 2026 · Desafio 05 · Formandos UDI ·{' '}
            <a href={LICENSE_URL} target="_blank" rel="noreferrer">
              Licença Apache-2.0
            </a>{' '}
            ·{' '}
            <a href={REPO_URL} target="_blank" rel="noreferrer">
              Código-fonte
            </a>
          </p>
        </footer>
      </div>
    </ChartColorsContext.Provider>
  );
}
