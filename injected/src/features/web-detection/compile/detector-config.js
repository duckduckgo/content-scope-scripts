import { NAME_PATTERN } from '../model/core.js';
import { pageSources } from '../sources/index.js';
import { compileDetector } from './compile.js';

/**
 * @typedef {import('../../../utils.js').FeatureState} FeatureState
 * @typedef {import('../../../config-feature.js').ConditionBlockOrArray} ConditionBlockOrArray
 * @typedef {import('./compile.js').CompiledDetector} CompiledDetector
 */

/**
 * Raw detector config. `match` and `actions` are read as `unknown` and validated by the compiler,
 * since the pinned privacy-configuration schema predates them.
 *
 * @typedef {object} RawDetectorConfig
 * @property {FeatureState} [state]
 * @property {RawTriggers} [triggers]
 * @property {unknown} [match] - an expression in boolean position
 * @property {unknown} [actions] - an expression, or a sequence of them
 */

/**
 * @typedef {object} RawTriggers
 * @property {{ state?: FeatureState, runConditions?: unknown }} [breakageReport]
 * @property {{ state?: FeatureState, runConditions?: unknown, when?: { intervalMs: number[] } }} [auto]
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
        return { error: e instanceof Error ? e.message : String(e) };
    }
}

/**
 * Parse detector configurations from raw config. `match` and `actions` are compiled separately, by
 * `compileDetectorConfig`.
 *
 * @param {Record<string, Record<string, RawDetectorConfig>> | undefined} detectorsConfig
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
