import { load, init, updateFeatureArgs } from '../src/content-scope-features.js';
import { TestTransportConfig } from '../../messaging/index.js';
import { getTabUrl, getLoadArgs } from '../src/utils.js';
import { platformSupport } from '../src/features.js';

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
 * @param item
 * @returns {boolean}
 */
function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Deep merge two objects.
 * @param target
 * @param sources
 */
function mergeDeep(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return mergeDeep(target, ...sources);
}

async function initCode() {
    const topLevelUrl = getTabUrl();
    const processedConfig = generateConfig();

    // mock Messaging and allow for tests to intercept them
    globalThis.cssMessaging = processedConfig.messagingConfig = new TestTransportConfig({
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
            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
            const merged = mergeDeep(processedConfig, evt.detail);
            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
            window.__testContentScopeArgs = merged;
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
    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
    window.__content_scope_status = status;
}

initCode();
