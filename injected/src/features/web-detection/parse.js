import { withDefaults } from '../../utils.js';

/**
 * @typedef {import('./types.js').DetectorConfig} DetectorConfig
 * @typedef {import('../../utils.js').FeatureState} FeatureState
 */

/**
 * Default runConditions - applied only when config doesn't provide runConditions.
 *
 * NOTE: We make this an array so that specifying custom runConditions overrides rather than merges.
 *
 * By default, detectors will only trigger in the top frame.
 */
const DEFAULT_RUN_CONDITIONS = /** @type {import('../../config-feature.js').ConditionBlock[]} */ ([
    {
        context: { top: true },
    },
]);

/**
 * Default configuration values for detectors.
 *
 * This is merged deeply with the config such that any time the config provides
 * a scalar or nested value, the default value is overridden.
 */
const DEFAULTS = {
    state: /** @type {FeatureState} */ ('enabled'),
    triggers: {
        breakageReport: {
            state: /** @type {FeatureState} */ ('enabled'),
            runConditions: DEFAULT_RUN_CONDITIONS,
        },
    },
    actions: {
        breakageReportData: {
            state: /** @type {FeatureState} */ ('enabled'),
        },
    },
};

/**
 * Validate that a name matches the required format.
 * Names must start with a lowercase letter and contain only alphanumeric characters and underscores.
 *
 * @param {string} name
 * @returns {boolean}
 */
function isValidName(name) {
    return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(name);
}

/**
 * Normalize a raw detector configuration by applying defaults.
 *
 * @param {import('@duckduckgo/privacy-configuration/schema/features/web-detection').DetectorConfig} config
 * @returns {DetectorConfig}
 */
function normalizeDetector(config) {
    return withDefaults(DEFAULTS, config);
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
