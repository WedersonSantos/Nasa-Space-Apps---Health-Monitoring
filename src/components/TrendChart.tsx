import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Alert, Baseline, DataOrigin, Measurement, VariableId } from '../types/contract';
import { BASELINE_BAND_SD, ORIGIN_META, SELF_REPORT_DIMENSIONS } from '../config/display';
import { VARIABLES } from '../config/variables';
import { missionPos } from '../integration/dataSource';
import { fmt, fmtDateTime } from '../lib/format';
import { useChartColors, type ChartColors } from '../lib/theme';

interface Row {
  x: number;
  ts: string;
  origin: DataOrigin;
  method: string;
  [key: string]: number | string | undefined;
}

interface SeriesDef {
  key: string;
  name: string;
  color: string;
  dash?: string;
  unit: string;
}

function buildRows(variable: VariableId, ms: Measurement[], launch: string, fromDay: number | null): Row[] {
  const own = ms
    .filter((m) => m.variable === variable)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .filter((m) => fromDay == null || missionPos(m.timestamp, launch) >= fromDay);
  if (variable !== 'selfReport') {
    return own.map((m) => ({
      x: missionPos(m.timestamp, launch),
      ts: m.timestamp,
      origin: m.origin,
      method: m.method,
      value: m.value,
      secondary: m.secondaryValue,
    }));
  }
  const byTs = new Map<string, Row>();
  for (const m of own) {
    const row = byTs.get(m.timestamp) ?? { x: missionPos(m.timestamp, launch), ts: m.timestamp, origin: m.origin, method: 'self-report' };
    row[m.method] = m.value;
    byTs.set(m.timestamp, row);
  }
  return [...byTs.values()];
}

function seriesFor(variable: VariableId, c: ChartColors): SeriesDef[] {
  const meta = VARIABLES[variable];
  if (variable === 'bloodPressure') {
    return [
      { key: 'value', name: 'Systolic', color: c.accent, unit: 'mmHg' },
      { key: 'secondary', name: 'Diastolic', color: c.secondary, dash: '5 3', unit: 'mmHg' },
    ];
  }
  if (variable === 'selfReport') {
    const colors = [c.accent, c.secondary, c.tertiary];
    const dashes = [undefined, '6 3', '2 3'];
    return SELF_REPORT_DIMENSIONS.map((d, i) => ({ key: d.method, name: d.label, color: colors[i], dash: dashes[i], unit: '/5' }));
  }
  return [{ key: 'value', name: meta.label, color: c.accent, unit: meta.unit }];
}

/**
 * Point by origin: measured = filled circle, estimated = diamond.
 * Synthetic stays on the line only (the whole series is synthetic and already labelled; the tooltip confirms the origin).
 */
function OriginDot(props: { cx?: number; cy?: number; payload?: Row; stroke?: string; value?: unknown }) {
  const { cx, cy, payload, stroke } = props;
  if (cx == null || cy == null || payload == null || props.value == null) return null;
  if (payload.origin === 'measured') {
    return <circle cx={cx} cy={cy} r={5} fill={stroke} stroke="var(--surface)" strokeWidth={1.5} />;
  }
  if (payload.origin === 'estimated') {
    return <path d={`M${cx} ${cy - 4.5}L${cx + 4.5} ${cy}L${cx} ${cy + 4.5}L${cx - 4.5} ${cy}Z`} fill="var(--surface)" stroke={stroke} strokeWidth={1.5} />;
  }
  return null;
}

function dayLabel(x: number): string {
  const d = Math.floor(x);
  return d <= 0 ? `Pre-flight (${d})` : `Day ${d}`;
}

function ChartTooltip({
  active,
  payload,
  series,
  decimals,
  extra,
}: {
  active?: boolean;
  payload?: { payload: Row }[];
  series: SeriesDef[];
  decimals: number;
  extra?: (row: Row) => string | null;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="chart-tip">
      <div className="chart-tip__head">
        {dayLabel(row.x)} · {fmtDateTime(row.ts)}
      </div>
      {series.map((s) =>
        typeof row[s.key] === 'number' ? (
          <div key={s.key} className="chart-tip__row">
            <span className="chart-tip__swatch" style={{ background: s.color }} />
            {s.name}: <strong>{fmt(row[s.key] as number, decimals)}</strong> {s.unit}
          </div>
        ) : null,
      )}
      {extra?.(row) && <div className="chart-tip__row">{extra(row)}</div>}
      <div className="chart-tip__origin">
        Origin: {ORIGIN_META[row.origin].label} · {row.method}
      </div>
    </div>
  );
}

// Recharts only sees ReferenceLine as a direct child of the chart: that is why these are functions, not components.
// Every chart shows the onset of all active alerts (strong when it involves this variable) and the assessed day.
function alertMarkers(alerts: Alert[], relatedIds: Set<string>, launch: string, c: ChartColors, minX: number) {
  return alerts
    .filter((a) => missionPos(a.raisedAt, launch) >= minX)
    .map((a) => {
      const own = relatedIds.has(a.id);
      const color = a.severity === 'critical' ? c.critical : c.attention;
      return (
        <ReferenceLine
          key={a.id}
          x={missionPos(a.raisedAt, launch)}
          stroke={own ? color : c.muted}
          strokeWidth={own ? 2 : 1}
          strokeOpacity={own ? 1 : 0.6}
          strokeDasharray={own ? '4 3' : '2 4'}
          ifOverflow="extendDomain"
          label={own ? { value: 'onset', position: 'insideTopRight', fill: color, fontSize: 11, fontWeight: 700 } : undefined}
        />
      );
    });
}

function dayCursor(cursorIso: string | undefined, launch: string, c: ChartColors) {
  if (!cursorIso) return null;
  return <ReferenceLine x={missionPos(cursorIso, launch)} stroke={c.text} strokeWidth={1} strokeOpacity={0.55} ifOverflow="extendDomain" />;
}

/** X-axis ticks in mission days, weekly, anchored on the last day. */
function weekTicks(rows: Row[]): number[] {
  if (!rows.length) return [];
  const min = Math.ceil(rows[0].x);
  const last = Math.floor(rows[rows.length - 1].x);
  const step = last - min > 60 ? 14 : 7;
  const ticks: number[] = [];
  for (let d = last; d >= min; d -= step) ticks.unshift(d);
  return ticks;
}

const tickLabel = (v: number) => (v <= 0 ? `${v}` : `D${v}`);

interface TrendChartProps {
  variable: VariableId;
  measurements: Measurement[];
  baseline?: Baseline;
  alerts: Alert[];
  launchDate: string;
  /** First mission day shown; null = whole series, including pre-flight. */
  fromDay: number | null;
  /** End of the assessed day: draws the track cursor on the time axis. */
  cursorIso?: string;
  height?: number;
}

export function TrendChart({ variable, measurements, baseline, alerts, launchDate, fromDay, cursorIso, height = 170 }: TrendChartProps) {
  const c = useChartColors();
  if (variable === 'exerciseLoad') {
    return <ExerciseChart measurements={measurements} alerts={alerts} launchDate={launchDate} fromDay={fromDay} cursorIso={cursorIso} height={height} />;
  }
  const meta = VARIABLES[variable];
  const rows = buildRows(variable, measurements, launchDate, fromDay);
  const minX = rows.length ? rows[0].x : 0;
  const series = seriesFor(variable, c);
  const related = alerts.filter((a) => a.variables.includes(variable));
  const showBand = baseline && variable !== 'selfReport';
  const domainY: [number | string, number | string] = variable === 'selfReport' ? [1, 5] : ['auto', 'auto'];
  const preflightEnd = baseline ? missionPos(baseline.windowEnd, launchDate) + 0.5 : null;

  return (
    <div className="chart" role="img" aria-label={chartLabel(meta.label, rows.length, baseline, related.length)}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={rows} margin={{ top: 16, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid stroke={c.grid} vertical={false} />
          {baseline && preflightEnd != null && preflightEnd > minX && (
            <ReferenceArea
              x1={Math.max(minX, missionPos(baseline.windowStart, launchDate) - 0.5)}
              x2={preflightEnd}
              fill={c.preflight}
              fillOpacity={1}
              label={{ value: 'pre-flight', position: 'insideTopLeft', fill: c.muted, fontSize: 11 }}
            />
          )}
          {showBand && (
            <ReferenceArea
              y1={baseline.mean - BASELINE_BAND_SD * baseline.stdDev}
              y2={baseline.mean + BASELINE_BAND_SD * baseline.stdDev}
              fill={c.band}
              fillOpacity={1}
              ifOverflow="extendDomain"
            />
          )}
          {showBand && <ReferenceLine y={baseline.mean} stroke={c.muted} strokeDasharray="3 3" />}
          <XAxis
            dataKey="x"
            type="number"
            domain={['dataMin - 0.5', 'dataMax + 0.5']}
            ticks={weekTicks(rows)}
            tickFormatter={tickLabel}
            tick={{ fill: c.muted, fontSize: 11 }}
            stroke={c.grid}
          />
          <YAxis
            domain={domainY}
            allowDecimals={variable !== 'selfReport'}
            tickFormatter={(v: number) => fmt(v, meta.decimals)}
            tick={{ fill: c.muted, fontSize: 11 }}
            stroke={c.grid}
            width={48}
          />
          <Tooltip
            content={
              <ChartTooltip
                series={series}
                decimals={meta.decimals}
                extra={variable === 'sleep' ? (r) => (typeof r.secondary === 'number' ? `Quality: ${r.secondary}/5` : null) : undefined}
              />
            }
          />
          {series.map((s) => (
            <Line
              key={s.key}
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={1.75}
              strokeDasharray={s.dash}
              dot={<OriginDot />}
              activeDot={{ r: 4 }}
              connectNulls
              isAnimationActive={false}
            />
          ))}
          {alertMarkers(alerts, new Set(related.map((a) => a.id)), launchDate, c, minX)}
          {dayCursor(cursorIso, launchDate, c)}
        </LineChart>
      </ResponsiveContainer>
      {series.length > 1 && (
        <ul className="chart-legend">
          {series.map((s) => (
            <li key={s.key}>
              <svg width="22" height="8" aria-hidden="true">
                <line x1="0" y1="4" x2="22" y2="4" stroke={s.color} strokeWidth="2" strokeDasharray={s.dash} />
              </svg>
              {s.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function chartLabel(label: string, n: number, baseline: Baseline | undefined, alertCount: number) {
  const b = baseline ? `, baseline ${fmt(baseline.mean, 1)} ± ${fmt(baseline.stdDev, 1)}` : '';
  const a = alertCount ? `, ${alertCount} alert(s) marked` : '';
  return `${label} chart: ${n} measurements${b}${a}.`;
}

export function ExerciseChart({
  measurements,
  alerts,
  launchDate,
  fromDay,
  cursorIso,
  height = 170,
}: {
  measurements: Measurement[];
  alerts: Alert[];
  launchDate: string;
  fromDay: number | null;
  cursorIso?: string;
  height?: number;
}) {
  const c = useChartColors();
  const rows = buildRows('exerciseLoad', measurements, launchDate, fromDay);
  const minX = rows.length ? rows[0].x : 0;
  const related = alerts.filter((a) => a.variables.includes('exerciseLoad'));
  const series: SeriesDef[] = [
    { key: 'value', name: 'Completed', color: c.accent, unit: 'min' },
    { key: 'secondary', name: 'Prescribed', color: c.muted, dash: '4 3', unit: 'min' },
  ];
  return (
    <div className="chart" role="img" aria-label={`Exercise chart: minutes completed versus prescribed over ${rows.length} days.`}>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={rows} margin={{ top: 16, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid stroke={c.grid} vertical={false} />
          <XAxis
            dataKey="x"
            type="number"
            domain={['dataMin - 0.5', 'dataMax + 0.5']}
            ticks={weekTicks(rows)}
            tickFormatter={tickLabel}
            tick={{ fill: c.muted, fontSize: 11 }}
            stroke={c.grid}
          />
          <YAxis tick={{ fill: c.muted, fontSize: 11 }} stroke={c.grid} width={48} domain={[0, 'auto']} />
          <Tooltip content={<ChartTooltip series={series} decimals={0} />} />
          <Bar dataKey="value" name="Completed" fill={c.accent} maxBarSize={8} isAnimationActive={false} />
          <Line dataKey="secondary" name="Prescribed" type="stepAfter" stroke={c.text} strokeWidth={1.5} strokeDasharray="4 3" dot={false} isAnimationActive={false} />
          {alertMarkers(alerts, new Set(related.map((a) => a.id)), launchDate, c, minX)}
          {dayCursor(cursorIso, launchDate, c)}
        </ComposedChart>
      </ResponsiveContainer>
      <ul className="chart-legend">
        <li>
          <svg width="12" height="10" aria-hidden="true">
            <rect width="12" height="10" fill={c.accent} />
          </svg>
          Completed
        </li>
        <li>
          <svg width="22" height="8" aria-hidden="true">
            <line x1="0" y1="4" x2="22" y2="4" stroke={c.text} strokeWidth="1.5" strokeDasharray="4 3" />
          </svg>
          Prescribed
        </li>
      </ul>
    </div>
  );
}
