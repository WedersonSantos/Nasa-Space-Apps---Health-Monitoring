import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Alert, Measurement, VariableId } from './types/contract';
import { VARIABLE_IDS } from './types/contract';
import { SEVERITY_META } from './config/display';
import { CLASS_LABEL, CLASS_ROLE, VARIABLES, type VariableClass } from './config/variables';
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
import { ChartColorsContext, readChartColors, useTheme, type ChartColors } from './lib/theme';
import { AboutPanel } from './components/AboutPanel';
import { AlertCard } from './components/AlertCard';
import { OriginBadge } from './components/Badges';
import { CountermeasurePanel } from './components/CountermeasurePanel';
import { EntryPanel } from './components/EntryPanel';
import { CheckCircle } from './components/Icons';
import { IndicatorCard } from './components/IndicatorCard';
import { MissionHeader } from './components/MissionHeader';
import { MissionTimeline } from './components/MissionTimeline';
import { ScenarioSwitcher } from './components/ScenarioSwitcher';

type Tab = 'overview' | 'countermeasure' | 'entry' | 'about';
type ChartWindow = 'recent' | 'all';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Visão geral' },
  { id: 'countermeasure', label: 'Contramedida' },
  { id: 'entry', label: 'Registrar' },
  { id: 'about', label: 'Sobre e fontes' },
];

const GROUPS: VariableClass[] = ['signal', 'accumulator', 'countermeasure'];

/** Janela "recente" dos gráficos: 6 semanas até o dia avaliado. */
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

  const scenario = useMemo(() => scenarioFile(scenarioId), [scenarioId]);
  const launch = scenario.launchDate;
  const astronautId = scenario.profile.astronautId;

  useEffect(() => {
    setColors(readChartColors());
  }, [theme]);

  const switchScenario = useCallback((id: ScenarioId) => {
    setMeasurements(store.reset(scenarioFile(id), nowIso()));
    setScenarioId(id);
    setSelectedDay(null);
  }, []);

  // ---------- relógio da missão ----------
  const { minDay, maxDay } = useMemo(() => {
    let last = missionDayOf(scenario.asOf, launch);
    for (const m of measurements) last = Math.max(last, missionDayOf(m.timestamp, launch));
    return { minDay: 1, maxDay: last };
  }, [measurements, scenario.asOf, launch]);
  const day = selectedDay == null ? maxDay : Math.min(selectedDay, maxDay);
  const asOf = endOfMissionDay(day, launch);
  const goToDay = useCallback((d: number) => setSelectedDay(d), []);

  // Atalhos da demo: 1/2/3 trocam o cenário; ← → movem um dia.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.ctrlKey || e.metaKey || e.altKey || t.closest('input, select, textarea, button, [role=tooltip]')) return;
      const s = SCENARIOS.find((x) => String(x.number) === e.key);
      if (s) switchScenario(s.id);
      if (e.key === 'ArrowLeft') setSelectedDay(Math.max(minDay, day - 1));
      if (e.key === 'ArrowRight') setSelectedDay(Math.min(maxDay, day + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [switchScenario, day, minDay, maxDay]);

  // ---------- avaliação (função pura do motor) ----------
  const state = useMemo(() => evaluateState(measurements, scenario, asOf), [measurements, scenario, asOf]);
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
  const entries = useMemo(() => measurements.filter((m) => m.origin !== 'synthetic'), [measurements]);
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

  const baselineOf = (v: VariableId) => state.baselines.find((b) => b.variable === v && b.kind === 'preflight');
  const hasSynthetic = visible.some((m) => m.origin === 'synthetic');

  if (!colors) return null;

  return (
    <ChartColorsContext.Provider value={colors}>
      <a className="skip-link" href="#main">
        Pular para o conteúdo
      </a>
      <MissionHeader state={state} asOf={asOf} theme={theme} onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />

      {hasSynthetic && (
        <div className="synthetic-banner" role="note">
          <OriginBadge origin="synthetic" />
          <span>Dados sintéticos para demonstração — não há telemetria real de astronauta. Cada medição mostra sua origem.</span>
        </div>
      )}

      <ScenarioSwitcher current={scenarioId} onChange={switchScenario} />
      <MissionTimeline day={day} minDay={minDay} maxDay={maxDay} onChange={goToDay} />

      <nav className="tabs" role="tablist" aria-label="Seções">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls="main"
            className="tab"
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.id === 'overview' && alerts.length > 0 && <span className="tab__count">{alerts.length}</span>}
          </button>
        ))}
        {(tab === 'overview' || tab === 'countermeasure') && (
          <div className="window-toggle" role="group" aria-label="Período dos gráficos">
            <button type="button" aria-pressed={chartWindow === 'recent'} onClick={() => setChartWindow('recent')}>
              6 semanas
            </button>
            <button type="button" aria-pressed={chartWindow === 'all'} onClick={() => setChartWindow('all')}>
              Missão inteira
            </button>
          </div>
        )}
      </nav>

      <main id="main" role="tabpanel" aria-labelledby={`tab-${tab}`} tabIndex={-1}>
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
                    <strong>Nenhum alerta ativo.</strong>
                    <span>Todos os sinais estão dentro do baseline individual e a aderência ao exercício está adequada.</span>
                  </div>
                </div>
              ) : (
                <div className="alerts">
                  {alerts.map((a) => (
                    <AlertCard key={a.id} alert={a} missionDay={missionDayOfAlert(a)} />
                  ))}
                </div>
              )}
            </section>

            {GROUPS.map((g) => (
              <section key={g} aria-labelledby={`group-${g}`}>
                <h2 id={`group-${g}`} className="section-title">
                  {g === 'signal' ? 'Sinais' : CLASS_LABEL[g]} <span className="section-sub">{CLASS_ROLE[g]}</span>
                </h2>
                <div className="indicators">
                  {VARIABLE_IDS.filter((v) => VARIABLES[v].varClass === g).map((v) => (
                    <IndicatorCard
                      key={v}
                      variable={v}
                      latest={state.latest[v]}
                      baseline={baselineOf(v)}
                      alerts={state.alerts}
                      measurements={visible}
                      launchDate={launch}
                      fromDay={fromDay}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {tab === 'countermeasure' && (
          <CountermeasurePanel
            state={state}
            measurements={visible}
            launchDate={launch}
            fromDay={fromDay}
            missionDayOfAlert={missionDayOfAlert}
          />
        )}

        {tab === 'entry' && (
          <EntryPanel astronautId={astronautId} nowIso={asOf} entries={entries} onAdd={addEntries} onRemove={removeEntry} />
        )}

        {tab === 'about' && <AboutPanel />}
      </main>

      <footer className="app-foot">
        <p>{DISCLAIMER} Em caso de dúvida, acione o oficial médico da tripulação ou o controle em Terra.</p>
        <p className="muted small">NASA Space Apps Challenge 2026 · Desafio 05 · Formandos UDI · Licença Apache-2.0</p>
      </footer>
    </ChartColorsContext.Provider>
  );
}
