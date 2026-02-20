import { load, init, updateFeatureArgs } from '../src/content-scope-features.js';
import { TestTransportConfig } from '../../messaging/index.js';
import { getTabUrl, getLoadArgs } from '../src/utils.js';
import { platformSupport } from '../src/features.js';

/**
 * @typedef {import('../src/content-scope-features.js').LoadArgs & {
 *     debug: boolean,
 *     sessionKey: string
 * }} IntegrationConfig
 */

/**
 * @typedef {Window & typeof globalThis & {
 *     __content_scope_status?: "loaded" | "initialized",
 *     __testContentScopeArgs?: IntegrationConfig
 * }} IntegrationTestWindow
 */

/**
 * @returns {IntegrationConfig}
 */
function generateConfig() {
    const topLevelUrl = getTabUrl();
    return {
        debug: false,
        sessionKey: 'randomVal',
        messagingContextName: 'contentScopeScripts',
        platform: {
            name: 'extension',
        },
        currentCohorts: [
            {
                feature: 'contentScopeExperiments',
                subfeature: 'bloops',
                cohort: 'control',
            },
            {
                feature: 'contentScopeExperiments',
                subfeature: 'test',
                cohort: 'treatment',
            },
        ],
        site: {
            domain: topLevelUrl?.hostname || '',
            url: topLevelUrl?.href || '',
            isBroken: false,
            allowlisted: false,
            // Derive enabled features from platformSupport to avoid drift.
            // Exclude features requiring a messaging backend (clickToLoad) or
            // platform-specific globals (brokerProtection, autofillImport) that
            // would fail or slow down initialization in the integration test context.
            enabledFeatures: platformSupport.integration.filter((f) => !['clickToLoad', 'brokerProtection', 'autofillImport'].includes(f)),
        },
    };
}

/**
 * Simple object check.
 * @param {unknown} item
 * @returns {item is Record<string, unknown>}
 */
function isObject(item) {
    return Boolean(item) && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Deep merge two objects.
 * @template {Record<string, unknown>} T
 * @param {T} target
 * @param {...Record<string, unknown>} sources
 * @returns {T}
 */
function mergeDeep(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();
    const mutableTarget = /** @type {Record<string, unknown>} */ (target);

    if (source && isObject(target) && isObject(source)) {
        for (const key of Object.keys(source)) {
            const sourceValue = source[key];
            const targetValue = mutableTarget[key];

            if (isObject(sourceValue)) {
                if (!isObject(targetValue)) {
                    mutableTarget[key] = {};
                }
                mergeDeep(/** @type {Record<string, unknown>} */ (mutableTarget[key]), sourceValue);
            } else {
                mutableTarget[key] = sourceValue;
            }
        }
    }

    return mergeDeep(target, ...sources);
}

/**
 * @param {Event} evt
 * @returns {evt is CustomEvent<Record<string, unknown>>}
 */
function isContentScopeInitArgsEvent(evt) {
    return evt instanceof CustomEvent && isObject(evt.detail);
}

async function initCode() {
    const topLevelUrl = getTabUrl();
    const processedConfig = generateConfig();

    // mock Messaging and allow for tests to intercept them
    const messagingConfig = new TestTransportConfig({
        notify() {
            // noop
        },
        request: async () => {
            // noop
        },
        subscribe() {
            return () => {
                // noop
            };
        },
    });
    processedConfig.messagingConfig = messagingConfig;

    const testGlobal = /** @type {typeof globalThis & { cssMessaging?: TestTransportConfig }} */ (globalThis);
    testGlobal.cssMessaging = messagingConfig;

    load(getLoadArgs(processedConfig));

    // mark this phase as loaded
    setStatus('loaded');

    if (!topLevelUrl?.searchParams.has('wait-for-init-args')) {
        await init(processedConfig);
        setStatus('initialized');
        return;
    }

    // Wait for a message containing additional config
    document.addEventListener(
        'content-scope-init-args',
        async (evt) => {
            if (!isContentScopeInitArgsEvent(evt)) {
                return;
            }
            const merged = mergeDeep(processedConfig, evt.detail);
            const testWindow = /** @type {IntegrationTestWindow} */ (window);
            testWindow.__testContentScopeArgs = merged;
            // init features
            await init(merged);
            await updateFeatureArgs(merged);

            // set status to initialized so that tests can resume
            setStatus('initialized');
            document.dispatchEvent(new CustomEvent('content-scope-init-completed'));
        },
        { once: true },
    );
}

/**
 * @param {"loaded" | "initialized"} status
 */
function setStatus(status) {
    const testWindow = /** @type {IntegrationTestWindow} */ (window);
    testWindow.__content_scope_status = status;
}

initCode();
