import WebCompat from '../src/features/web-compat.js';
import AutofillPasskeys from '../src/features/autofill-passkeys.js';

/**
 * Flush pending microtasks so fire-and-forget promise chains (e.g. the passkey
 * detection observer) have a chance to run before assertions.
 */
async function flushMicrotasks() {
    await Promise.resolve();
    await Promise.resolve();
}

/**
 * Builds a fake `CredentialsContainer` global + `navigator.credentials` instance
 * whose `get`/`create` methods resolve/reject with configurable values, so tests
 * can control the outcome of a "credential ceremony" without any real WebAuthn API.
 * @param {{
 *   get?: (options: any) => Promise<any>,
 *   create?: (options: any) => Promise<any>,
 * }} [impl]
 */
function makeFakeCredentialsApi(impl = {}) {
    const { get: getImpl = () => Promise.resolve(null), create: createImpl = () => Promise.resolve(null) } = impl;

    function CredentialsContainer() {}
    // Named function expressions so `name`/`length` are meaningful, mirroring the real
    // native methods that we assert the wrapper stays indistinguishable from.
    CredentialsContainer.prototype.get = function get(options) {
        return getImpl(options);
    };
    CredentialsContainer.prototype.create = function create(options) {
        return createImpl(options);
    };

    const credentialsInstance = Object.create(CredentialsContainer.prototype);
    return { CredentialsContainer, credentialsInstance };
}

/**
 * Node defines a read-only `globalThis.navigator` accessor, so plain assignment
 * (`globalThis.navigator = ...`) throws. Use `defineProperty` to override it for a test.
 * @param {object} value
 */
function setGlobalNavigator(value) {
    Object.defineProperty(globalThis, 'navigator', { value, configurable: true, writable: true });
}

/**
 * Thin, loosely-typed helpers so tests can pass arbitrary (including deliberately
 * invalid/minimal) options without fighting the real `CredentialRequestOptions`/
 * `PublicKeyCredentialCreationOptions` TS types.
 * @param {any} [options]
 */
function credentialsGet(options) {
    return /** @type {any} */ (navigator.credentials).get(options);
}

/** @param {any} [options] */
function credentialsCreate(options) {
    return /** @type {any} */ (navigator.credentials).create(options);
}

describe('WebCompat passkey detection', () => {
    let originalNavigator;
    let originalCredentialsContainer;
    let originalIsSecureContext;

    beforeEach(() => {
        originalNavigator = globalThis.navigator;
        originalCredentialsContainer = globalThis.CredentialsContainer;
        originalIsSecureContext = globalThis.isSecureContext;
        globalThis.isSecureContext = true;
    });

    afterEach(() => {
        setGlobalNavigator(originalNavigator);
        globalThis.CredentialsContainer = originalCredentialsContainer;
        globalThis.isSecureContext = originalIsSecureContext;
    });

    /**
     * @param {{
     *   settingEnabled?: boolean,
     *   get?: (options: any) => Promise<any>,
     *   create?: (options: any) => Promise<any>,
     *   features?: Record<string, any>,
     * }} [options]
     */
    function createInstance({ settingEnabled = true, get, create, features = {} } = {}) {
        const { CredentialsContainer, credentialsInstance } = makeFakeCredentialsApi({ get, create });
        globalThis.CredentialsContainer = /** @type {any} */ (CredentialsContainer);
        setGlobalNavigator({ credentials: credentialsInstance });

        const args = {
            site: { domain: 'example.com', url: 'https://example.com' },
            platform: {},
            featureSettings: {
                webCompat: {
                    passkeyDetection: settingEnabled ? 'enabled' : 'disabled',
                },
            },
            bundledConfig: undefined,
            messagingContextName: 'test',
        };
        const webCompat = new WebCompat('webCompat', undefined, features, args);

        /** @type {{ name: string, params: any }[]} */
        const notified = [];
        // @ts-expect-error - partial mock: only notify is needed for these tests
        webCompat._messaging = {
            // `addDebugFlag` is fired automatically by the wrapMethod/defineProperty machinery
            // the first time a wrapped method is called - unrelated to passkey detection itself.
            notify: (/** @type {string} */ name, /** @type {any} */ params) => {
                if (name === 'addDebugFlag') return;
                notified.push({ name, params });
            },
        };

        webCompat.init();
        return { webCompat, notified, credentialsInstance, args, features };
    }

    describe('when passkeyDetection is enabled', () => {
        it('returns the exact resolved credential unchanged (get)', async () => {
            const expectedCredential = { type: 'public-key', id: 'abc' };
            createInstance({ get: () => Promise.resolve(expectedCredential) });

            const result = await credentialsGet({ publicKey: {} });

            expect(result).toBe(expectedCredential);
        });

        it('notifies native when get() resolves with a public-key credential', async () => {
            const credential = { type: 'public-key', id: 'abc' };
            const { notified } = createInstance({ get: () => Promise.resolve(credential) });

            await credentialsGet({ publicKey: { challenge: 'x' } });
            await flushMicrotasks();

            expect(notified).toEqual([{ name: 'passkeyUsed', params: { type: 'get' } }]);
        });

        it('notifies native when create() resolves with a public-key credential', async () => {
            const credential = { type: 'public-key', id: 'new-cred' };
            const { notified } = createInstance({ create: () => Promise.resolve(credential) });

            await credentialsCreate({ publicKey: { challenge: 'x' } });
            await flushMicrotasks();

            expect(notified).toEqual([{ name: 'passkeyUsed', params: { type: 'create' } }]);
        });

        it('does not notify for a plain (non-WebAuthn) credentials.get() call', async () => {
            const credential = { type: 'password' };
            const { notified } = createInstance({ get: () => Promise.resolve(credential) });

            await credentialsGet({ password: true });
            await flushMicrotasks();

            expect(notified).toEqual([]);
        });

        it('does not notify when get() is called with no options at all', async () => {
            const { notified } = createInstance({ get: () => Promise.resolve(null) });

            await credentialsGet();
            await flushMicrotasks();

            expect(notified).toEqual([]);
        });

        it('does not notify when the credential resolves to null (e.g. conditional UI with nothing selected)', async () => {
            const { notified } = createInstance({ get: () => Promise.resolve(null) });

            await credentialsGet({ publicKey: {} });
            await flushMicrotasks();

            expect(notified).toEqual([]);
        });

        it('notifies native with passkeyFailed and a sanitized error when the ceremony rejects', async () => {
            const { notified } = createInstance({
                get: () => Promise.reject(new DOMException('The operation is not allowed.', 'NotAllowedError')),
            });

            await expectAsync(credentialsGet({ publicKey: {} })).toBeRejected();
            await flushMicrotasks();

            expect(notified).toEqual([{ name: 'passkeyFailed', params: { type: 'get', error: 'NotAllowedError' } }]);
        });

        it('forwards a NotReadableError (platform/credential-manager failure) verbatim', async () => {
            const { notified } = createInstance({
                create: () => Promise.reject(new DOMException('credential manager error', 'NotReadableError')),
            });

            await expectAsync(credentialsCreate({ publicKey: {} })).toBeRejected();
            await flushMicrotasks();

            expect(notified).toEqual([{ name: 'passkeyFailed', params: { type: 'create', error: 'NotReadableError' } }]);
        });

        it("reports an unknown error name as 'Other'", async () => {
            const { notified } = createInstance({ get: () => Promise.reject(new Error('cancelled')) });

            await expectAsync(credentialsGet({ publicKey: {} })).toBeRejected();
            await flushMicrotasks();

            expect(notified).toEqual([{ name: 'passkeyFailed', params: { type: 'get', error: 'Other' } }]);
        });

        it("reports a non-Error rejection as 'Other' without leaking its value", async () => {
            const { notified } = createInstance({
                // eslint-disable-next-line prefer-promise-reject-errors -- deliberately a non-Error rejection
                get: () => Promise.reject('a raw string with details'),
            });

            await expectAsync(credentialsGet({ publicKey: {} })).toBeRejected();
            await flushMicrotasks();

            expect(notified).toEqual([{ name: 'passkeyFailed', params: { type: 'get', error: 'Other' } }]);
        });

        it("reports a rejection with a throwing name getter as 'Other'", async () => {
            const rejection = Object.defineProperty({}, 'name', {
                get() {
                    throw new Error('page-controlled getter');
                },
            });
            const { notified } = createInstance({
                get: () => Promise.reject(rejection),
            });

            await expectAsync(credentialsGet({ publicKey: {} })).toBeRejected();
            await flushMicrotasks();

            expect(notified).toEqual([{ name: 'passkeyFailed', params: { type: 'get', error: 'Other' } }]);
        });

        it('never includes an error field on a successful ceremony', async () => {
            const { notified } = createInstance({ get: () => Promise.resolve({ type: 'public-key', id: 'abc' }) });

            await credentialsGet({ publicKey: {} });
            await flushMicrotasks();

            expect(notified).toEqual([{ name: 'passkeyUsed', params: { type: 'get' } }]);
            expect('error' in notified[0].params).toBe(false);
            expect('success' in notified[0].params).toBe(false);
        });

        it('propagates rejection to the page unchanged', async () => {
            const error = new DOMException('The operation was aborted.', 'AbortError');
            createInstance({ get: () => Promise.reject(error) });

            await expectAsync(credentialsGet({ publicKey: {} })).toBeRejectedWith(error);
        });

        it('keeps name/length/toString indistinguishable from the unwrapped method', () => {
            const { credentialsInstance } = createInstance();
            const proto = Object.getPrototypeOf(credentialsInstance);

            // The fake methods are declared as `function get(options)` / `function create(options)`,
            // so an unwrapped implementation reports name 'get'/'create' and length 1. A bare
            // wrapper would report '' and 0, which is exactly the tamper signal sites look for.
            for (const methodName of ['get', 'create']) {
                expect(proto[methodName].name).toBe(methodName);
                expect(proto[methodName].length).toBe(1);
                expect(proto[methodName].toString()).toContain(`function ${methodName}(options)`);
            }
        });

        it('keeps get identity when the Windows autofillPasskeys wrapper is installed afterward', () => {
            /** @type {Record<string, any>} */
            const features = {};
            const { credentialsInstance, args } = createInstance({ features });
            const proto = Object.getPrototypeOf(credentialsInstance);
            const nativeToString = proto.get.toString();
            features.autofillPasskeys = new AutofillPasskeys('autofillPasskeys', undefined, features, args);

            features.autofillPasskeys.init();

            expect(proto.get.name).toBe('get');
            expect(proto.get.length).toBe(1);
            expect(proto.get.toString()).toBe(nativeToString);
        });

        it('keeps non-conditional get behavior and detection when Windows autofillPasskeys is outermost', async () => {
            const credential = { type: 'public-key', id: 'abc' };
            /** @type {Record<string, any>} */
            const features = {};
            const { notified, args } = createInstance({ features, get: () => Promise.resolve(credential) });
            const autofillPasskeys = new AutofillPasskeys('autofillPasskeys', undefined, features, args);
            // @ts-expect-error - partial mock: only notify is needed for the debug flag
            autofillPasskeys._messaging = { notify() {} };
            features.autofillPasskeys = autofillPasskeys;
            autofillPasskeys.init();

            const result = await credentialsGet({ mediation: 'required', publicKey: {} });
            await flushMicrotasks();

            expect(result).toBe(credential);
            expect(notified).toEqual([{ name: 'passkeyUsed', params: { type: 'get' } }]);
        });

        it('detects the narrowed native call after Windows conditional passkey selection', async () => {
            const credential = { type: 'public-key', id: 'selected' };
            /** @type {Record<string, any>} */
            const features = {};
            const { notified, args } = createInstance({ features, get: () => Promise.resolve(credential) });
            const autofillPasskeys = new AutofillPasskeys('autofillPasskeys', undefined, features, args);
            /** @type {((data: { requestId: string, credentialId: string }) => void) | undefined} */
            let selectedHandler;
            // @ts-expect-error - partial messaging mock for the conditional selection round trip
            autofillPasskeys._messaging = {
                subscribe: (_name, handler) => {
                    selectedHandler = handler;
                    return () => {};
                },
                notify: (_name, params) => {
                    if (!params) throw new Error('Expected registerPasskeyRequest params');
                    queueMicrotask(() => selectedHandler?.({ requestId: params.requestId, credentialId: 'AQ==' }));
                },
            };
            features.autofillPasskeys = autofillPasskeys;
            autofillPasskeys.init();

            const result = await credentialsGet({
                mediation: 'conditional',
                publicKey: { challenge: new Uint8Array([1]) },
            });
            await flushMicrotasks();

            expect(result).toBe(credential);
            expect(notified).toEqual([{ name: 'passkeyUsed', params: { type: 'get' } }]);
        });

        it('never includes nativeData in the notification params', async () => {
            const credential = { type: 'public-key', id: 'abc' };
            const { notified } = createInstance({ get: () => Promise.resolve(credential) });

            await credentialsGet({ publicKey: {} });
            await flushMicrotasks();

            expect(notified.length).toBe(1);
            expect('nativeData' in notified[0].params).toBe(false);
        });
    });

    describe('when passkeyDetection is disabled', () => {
        it('does not wrap navigator.credentials.get at all', () => {
            const { credentialsInstance } = createInstance({
                settingEnabled: false,
                get: () => Promise.resolve({ type: 'public-key' }),
            });

            const originalGet = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(credentialsInstance), 'get')?.value;
            expect(navigator.credentials.get).toBe(originalGet);
        });

        it('never notifies native', async () => {
            const { notified } = createInstance({
                settingEnabled: false,
                get: () => Promise.resolve({ type: 'public-key' }),
            });

            await credentialsGet({ publicKey: {} });
            await flushMicrotasks();

            expect(notified).toEqual([]);
        });
    });

    describe('environment guards', () => {
        it('is a no-op when CredentialsContainer is not a global (older WebViews)', () => {
            setGlobalNavigator({ credentials: { get: () => Promise.resolve(null) } });
            // @ts-expect-error - simulating an environment without the interface
            delete globalThis.CredentialsContainer;

            expect(() => {
                const args = {
                    site: { domain: 'example.com', url: 'https://example.com' },
                    platform: {},
                    featureSettings: { webCompat: { passkeyDetection: 'enabled' } },
                    bundledConfig: undefined,
                    messagingContextName: 'test',
                };
                new WebCompat('webCompat', undefined, {}, args).init();
            }).not.toThrow();
        });

        it('is a no-op when navigator.credentials is absent entirely', () => {
            setGlobalNavigator({});
            const { CredentialsContainer } = makeFakeCredentialsApi();
            globalThis.CredentialsContainer = /** @type {any} */ (CredentialsContainer);

            expect(() => {
                const args = {
                    site: { domain: 'example.com', url: 'https://example.com' },
                    platform: {},
                    featureSettings: { webCompat: { passkeyDetection: 'enabled' } },
                    bundledConfig: undefined,
                    messagingContextName: 'test',
                };
                new WebCompat('webCompat', undefined, {}, args).init();
            }).not.toThrow();
        });
    });
});
