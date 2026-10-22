import { TestTransportConfig } from '@duckduckgo/messaging';

/**
 * @typedef {import('../../release-notes/types/release-notes.ts').UpdateMessage} UpdateMessage
 */

const url = new URL(window.location.href);

/**
 * Demo only: progress shared with the New Tab Page's setup checklist through localStorage
 * (both pages are served from the same origin in the integration build).
 */
const SETUP_DEMO_KEY = 'ddg-setup-demo-done';
const ROW_TO_CHECKLIST = {
    'default-browser': 'defaultBrowser',
    dock: 'taskbar',
    import: 'import',
    bookmarks: 'bookmarksBar',
    'session-restore': 'sessionRestore',
    'home-shortcut': 'homeButton',
};

/** @returns {string[]} */
function readSetupDone() {
    try {
        return JSON.parse(localStorage.getItem(SETUP_DEMO_KEY) || '[]');
    } catch {
        return [];
    }
}

/**
 * @param {string} rowId
 * @param {boolean} enabled
 */
function markSetupRow(rowId, enabled) {
    const item = ROW_TO_CHECKLIST[rowId];
    if (!item) return;
    const done = readSetupDone().filter((id) => id !== item);
    if (enabled) done.push(item);
    localStorage.setItem(SETUP_DEMO_KEY, JSON.stringify(done));
}

function goToNewTabPage() {
    const ntp = new URL('../new-tab/', window.location.href);
    ntp.searchParams.set('platform', url.searchParams.get('platform') || 'windows');
    ntp.searchParams.set('rebrand', 'enabled');
    ntp.searchParams.set('setup-checklist', '');
    ntp.searchParams.set('favorites', '6');
    document.body.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 450, easing: 'ease-in', fill: 'forwards' });
    setTimeout(() => window.location.assign(ntp.href), 450);
}

// A normal (non-resumed) start begins the demo story from scratch
if (!url.searchParams.has('resume')) {
    localStorage.removeItem(SETUP_DEMO_KEY);
}

export function mockTransport() {
    if (typeof window !== 'undefined' && window.__playwright_01) {
        window.__playwright_01.publishSubscriptionEvent = (/** @type {{ subscriptionName: string; params?: unknown }} */ evt) => {
            window.__playwright_01?.subscriptions
                ?.get(evt.subscriptionName)
                ?.forEach((/** @type {(data: unknown) => void} */ cb) => cb(evt.params));
        };
    }
    return new TestTransportConfig({
        notify(_msg) {
            window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) });
            const msg = /** @type {any} */ (_msg);
            switch (msg.method) {
                case 'finishLater': {
                    // Demo story: the default browser was set before leaving
                    markSetupRow('default-browser', true);
                    goToNewTabPage();
                    break;
                }
                case 'dismissToAddressBar': {
                    if (url.searchParams.has('resume')) goToNewTabPage();
                    break;
                }
                case 'setBookmarksBar':
                    markSetupRow('bookmarks', msg.params?.enabled);
                    break;
                case 'setSessionRestore':
                    markSetupRow('session-restore', msg.params?.enabled);
                    break;
                case 'setShowHomeButton':
                    markSetupRow('home-shortcut', msg.params?.enabled);
                    break;
                default: {
                    console.warn('unhandled notification', msg);
                }
            }
        },
        request(_msg) {
            window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) });
            const msg = /** @type {any} */ (_msg);
            switch (msg.method) {
                case 'init': {
                    const stepDefinitions = {};

                    const adBlocking = url.searchParams.get('adBlocking');
                    if (adBlocking === 'placebo' || adBlocking === 'aggressive' || adBlocking === 'youtube') {
                        stepDefinitions.systemSettings = {
                            id: 'systemSettings',
                            kind: 'settings',
                            rows: ['dock', 'import', `${adBlocking}-ad-blocking`],
                        };
                    }

                    const dockVariant = url.searchParams.get('dock');
                    if (dockVariant === 'instructions') {
                        const existing = stepDefinitions.systemSettings;
                        const rows = existing ? [...existing.rows] : ['dock', 'import'];
                        // replace 'dock' with 'dock-instructions'
                        const dockIndex = rows.indexOf('dock');
                        if (dockIndex !== -1) {
                            rows[dockIndex] = 'dock-instructions';
                        }
                        stepDefinitions.systemSettings = {
                            id: 'systemSettings',
                            kind: 'settings',
                            rows,
                        };
                    }

                    const chromeExtension = url.searchParams.get('chromeExtension');
                    if (chromeExtension === 'true') {
                        stepDefinitions.getStarted = {
                            id: 'getStarted',
                            kind: 'info',
                            options: ['chrome-extension-install'],
                        };
                    }

                    const duckPlayerVariant = url.searchParams.get('duckPlayer');
                    if (duckPlayerVariant === 'ad-free') {
                        stepDefinitions.duckPlayerSingle = {
                            id: 'duckPlayerSingle',
                            kind: 'info',
                            variant: 'ad-free',
                        };
                    }

                    const resume = url.searchParams.has('resume')
                        ? {
                              done: Object.entries(ROW_TO_CHECKLIST)
                                  .filter(([, item]) => readSetupDone().includes(item))
                                  .map(([row]) => row),
                          }
                        : undefined;

                    return Promise.resolve({
                        stepDefinitions,
                        exclude: [],
                        locale: 'en',
                        env: 'development',
                        resume,
                    });
                }
                case 'requestImport':
                case 'requestSetAsDefault':
                case 'requestDockOptIn': {
                    const row = { requestImport: 'import', requestSetAsDefault: 'default-browser', requestDockOptIn: 'dock' }[msg.method];
                    markSetupRow(row, true);
                    return Promise.resolve({
                        enabled: true,
                    });
                }
                default:
                    return Promise.resolve(null);
            }
        },
        subscribe(_msg, callback) {
            window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) });
            if (!window.__playwright_01) {
                return () => {};
            }
            const msg = /** @type {{ method?: string; subscriptionName?: string }} */ (_msg);
            const name = typeof _msg === 'string' ? _msg : (msg.subscriptionName ?? msg.method ?? 'onConfigUpdate');
            if (!window.__playwright_01.subscriptions) {
                window.__playwright_01.subscriptions = new Map();
            }
            if (!window.__playwright_01.subscriptions.has(name)) {
                window.__playwright_01.subscriptions.set(name, new Set());
            }
            window.__playwright_01.subscriptions.get(name)?.add(callback);
            return () => {
                window.__playwright_01?.subscriptions?.get(name)?.delete(callback);
            };
        },
    });
}
