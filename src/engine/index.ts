/** API pública do motor (Bloco A). O Bloco B importa daqui. */
export { evaluate, maxSeverity, ruleIdOf, type EvaluateOptions } from './evaluate';
export { validateMeasurements, checkMeasurement, type RejectedMeasurement, type ValidationResult } from './validation';
export { buildDailySeries, chartSeries, wellbeingIndex, selfReportComponent, type DailyPoint, type DailySeries } from './series';
export { computeBaseline, preflightBaselines, rollingBaselines } from './baseline';
export type { RuleId } from './rules';
export { computeCoverage } from './coverage';
export { DEFAULT_LOCALE, LOCALES, pick, formatter, type Locale } from './i18n';
export { RULES, BASELINE, COVERAGE, EXPECTED_UNITS, PLAUSIBLE_RANGES, ENGINE_CONFIG_VERSION } from './config/thresholds';
export { SOURCES, ARBITRARY, sourceUsedFor, type SourceKey, type SourceRef } from './config/sources';
export {
  DISCLAIMER,
  ESCALATION_TEXT,
  PERSISTENCE_TEXT,
  DISCLAIMER_BY_LOCALE,
  ESCALATION_TEXT_BY_LOCALE,
  PERSISTENCE_TEXT_BY_LOCALE,
  GUIDANCE_BY_LOCALE,
  guidanceFor,
} from './config/guidance';
