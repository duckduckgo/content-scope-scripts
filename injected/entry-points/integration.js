import { load, init } from '../src/content-scope-features.js';
import { isTrackerOrigin } from '../src/trackers';
import { TestTransportConfig } from '../../messaging/index.js';
function getTopLevelURL() {
    try {
        // FROM: https://stackoverflow.com/a/7739035/73479
        // FIX: Better capturing of top level URL so that trackers in embedded documents are not considered first party
        if (window.location !== window.parent.location) {
            return new URL(window.location.href !== 'about:blank' ? document.referrer : window.parent.location.href);
        } else {
            return new URL(window.location.href);
        }
    } catch (error) {
        return new URL(location.href);
    }
}

function generateConfig() {
    const topLevelUrl = getTopLevelURL();
    const trackerLookup = import.meta.trackerLookup;
    return {
        debug: false,
        sessionKey: 'randomVal',
        platform: {
            name: 'extension',
        },
        site: {
            domain: topLevelUrl.hostname,
            isBroken: false,
            allowlisted: false,
            enabledFeatures: ['apiManipulation', 'fingerprintingCanvas', 'fingerprintingScreenSize', 'navigatorInterface', 'cookie'],
        },
        featureSettings: {
            apiManipulation: {
                apiChanges: {
                    'Navigator.prototype.bloop': {
                        type: 'descriptor',
                        value: {
                            type: 'function',
                            functionName: 'debug'
                        }
                    },
                    'Navigator.prototype.bloop2': {
                        type: 'descriptor',
                        define: true,
                        value: {
                            type: 'function',
                            functionName: 'debug'
                        }
                    },
                    'Navigator.prototype.bloop3': {
                        type: 'descriptor',
                        define: true,
                        getterValue: {
                            type: 'number',
                            value: 1222
                        }
                    },
                    'Navigator.prototype.joinAdInterestGroup': {
                        type: 'remove',
                    },
                    'Navigator.prototype.leaveAdInterestGroup': {
                        type: 'remove',
                    },
                    'Navigator.prototype.clearOriginJoinedAdInterestGroups': {
                        type: 'remove',
                    },
                    'Navigator.prototype.updateAdInterestGroups': {
                        type: 'remove',
                    },
                    'Navigator.prototype.createAuctionNonce': {
                        type: 'remove',
                    },
                    'Navigator.prototype.runAdAuction': {
                        type: 'remove',
                    },
                    'Navigator.prototype.adAuctionComponents': {
                        type: 'remove',
                    },
                    'Navigator.prototype.deprecatedURNToURL': {
                        type: 'remove',
                    },
                    'Navigator.prototype.deprecatedReplaceInURN': {
                        type: 'remove',
                    },
                    'Navigator.prototype.getInterestGroupAdAuctionData': {
                        type: 'remove',
                    },
                    'Navigator.prototype.createAdRequest': {
                        type: 'remove',
                    },
                    'Navigator.prototype.finalizeAd': {
                        type: 'remove',
                    },
                    'Navigator.prototype.canLoadAdAuctionFencedFrame': {
                        type: 'remove',
                    },
                    'Navigator.prototype.deprecatedRunAdAuctionEnforcesKAnonymity': {
                        type: 'remove',
                    },
                    'Navigator.prototype.protectedAudience': {
                        type: 'descriptor',
                        getterValue: {
                            type: 'undefined',
                        },
                    },
                },
            },
        },
        trackerLookup,
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
    const topLevelUrl = getTopLevelURL();
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
    load({
        // @ts-expect-error Types of property 'name' are incompatible.
        platform: processedConfig.platform,
        trackerLookup: processedConfig.trackerLookup,
        documentOriginIsTracker: isTrackerOrigin(processedConfig.trackerLookup),
        site: processedConfig.site,
        messagingConfig: processedConfig.messagingConfig,
    });

    // mark this phase as loaded
    setStatus('loaded');

    if (!topLevelUrl.searchParams.has('wait-for-init-args')) {
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
            // init features
            await init(merged);

            // set status to initialized so that tests can resume
            setStatus('initialized');
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
