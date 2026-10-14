import PasskeyRequestGuard from '../src/features/passkey-request-guard.js';
import WebCompat from '../src/features/web-compat.js';

/**
 * @typedef {object} NativeCall
 * @property {'conditional' | 'modal' | 'create'} kind
 * @property {any} options
 * @property {AbortSignal | undefined} signal
 * @property {boolean} conditionalPendingAtStart - whether an earlier conditional call was still un-aborted
 * @property {(value: any) => void} resolve
 */

/** @param {number} ms */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Builds a fake `CredentialsContainer` whose `get`/`create` record each call and stay pending until the
 * test resolves them, or until their signal aborts (unless `publicKey.ignoreAbort` is set).
 */
function makeFakeCredentialsApi() {
    /** @type {NativeCall[]} */
    const calls = [];

    /**
     * @param {'conditional' | 'modal' | 'create'} kind
     * @param {any} options
     */
    function record(kind, options) {
        if (options?.publicKey?.throwSync) {
            throw new TypeError('sync failure');
        }
        const signal = options?.signal;
        const conditionalPendingAtStart = calls.some((call) => call.kind === 'conditional' && !call.signal?.aborted);
        return new Promise((resolve, reject) => {
            calls.push({ kind, options, signal, conditionalPendingAtStart, resolve });
            if (signal && !options.publicKey?.ignoreAbort) {
                if (signal.aborted) {
                    reject(signal.reason);
                    return;
                }
                signal.addEventListener('abort', () => reject(signal.reason), { once: true });
            }
        });
    }

    function CredentialsContainer() {}
    CredentialsContainer.prototype.get = function get(/** @type {any} */ options) {
        return record(options?.mediation === 'conditional' ? 'conditional' : 'modal', options);
    };
    CredentialsContainer.prototype.create = function create(/** @type {any} */ options) {
        return record('create', options);
    };

    return { CredentialsContainer, credentials: Object.create(CredentialsContainer.prototype), calls };
}

describe('PasskeyRequestGuard', () => {
    let originalCredentialsContainer;
    let originalAddEventListener;
    /** @type {EventTarget} */
    let windowEvents;
    /** @type {any} */
    let credentials;
    /** @type {NativeCall[]} */
    let calls;
    let originalNavigator;
    /** @type {{ name: string, params: any }[]} */
    let passkeyDetectionMessages;

    beforeEach(() => {
        originalCredentialsContainer = globalThis.CredentialsContainer;
        originalAddEventListener = globalThis.addEventListener;
        originalNavigator = globalThis.navigator;

        const api = makeFakeCredentialsApi();
        globalThis.CredentialsContainer = /** @type {any} */ (api.CredentialsContainer);
        credentials = api.credentials;
        calls = api.calls;
        windowEvents = new EventTarget();
        globalThis.addEventListener = windowEvents.addEventListener.bind(windowEvents);
        Object.defineProperty(globalThis, 'navigator', { value: { credentials }, configurable: true, writable: true });

        // The apple bundle initialises webCompat before this feature, so its passkey detection wraps the
        // native methods first and only observes requests the guard lets through.
        const webCompat = new WebCompat(
            'webCompat',
            undefined,
            {},
            {
                site: { domain: 'example.com', url: 'https://example.com' },
                platform: {},
                featureSettings: { webCompat: { passkeyDetection: 'enabled' } },
                bundledConfig: undefined,
                messagingContextName: 'test',
            },
        );
        passkeyDetectionMessages = [];
        // @ts-expect-error - partial mock: only notify is needed
        webCompat._messaging = {
            notify: (/** @type {string} */ name, /** @type {any} */ params) => {
                if (name !== 'addDebugFlag') {
                    passkeyDetectionMessages.push({ name, params });
                }
            },
        };
        webCompat.init();

        const feature = new PasskeyRequestGuard(
            'passkeyRequestGuard',
            {},
            {},
            {
                site: { domain: 'example.com', url: 'https://example.com' },
                platform: {},
                bundledConfig: undefined,
                messagingContextName: 'test',
            },
        );
        // @ts-expect-error - partial mock: wrapMethod reports a debug flag the first time a wrapper runs
        feature._messaging = { notify: () => {} };
        feature.init();
        background = [];
    });

    afterEach(() => {
        globalThis.CredentialsContainer = originalCredentialsContainer;
        globalThis.addEventListener = originalAddEventListener;
        Object.defineProperty(globalThis, 'navigator', { value: originalNavigator, configurable: true, writable: true });
    });

    const conditional = (/** @type {any} */ extra = {}) => credentials.get({ mediation: 'conditional', publicKey: {}, ...extra });
    const modal = (/** @type {any} */ publicKey = {}) => credentials.get({ publicKey });
    /**
     * Resolves with the name of the error the request rejects with, or null if it fulfils.
     * @param {Promise<unknown>} promise
     */
    const errorName = async (promise) => {
        try {
            await promise;
            return null;
        } catch (e) {
            return /** @type {Error} */ (e).name;
        }
    };
    /** @type {Promise<void>[]} */
    let background = [];
    /**
     * Lets a request run in the background, recording its error name in `errors` if given.
     * @param {Promise<unknown>} promise
     * @param {string[]} [errors]
     */
    const start = (promise, errors) => {
        background.push(
            (async () => {
                const name = await errorName(promise);
                if (name && errors) {
                    errors.push(name);
                }
            })(),
        );
    };

    describe('when the page is hidden', () => {
        it('aborts the pending conditional request', () => {
            start(conditional());
            windowEvents.dispatchEvent(new Event('pagehide'));

            expect(calls[0].signal?.aborted).toBeTrue();
        });

        it('rejects new conditional requests without reaching native', async () => {
            windowEvents.dispatchEvent(new Event('pagehide'));

            expect(await errorName(conditional())).toBe('AbortError');
            expect(calls.length).toBe(0);
        });

        it('allows conditional requests again once the page is shown', () => {
            windowEvents.dispatchEvent(new Event('pagehide'));
            windowEvents.dispatchEvent(new Event('pageshow'));
            start(conditional());

            expect(calls.length).toBe(1);
        });
    });

    describe('when a modal request starts', () => {
        it('aborts the pending conditional request before a modal get reaches native', async () => {
            start(conditional());
            start(modal());
            await wait(50);

            expect(calls.map((call) => call.kind)).toEqual(['conditional', 'modal']);
            expect(calls[1].conditionalPendingAtStart).toBeFalse();
        });

        it('aborts the pending conditional request before a create reaches native', async () => {
            start(conditional());
            start(credentials.create({ publicKey: {} }));
            await wait(50);

            expect(calls.map((call) => call.kind)).toEqual(['conditional', 'create']);
            expect(calls[1].conditionalPendingAtStart).toBeFalse();
        });

        it('holds a conditional request the page restarts until the modal request settles', async () => {
            start(
                (async () => {
                    if (await errorName(conditional())) {
                        start(conditional());
                    }
                })(),
            );
            start(modal());
            await wait(50);
            const kindsWhileModalPending = calls.map((call) => call.kind);
            calls[1].resolve(null);
            await wait(50);

            expect(kindsWhileModalPending).toEqual(['conditional', 'modal']);
            expect(calls.map((call) => call.kind)).toEqual(['conditional', 'modal', 'conditional']);
        });

        it('proceeds after one second when the conditional request ignores the abort', async () => {
            start(conditional({ publicKey: { ignoreAbort: true } }));
            const startedAt = Date.now();
            start(modal());
            while (calls.length < 2) {
                await wait(20);
            }
            const firstWait = Date.now() - startedAt;
            start(modal());

            expect(firstWait).toBeGreaterThanOrEqual(900);
            expect(calls.length).toBe(3);
        });

        it('returns the native promise when there is nothing to wait for', () => {
            const result = modal();

            expect(calls.length).toBe(1);
            expect(result).toBeInstanceOf(Promise);
        });

        it('rejects instead of throwing when native throws synchronously', async () => {
            expect(await errorName(modal({ throwSync: true }))).toBe('TypeError');
            start(conditional());
            expect(calls.length).toBe(1);
        });
    });

    describe('when a second conditional request starts', () => {
        it('rejects it without reaching native and leaves the first one pending', async () => {
            start(conditional());

            expect(await errorName(conditional())).toBe('NotAllowedError');
            expect(calls.length).toBe(1);
            expect(calls[0].signal?.aborted).toBeFalse();
        });

        it('does not report the rejection to passkey detection', async () => {
            start(conditional());
            await errorName(conditional());
            await wait(0);

            expect(passkeyDetectionMessages).toEqual([]);
        });

        it('starts it when the page aborts the previous one in the same task', async () => {
            /** @type {string[]} */
            const errors = [];
            /** @type {AbortController | null} */
            let previous = null;
            for (let i = 0; i < 3; i++) {
                const controller = new AbortController();
                start(conditional({ signal: controller.signal }), errors);
                previous?.abort();
                previous = controller;
                await wait(50);
            }

            expect(calls.length).toBe(3);
            expect(errors).toEqual(['AbortError', 'AbortError']);
        });

        it('starts it when the page aborted the previous one earlier', async () => {
            /** @type {string[]} */
            const errors = [];
            for (let i = 0; i < 3; i++) {
                const controller = new AbortController();
                start(conditional({ signal: controller.signal }), errors);
                await wait(20);
                controller.abort();
            }
            await wait(50);

            expect(calls.length).toBe(3);
            expect(errors).toEqual(['AbortError', 'AbortError', 'AbortError']);
        });
    });

    describe('page signals', () => {
        it('forwards the page abort with its reason', async () => {
            const controller = new AbortController();
            const request = conditional({ signal: controller.signal });
            controller.abort('page reason');

            await expectAsync(request).toBeRejectedWith('page reason');
            expect(calls[0].signal).not.toBe(controller.signal);
        });

        it('rejects a held request as soon as the page aborts it', async () => {
            start(modal());
            const controller = new AbortController();
            const request = conditional({ signal: controller.signal });
            controller.abort();

            expect(await errorName(request)).toBe('AbortError');
            expect(calls.length).toBe(1);
        });

        it('passes an already-aborted request through and leaves the pending one alone', async () => {
            start(conditional());
            const options = { mediation: 'conditional', signal: AbortSignal.abort(), publicKey: {} };
            await errorName(credentials.get(options));

            expect(calls[0].signal?.aborted).toBeFalse();
            expect(calls[1].options).toBe(options);
        });
    });

    describe('pass-through', () => {
        it('passes requests without publicKey through unchanged', () => {
            const options = { password: true, mediation: 'conditional' };
            start(credentials.get(options));

            expect(calls[0].options).toBe(options);
        });

        it('passes requests with a non-AbortSignal signal through unchanged', () => {
            const options = { mediation: 'conditional', publicKey: {}, signal: {} };
            start(credentials.get(options));

            expect(calls[0].options).toBe(options);
        });

        it('keeps the page options visible to native', () => {
            const publicKey = { challenge: 'x' };
            start(conditional({ publicKey }));

            expect(calls[0].options.publicKey).toBe(publicKey);
            expect(calls[0].options.mediation).toBe('conditional');
        });
    });
});
