/** API pública do motor (Bloco A). O Bloco B importa daqui. */
export { evaluate, maxSeverity, ruleIdOf } from './evaluate';
export { validateMeasurements, checkMeasurement, type RejectedMeasurement, type ValidationResult } from './validation';
export { buildDailySeries, chartSeries, wellbeingIndex, selfReportComponent, type DailyPoint, type DailySeries } from './series';
export { computeBaseline, preflightBaselines, rollingBaselines } from './baseline';
export type { RuleId } from './rules';
export { RULES, BASELINE, EXPECTED_UNITS, PLAUSIBLE_RANGES, ENGINE_CONFIG_VERSION } from './config/thresholds';
export { SOURCES, ARBITRARY, type SourceKey, type SourceRef } from './config/sources';
export { DISCLAIMER, ESCALATION_TEXT } from './config/guidance';
