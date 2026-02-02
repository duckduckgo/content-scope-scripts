/**
 * Either a single value or an array of values.
 *
 * @template T
 * @typedef {T | T[]} MaybeArray
 */

/**
 * Text pattern match configuration.
 *
 * Condition is true if ANY pattern matches text in ANY selected element.
 *
 * @typedef {object} TextMatchCondition
 * @property {MaybeArray<string>} pattern - Regex pattern(s) to search for.
 * @property {MaybeArray<string>} [selector] - CSS selector(s) to get text from.
 */

/**
 * Element presence match configuration.
 *
 * Condition is true if ANY selector has a matching element with the required visibility.
 *
 * @typedef {object} ElementMatchCondition
 * @property {MaybeArray<string>} selector - CSS selector(s) for the element.
 * @property {'visible' | 'hidden' | 'any'} [visibility] - Whether the element must be visible, hidden, or either (default: 'any').
 */

/**
 * Match conditions that determine when a detector has matched.
 *
 * @typedef {object} MatchConditionSingle
 * @property {MaybeArray<TextMatchCondition>} [text] - Text pattern conditions
 * @property {MaybeArray<ElementMatchCondition>} [element] - Element presence conditions
 */

/**
 * One or more alternative match conditions.
 *
 * @typedef {MaybeArray<MatchConditionSingle>} MatchCondition
 */

/**
 * Base properties supported by all triggers.
 *
 * @typedef {object} TriggerBase
 * @property {import('../../utils.js').FeatureState} state - Whether this trigger is enabled
 * @property {import('../../config-feature.js').ConditionBlockOrArray} [runConditions] - Conditions that must be met to run
 */

/**
 * @typedef {object} Triggers
 * @property {TriggerBase} breakageReport - Whether to run in the breakage report flow
 */

/**
 * Base properties supported by all actions.
 *
 * @typedef {object} ActionBase
 * @property {import('../../utils.js').FeatureState} state - whether the action is enabled
 */

/**
 * Actions to take when a detector matches.
 *
 * @typedef {object} DetectorActions
 * @property {ActionBase} breakageReportData - Whether to include in breakage report data
 */

/**
 * Normalized detector configuration.
 *
 * The user-facing configuration has optional attributes that are required
 * under-the-hood. This type represents the normalized configuration once
 * default values have been applied.
 *
 * @typedef {object} DetectorConfig
 * @property {import('../../utils.js').FeatureState} state - Whether the detector is enabled
 * @property {MatchCondition} match - Conditions for the detector to match
 * @property {Triggers} triggers - Trigger configurations
 * @property {DetectorActions} actions - Actions to take on match
 */

/**
 * A detector group containing multiple detectors.
 *
 * Each key is the name of the detector in the group, and the value is the
 * detector configuration.
 *
 * @typedef {Object<string, DetectorConfig>} DetectorGroup
 */

/**
 * Result from running a detector.
 *
 * @typedef {object} DetectorResult
 * @property {string} detectorId - ID of the detector
 * @property {true | false | 'error'} detected - Whether the detector matched (true), didn't match (false), or errored
 */

export {};
