import AutofillPasskeys from '../src/features/autofill-passkeys.js';
import { polyfillProcessGlobals } from './helpers/polyfill-process-globals.js';

/**
 * Race the given promise against a setTimeout-based sentinel so the assertion
 * actually proves the promise is still pending — not just that the
 * already-settled sentinel won the microtask race. Returns 'pending' iff the
 * promise hasn't settled within `timeoutMs`; otherwise resolves/rejects with
 * the promise's value/reason as `{ type, value }` / `{ type, reason }`.
 *
 * @template T
 * @param {Promise<T>} promise
 * @param {number} [timeoutMs]
 * @returns {Promise<'pending' | { type: 'resolved'; value: T } | { type: 'rejected'; reason: unknown }>}
 */
function settledOrPending(promise, timeoutMs = 50) {
    return Promise.race([
        promise.then(
            (value) => /** @type {const} */ ({ type: 'resolved', value }),
            (reason) => /** @type {const} */ ({ type: 'rejected', reason }),
        ),
        new Promise((resolve) => setTimeout(() => resolve('pending'), timeoutMs)),
    ]);
}

/**
 * @typedef {AutofillPasskeys & {
 *   _messaging: { notify: jasmine.Spy; subscribe: jasmine.Spy };
 *   emitPasskeySelected: (data: unknown) => void;
 *   unsubscribeSpy: jasmine.Spy;
 * }} TestAutofillPasskeysFeature
 */

describe('AutofillPasskeys', () => {
    /** @type {ReturnType<typeof polyfillProcessGlobals> | undefined} */
    let cleanupLocation;
    /** @type {PropertyDescriptor | undefined} */
    let originalNavigatorDescriptor;
    /** @type {PropertyDescriptor | undefined} */
    let originalCredentialsContainerDescriptor;
    /** @type {PropertyDescriptor | undefined} */
    let originalIsSecureContextDescriptor;
    /** @type {boolean} */
    let credentialsApiInstalled = false;

    /**
     * @param {PropertyDescriptor | undefined} previous
     * @param {string} name
     */
    function restoreGlobalProperty(previous, name) {
        if (previous) {
            Object.defineProperty(globalThis, name, previous);
            return;
        }
        Reflect.deleteProperty(globalThis, name);
    }

    /**
     * @returns {{ credentials: CredentialsContainer; MockCredentialsContainer: typeof CredentialsContainer }}
     */
    function installCredentialsApi() {
        class MockCredentialsContainer {
            get() {
                return Promise.resolve(null);
            }
        }

        const credentials = /** @type {CredentialsContainer} */ (/** @type {unknown} */ (new MockCredentialsContainer()));

        originalNavigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
        originalCredentialsContainerDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'CredentialsContainer');
        originalIsSecureContextDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'isSecureContext');

        Object.defineProperty(globalThis, 'CredentialsContainer', {
            value: /** @type {typeof CredentialsContainer} */ (/** @type {unknown} */ (MockCredentialsContainer)),
            configurable: true,
            writable: true,
        });
        Object.defineProperty(globalThis, 'navigator', {
            value: { credentials },
            configurable: true,
            writable: true,
        });
        Object.defineProperty(globalThis, 'isSecureContext', {
            value: true,
            configurable: true,
            writable: true,
        });

        credentialsApiInstalled = true;
        return {
            credentials,
            MockCredentialsContainer: /** @type {typeof CredentialsContainer} */ (/** @type {unknown} */ (MockCredentialsContainer)),
        };
    }

    function restoreCredentialsApi() {
        if (!credentialsApiInstalled) {
            return;
        }
        restoreGlobalProperty(originalNavigatorDescriptor, 'navigator');
        restoreGlobalProperty(originalCredentialsContainerDescriptor, 'CredentialsContainer');
        restoreGlobalProperty(originalIsSecureContextDescriptor, 'isSecureContext');
        credentialsApiInstalled = false;
    }

    /**
     * @param {object} [overrides]
     * @returns {TestAutofillPasskeysFeature}
     */
    function createFeature(overrides = {}) {
        /** @type {((data: unknown) => void) | undefined} */
        let passkeyHandler;
        const unsubscribe = jasmine.createSpy('unsubscribe');

        const mockMessaging = {
            notify: jasmine.createSpy('notify'),
            subscribe: jasmine.createSpy('subscribe').and.callFake((name, handler) => {
                if (name === 'passkeySelected') {
                    passkeyHandler = handler;
                }
                return unsubscribe;
            }),
        };

        const feature = new AutofillPasskeys(
            'autofillPasskeys',
            {},
            {},
            {
                site: {
                    domain: 'example.com',
                    url: 'https://example.com',
                },
                ...overrides,
            },
        );

        // @ts-expect-error inject mock messaging
        feature._messaging = mockMessaging;

        return /** @type {TestAutofillPasskeysFeature} */ (
            Object.assign(feature, {
                _messaging: mockMessaging,
                /** @param {unknown} data */
                emitPasskeySelected(data) {
                    passkeyHandler?.(data);
                },
                unsubscribeSpy: unsubscribe,
            })
        );
    }

    /**
     * @param {TestAutofillPasskeysFeature} feature
     */
    function expectNoPasskeyRegistration(feature) {
        const registered = feature._messaging.notify.calls.allArgs().some(([method]) => method === 'registerPasskeyRequest');
        expect(registered).withContext('registerPasskeyRequest notify').toBe(false);
    }

    /**
     * @param {Partial<CredentialRequestOptions> & { publicKey?: Partial<PublicKeyCredentialRequestOptions> }} [overrides]
     * @returns {CredentialRequestOptions & { publicKey: PublicKeyCredentialRequestOptions }}
     */
    function conditionalPasskeyOptions(overrides = {}) {
        const { publicKey: publicKeyOverrides, ...rest } = overrides;
        const publicKey = /** @type {PublicKeyCredentialRequestOptions} */ ({
            challenge: new Uint8Array([1, 2, 3]).buffer,
            timeout: 60_000,
            rpId: 'example.com',
            userVerification: 'preferred',
            extensions: {},
            ...publicKeyOverrides,
        });
        return {
            mediation: 'conditional',
            publicKey,
            ...rest,
        };
    }

    beforeEach(() => {
        cleanupLocation = polyfillProcessGlobals('https://example.com');
        Object.defineProperty(globalThis.location, 'hostname', {
            value: 'example.com',
            configurable: true,
        });
    });

    afterEach(() => {
        cleanupLocation?.();
        restoreCredentialsApi();
    });

    describe('registerPasskeyRequest', () => {
        it('notifies native with rpId and requestId for a conditional request', async () => {
            const feature = createFeature();
            const originalGet = jasmine.createSpy('originalGet').and.resolveTo(null);
            const receiver = /** @type {CredentialsContainer} */ ({});

            const promise = feature.registerPasskeyRequest(
                conditionalPasskeyOptions().publicKey,
                conditionalPasskeyOptions(),
                originalGet,
                receiver,
            );

            expect(feature._messaging.subscribe).toHaveBeenCalledWith('passkeySelected', jasmine.any(Function));
            expect(feature._messaging.notify).toHaveBeenCalledWith('registerPasskeyRequest', {
                rpId: 'example.com',
                requestId: jasmine.any(String),
            });

            const { requestId } = feature._messaging.notify.calls.mostRecent().args[1];
            feature.emitPasskeySelected({ credentialId: btoa('cred'), requestId });
            await promise;

            expect(originalGet).toHaveBeenCalled();
        });

        it('uses location.hostname when publicKey.rpId is not a string', async () => {
            const feature = createFeature();
            const originalGet = jasmine.createSpy('originalGet').and.resolveTo(null);
            const options = conditionalPasskeyOptions();
            options.publicKey = /** @type {PublicKeyCredentialRequestOptions} */ ({
                ...options.publicKey,
                rpId: /** @type {string} */ (/** @type {unknown} */ ({ toString: () => 'evil.com' })),
            });

            const promise = feature.registerPasskeyRequest(
                options.publicKey,
                options,
                originalGet,
                /** @type {CredentialsContainer} */ ({}),
            );
            const { requestId } = feature._messaging.notify.calls.mostRecent().args[1];
            feature.emitPasskeySelected({ credentialId: btoa('cred'), requestId });
            await promise;

            expect(feature._messaging.notify.calls.mostRecent().args[1].rpId).toBe('example.com');
        });

        it('narrows the native call with allowCredentials decoded from standard base64 credentialId', async () => {
            const feature = createFeature();
            const credentialBytes = new Uint8Array([10, 20, 30]);
            const originalGet = jasmine.createSpy('originalGet').and.resolveTo({ id: 'selected' });
            const receiver = /** @type {CredentialsContainer} */ ({});

            const promise = feature.registerPasskeyRequest(
                conditionalPasskeyOptions().publicKey,
                conditionalPasskeyOptions(),
                originalGet,
                receiver,
            );

            const { requestId } = feature._messaging.notify.calls.mostRecent().args[1];
            feature.emitPasskeySelected({ credentialId: btoa(String.fromCharCode(...credentialBytes)), requestId });
            await promise;

            const narrowed = originalGet.calls.mostRecent().args[0];
            expect(narrowed.publicKey.allowCredentials).toEqual([{ type: 'public-key', id: credentialBytes.buffer }]);
            expect(narrowed.publicKey.challenge).toEqual(conditionalPasskeyOptions().publicKey.challenge);
        });

        it('rejects the prior request when a second conditional request arrives', async () => {
            const feature = createFeature();
            const originalGet = jasmine.createSpy('originalGet').and.resolveTo(null);
            const receiver = /** @type {CredentialsContainer} */ ({});

            const first = feature.registerPasskeyRequest(
                conditionalPasskeyOptions().publicKey,
                conditionalPasskeyOptions(),
                originalGet,
                receiver,
            );
            const second = feature.registerPasskeyRequest(
                conditionalPasskeyOptions().publicKey,
                conditionalPasskeyOptions(),
                originalGet,
                receiver,
            );

            await expectAsync(first).toBeRejectedWithError(/superseded/);
            await expectAsync(second).toBePending();

            const { requestId } = feature._messaging.notify.calls.mostRecent().args[1];
            feature.emitPasskeySelected({ credentialId: btoa('cred'), requestId });
            await second;
        });

        it('rejects when the AbortSignal fires', async () => {
            const feature = createFeature();
            const controller = new AbortController();
            const originalGet = jasmine.createSpy('originalGet').and.resolveTo(null);
            const reason = new DOMException('user abort', 'AbortError');

            const promise = feature.registerPasskeyRequest(
                conditionalPasskeyOptions().publicKey,
                conditionalPasskeyOptions({ signal: controller.signal }),
                originalGet,
                /** @type {CredentialsContainer} */ ({}),
            );

            controller.abort(reason);
            await expectAsync(promise).toBeRejectedWith(reason);
            expect(feature.unsubscribeSpy).toHaveBeenCalled();
        });

        it('rejects immediately when the AbortSignal is already aborted', async () => {
            const feature = createFeature();
            const controller = new AbortController();
            controller.abort();
            const originalGet = jasmine.createSpy('originalGet').and.resolveTo(null);

            await expectAsync(
                feature.registerPasskeyRequest(
                    conditionalPasskeyOptions().publicKey,
                    conditionalPasskeyOptions({ signal: controller.signal }),
                    originalGet,
                    /** @type {CredentialsContainer} */ ({}),
                ),
            ).toBeRejectedWithError(/aborted/);
            expect(feature._messaging.notify).not.toHaveBeenCalled();
        });

        it('ignores passkeySelected payloads without a matching requestId', async () => {
            const feature = createFeature();
            const originalGet = jasmine.createSpy('originalGet').and.resolveTo(null);

            const promise = feature.registerPasskeyRequest(
                conditionalPasskeyOptions().publicKey,
                conditionalPasskeyOptions(),
                originalGet,
                /** @type {CredentialsContainer} */ ({}),
            );

            feature.emitPasskeySelected({ credentialId: btoa('cred'), requestId: 'wrong-id' });
            expect(await settledOrPending(promise)).toBe('pending');
            expect(originalGet).not.toHaveBeenCalled();
        });

        it('ignores malformed credentialId values', async () => {
            const feature = createFeature();
            const originalGet = jasmine.createSpy('originalGet').and.resolveTo(null);

            const promise = feature.registerPasskeyRequest(
                conditionalPasskeyOptions().publicKey,
                conditionalPasskeyOptions(),
                originalGet,
                /** @type {CredentialsContainer} */ ({}),
            );
            const { requestId } = feature._messaging.notify.calls.mostRecent().args[1];

            feature.emitPasskeySelected({ credentialId: '', requestId });
            feature.emitPasskeySelected({ credentialId: 123, requestId });
            expect(await settledOrPending(promise)).toBe('pending');
            expect(originalGet).not.toHaveBeenCalled();
        });

        it('rejects when credentialId is not valid base64', async () => {
            const feature = createFeature();
            const originalGet = jasmine.createSpy('originalGet').and.resolveTo(null);

            const promise = feature.registerPasskeyRequest(
                conditionalPasskeyOptions().publicKey,
                conditionalPasskeyOptions(),
                originalGet,
                /** @type {CredentialsContainer} */ ({}),
            );
            const { requestId } = feature._messaging.notify.calls.mostRecent().args[1];

            feature.emitPasskeySelected({ credentialId: '%%%not-base64%%%', requestId });
            await expectAsync(promise).toBeRejected();
            expect(originalGet).not.toHaveBeenCalled();
        });

        it('rejects when a publicKey field getter throws inside the returned promise', async () => {
            const feature = createFeature();
            const originalGet = jasmine.createSpy('originalGet').and.resolveTo(null);
            const publicKey = /** @type {PublicKeyCredentialRequestOptions} */ (
                /** @type {unknown} */ ({
                    get challenge() {
                        throw new TypeError('getter blew up');
                    },
                })
            );
            const options = /** @type {CredentialRequestOptions} */ ({
                mediation: 'conditional',
                publicKey,
            });

            await expectAsync(
                feature.registerPasskeyRequest(publicKey, options, originalGet, /** @type {CredentialsContainer} */ ({})),
            ).toBeRejectedWithError(/getter blew up/);
        });
    });

    describe('init credentials.get wrapper', () => {
        it('passes through non-conditional mediation to the original get', async () => {
            const { credentials } = installCredentialsApi();
            const feature = createFeature();
            const originalGet = spyOn(CredentialsContainer.prototype, 'get').and.resolveTo(null);

            feature.init();

            await navigator.credentials.get({
                mediation: 'optional',
                publicKey: conditionalPasskeyOptions().publicKey,
            });

            expect(originalGet).toHaveBeenCalled();
            expectNoPasskeyRegistration(feature);
            expect(credentials.get).not.toBe(originalGet);
        });

        it('passes through when publicKey is absent', async () => {
            installCredentialsApi();
            const feature = createFeature();
            const originalGet = spyOn(CredentialsContainer.prototype, 'get').and.resolveTo(null);

            feature.init();

            await navigator.credentials.get({ mediation: 'conditional' });
            expect(originalGet).toHaveBeenCalled();
            expectNoPasskeyRegistration(feature);
        });

        it('passes through in non-secure contexts', async () => {
            installCredentialsApi();
            Object.defineProperty(globalThis, 'isSecureContext', {
                value: false,
                configurable: true,
                writable: true,
            });
            const feature = createFeature();
            const originalGet = spyOn(CredentialsContainer.prototype, 'get').and.resolveTo(null);

            feature.init();

            await navigator.credentials.get(conditionalPasskeyOptions());
            expect(originalGet).toHaveBeenCalled();
            expectNoPasskeyRegistration(feature);
        });

        it('passes through when the receiver is not the navigator.credentials singleton', async () => {
            installCredentialsApi();
            const feature = createFeature();
            const originalGet = jasmine.createSpy('originalGet').and.resolveTo(null);
            const foreignCredentials = Object.create(CredentialsContainer.prototype);
            foreignCredentials.get = originalGet;

            feature.init();

            await foreignCredentials.get(conditionalPasskeyOptions());
            expect(originalGet).toHaveBeenCalled();
            expectNoPasskeyRegistration(feature);
        });

        it('intercepts conditional passkey requests on the navigator.credentials singleton', async () => {
            installCredentialsApi();
            const feature = createFeature();
            spyOn(CredentialsContainer.prototype, 'get').and.resolveTo(null);

            feature.init();

            const promise = navigator.credentials.get(conditionalPasskeyOptions());
            expect(feature._messaging.notify).toHaveBeenCalledWith('registerPasskeyRequest', {
                rpId: 'example.com',
                requestId: jasmine.any(String),
            });

            const { requestId } = feature._messaging.notify.calls.mostRecent().args[1];
            feature.emitPasskeySelected({ credentialId: btoa('cred'), requestId });
            await promise;
        });

        it('rejects the returned promise when option getters throw synchronously', async () => {
            installCredentialsApi();
            const feature = createFeature();
            spyOn(CredentialsContainer.prototype, 'get').and.resolveTo(null);

            feature.init();

            const options = {
                get mediation() {
                    throw new TypeError('mediation getter failed');
                },
            };

            const promise = navigator.credentials.get(/** @type {CredentialRequestOptions} */ (options));
            expect(promise).toEqual(jasmine.any(Promise));
            await expectAsync(promise).toBeRejectedWithError(/mediation getter failed/);
            expectNoPasskeyRegistration(feature);
        });
    });
});
