import { objectEntries } from '../../../captured-globals.js';
import { NAME_PATTERN, isPlainObject, thrownMessage } from '../model/core.js';
import { pageSources } from '../sources/index.js';
import { compileDetector } from './compile.js';

/**
 * @import { FeatureState } from '../../../utils.js'
 * @import { ConditionBlockOrArray } from '../../../config-feature.js'
 * @import { CompiledDetector } from './compile.js'
 * @import { DetectorConfig as RawDetectorConfig, WebDetectionSettings } from '@duckduckgo/privacy-configuration/schema/features/web-detection.js'
 */

/**
 * A raw detector's triggers. Raw config takes the privacy-configuration schema's types, and is still
 * validated here and by the compiler, since config reaches the page unchecked.
 *
 * @typedef {NonNullable<RawDetectorConfig['triggers']>} RawTriggers
 */

/**
 * Base properties supported by all triggers.
 *
 * @typedef {object} TriggerBase
 * @property {FeatureState} state - Whether this trigger is enabled
 * @property {import('../../../config-feature.js').ConditionBlockOrArray} [runConditions] - Conditions that must be met to run
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
 * Normalized detector configuration.
 *
 * Every optional field from the raw config is resolved to a concrete value.
 * Consumers never need fallback defaults.
 *
 * @typedef {object} DetectorConfig
 * @property {FeatureState} state - Whether the detector is enabled
 * @property {RawDetectorConfig} raw - the config as given, which `compileDetectorConfig` compiles
 * @property {Triggers} triggers - Trigger configurations
 */

/**
 * Default runConditions — by default, detectors only trigger in the top frame.
 * Specifying custom runConditions in config replaces (not merges) these defaults.
 */
const DEFAULT_RUN_CONDITIONS = /** @type {import('../../../config-feature.js').ConditionBlock[]} */ ([
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
    return NAME_PATTERN.test(name);
}

/**
 * Normalize a raw detector configuration by resolving all optional fields to concrete values.
 * After normalization, consumers never need fallback defaults.
 *
 * Default behavior (when fields are omitted from config):
 * - Detector is enabled
 * - breakageReport trigger is enabled, restricted to top frame
 * - auto trigger is disabled (opt-in only), restricted to top frame, no intervals
 *
 * @param {RawDetectorConfig} config
 * @returns {DetectorConfig}
 */
function normalizeDetector(config) {
    return {
        // Detectors are enabled by default
        state: config.state ?? 'enabled',
        raw: config,
        triggers: {
            // breakageReport: enabled by default - detectors participate in breakage report flow
            breakageReport: {
                state: config.triggers?.breakageReport?.state ?? 'enabled',
                runConditions: /** @type {ConditionBlockOrArray} */ (
                    config.triggers?.breakageReport?.runConditions ?? DEFAULT_RUN_CONDITIONS
                ),
            },
            // auto: disabled by default - detectors must opt in to automatic execution
            auto: {
                state: config.triggers?.auto?.state ?? 'disabled',
                runConditions: /** @type {ConditionBlockOrArray} */ (config.triggers?.auto?.runConditions ?? DEFAULT_RUN_CONDITIONS),
                when: config.triggers?.auto?.when ?? { intervalMs: [] },
            },
        },
    };
}

/**
 * Compile a detector's `match` and `actions`. A detector that fails to parse keeps the parse error, and
 * does not run.
 *
 * @param {DetectorConfig} config
 * @param {object} global - the global object `api` reads from
 * @returns {CompiledDetector | { error: string }}
 */
export function compileDetectorConfig(config, global) {
    try {
        return compileDetector(config.raw, pageSources(global));
    } catch (e) {
        return { error: thrownMessage(e) };
    }
}

/**
 * Parse detector configurations from raw config. `match` and `actions` are compiled separately, by
 * `compileDetectorConfig`.
 *
 * @param {WebDetectionSettings['detectors']} detectorsConfig
 * @returns {Record<string, Record<string, DetectorConfig>>}
 */
export function parseDetectors(detectorsConfig) {
    /** @type {Record<string, Record<string, DetectorConfig>>} */
    const detectors = {};

    if (!detectorsConfig) {
        return detectors;
    }

    for (const [groupName, groupConfig] of objectEntries(detectorsConfig)) {
        if (!isValidName(groupName) || !isPlainObject(groupConfig)) {
            continue;
        }

        /** @type {Record<string, DetectorConfig>} */
        const groupDetectors = {};

        for (const [detectorId, detectorConfig] of objectEntries(groupConfig)) {
            if (!isValidName(detectorId) || !isPlainObject(detectorConfig)) {
                continue;
            }

            groupDetectors[detectorId] = normalizeDetector(detectorConfig);
        }

        detectors[groupName] = groupDetectors;
    }

    return detectors;
}
