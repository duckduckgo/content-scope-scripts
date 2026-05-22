/**
 * @typedef {import('../../utils.js').FeatureState} FeatureState
 */

/**
 * Condition used to determine if a detector has matched.
 *
 * @typedef {import('@duckduckgo/privacy-configuration/schema/features/web-detection.ts').DetectorConfig['match']} MatchCondition
 */

/**
 * Extract the member type of an array-like type. (T | T[]) -> T.
 *
 * @template T
 * @typedef {T extends (infer U)[] ? U : T} UnArray
 */

/**
 * @typedef {UnArray<MatchCondition>} MatchConditionSingle
 */

/**
 * Base properties supported by all triggers.
 *
 * @typedef {object} TriggerBase
 * @property {FeatureState} state - Whether this trigger is enabled
 * @property {import('../../config-feature.js').ConditionBlockOrArray} [runConditions] - Conditions that must be met to run
 */

/**
 * @typedef {TriggerBase & {
 *  when: {
 *    intervalMs: number[];
 *  };
 * }} AutoTrigger
 */

/**
 * @typedef {object} Triggers
 * @property {TriggerBase} breakageReport - Whether to run in the breakage report flow
 * @property {AutoTrigger} auto - Whether to run automatically at specified intervals
 */

/**
 * @typedef {object} FireEventAction
 * @property {FeatureState} state - whether this action is enabled
 * @property {string} type
 */

/**
 * Actions to take when a detector matches.
 * breakageReportData is always present (defaults to enabled).
 * fireEvent is opt-in by presence; when present, sub-fields are fully resolved.
 *
 * @typedef {object} ActionState
 * @property {FeatureState} state - whether the action is enabled
 */

/**
 * @typedef {object} DetectorActions
 * @property {ActionState} breakageReportData - Whether to include in breakage report data
 * @property {FireEventAction} [fireEvent] - fire a detection event to the client via webEvents
 */

/**
 * Normalized detector configuration.
 *
 * Every optional field from the raw config is resolved to a concrete value.
 * Consumers never need fallback defaults.
 *
 * @typedef {object} DetectorConfig
 * @property {FeatureState} state - Whether the detector is enabled
 * @property {MatchCondition} match - Conditions for the detector to match
 * @property {Triggers} triggers - Trigger configurations
 * @property {DetectorActions} actions - Actions to take on match
 */

/**
 * Default runConditions — by default, detectors only trigger in the top frame.
 * Specifying custom runConditions in config replaces (not merges) these defaults.
 */
const DEFAULT_RUN_CONDITIONS = /** @type {import('../../config-feature.js').ConditionBlock[]} */ ([
    {
        context: { top: true },
    },
]);

/**
 * Validate that a name matches the required format.
 * Names must start with a letter and contain only alphanumeric characters and underscores.
 *
 * @param {string} name
 * @returns {boolean}
 */
function isValidName(name) {
    return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(name);
}

/**
 * Normalize a raw detector configuration by resolving all optional fields to concrete values.
 * After normalization, consumers never need fallback defaults.
 *
 * Default behavior (when fields are omitted from config):
 * - Detector is enabled
 * - breakageReport trigger is enabled, restricted to top frame
 * - auto trigger is disabled (opt-in only), restricted to top frame, no intervals
 * - breakageReportData action is enabled (results included in breakage reports)
 * - other actions are enabled by default if present, but can be explicitly disabled. If omitted they are not enabled
 *
 * @param {import('@duckduckgo/privacy-configuration/schema/features/web-detection').DetectorConfig} config
 * @returns {DetectorConfig}
 */
function normalizeDetector(config) {
    const fireEvent = config.actions?.fireEvent;

    return {
        // Detectors are enabled by default
        state: config.state ?? 'enabled',
        match: config.match,
        triggers: {
            // breakageReport: enabled by default - detectors participate in breakage report flow
            breakageReport: {
                state: config.triggers?.breakageReport?.state ?? 'enabled',
                runConditions: config.triggers?.breakageReport?.runConditions ?? DEFAULT_RUN_CONDITIONS,
            },
            // auto: disabled by default - detectors must opt in to automatic execution
            auto: {
                state: config.triggers?.auto?.state ?? 'disabled',
                runConditions: config.triggers?.auto?.runConditions ?? DEFAULT_RUN_CONDITIONS,
                when: config.triggers?.auto?.when ?? { intervalMs: [] },
            },
        },
        actions: {
            // breakageReportData: enabled by default - detection results included in breakage reports
            breakageReportData: { state: config.actions?.breakageReportData?.state ?? 'enabled' },
            // fireEvent: only present when configured - opt-in action that sends events to the client via webEvents
            ...(fireEvent && {
                fireEvent: {
                    state: fireEvent.state ?? 'enabled',
                    type: fireEvent.type,
                },
            }),
        },
    };
}

/**
 * Parse detector configurations from raw config.
 *
 * @param {import('@duckduckgo/privacy-configuration/schema/features/web-detection').WebDetectionSettings['detectors']} detectorsConfig
 * @returns {Record<string, Record<string, DetectorConfig>>}
 */
export function parseDetectors(detectorsConfig) {
    /** @type {Record<string, Record<string, DetectorConfig>>} */
    const detectors = {};

    if (!detectorsConfig) {
        return detectors;
    }

    for (const [groupName, groupConfig] of Object.entries(detectorsConfig)) {
        if (!isValidName(groupName)) {
            continue;
        }

        /** @type {Record<string, DetectorConfig>} */
        const groupDetectors = {};

        for (const [detectorId, detectorConfig] of Object.entries(groupConfig)) {
            if (!isValidName(detectorId)) {
                continue;
            }

            groupDetectors[detectorId] = normalizeDetector(detectorConfig);
        }

        detectors[groupName] = groupDetectors;
    }

    return detectors;
}
