import { JSDOM } from 'jsdom';
import AutofillPasskeys from '../src/features/autofill-passkeys.js';

/**
 * @param {object} [overrides]
 */
function createFeature(overrides = {}) {
    const feature = new AutofillPasskeys(
        'autofillPasskeys',
        {},
        {},
        {
            site: { domain: 'example.com', url: 'https://example.com' },
            ...overrides,
        },
    );
    feature.notify = jasmine.createSpy('notify');
    return feature;
}

describe('AutofillPasskeys', () => {
    /** @type {typeof globalThis.isSecureContext} */
    let originalSecureContext;

    beforeEach(() => {
        originalSecureContext = globalThis.isSecureContext;
    });

    afterEach(() => {
        if (originalSecureContext === undefined) {
            // @ts-expect-error - restoring test env
            delete globalThis.isSecureContext;
        } else {
            globalThis.isSecureContext = originalSecureContext;
        }
        // @ts-expect-error - cleaning up test doubles
        delete globalThis.CredentialsContainer;
        // @ts-expect-error - cleaning up test doubles
        delete globalThis.navigator;
    });

    describe('registerPasskeyRequest', () => {
        it('notifies native with rpId and requestId, then resolves via originalGet on passkeySelected', async () => {
            const feature = createFeature();
            /** @type {((data: unknown) => void) | undefined} */
            let handler;
            feature.subscribe = jasmine.createSpy('subscribe').and.callFake((_method, cb) => {
                handler = cb;
                return () => {};
            });

            const credential = { id: 'resolved-credential' };
            const originalGet = jasmine.createSpy('originalGet').and.returnValue(Promise.resolve(credential));
            const receiver = {};

            const promise = feature.registerPasskeyRequest(
                { challenge: new Uint8Array([1]), rpId: 'example.com' },
                { mediation: 'conditional', publicKey: { challenge: new Uint8Array([1]) } },
                originalGet,
                receiver,
            );

            expect(feature.notify).toHaveBeenCalledWith('registerPasskeyRequest', {
                rpId: 'example.com',
                requestId: jasmine.any(String),
            });

            const { requestId } = feature.notify.calls.mostRecent().args[1];
            handler?.({ credentialId: btoa('abc'), requestId });

            await expectAsync(promise).toBeResolvedTo(credential);
            expect(originalGet).toHaveBeenCalled();
            const narrowed = originalGet.calls.mostRecent().args[0];
            expect(narrowed.publicKey.allowCredentials[0].type).toBe('public-key');
        });

        it('falls back to location.hostname when rpId is not a string', () => {
            const feature = createFeature();
            feature.subscribe = jasmine.createSpy('subscribe').and.returnValue(() => {});

            const dom = new JSDOM('', { url: 'https://login.example.com/path' });
            const originalLocation = globalThis.location;
            // @ts-expect-error - jsdom location for the test
            globalThis.location = dom.window.location;

            try {
                feature.registerPasskeyRequest(
                    { challenge: new Uint8Array([1]), rpId: 123 },
                    { mediation: 'conditional', publicKey: { challenge: new Uint8Array([1]) } },
                    jasmine.createSpy('originalGet').and.returnValue(Promise.resolve(null)),
                    {},
                );

                expect(feature.notify).toHaveBeenCalledWith('registerPasskeyRequest', {
                    rpId: 'login.example.com',
                    requestId: jasmine.any(String),
                });
            } finally {
                globalThis.location = originalLocation;
            }
        });

        it('ignores passkeySelected payloads with a mismatched requestId', async () => {
            const feature = createFeature();
            /** @type {((data: unknown) => void) | undefined} */
            let handler;
            feature.subscribe = jasmine.createSpy('subscribe').and.callFake((_method, cb) => {
                handler = cb;
                return () => {};
            });

            const originalGet = jasmine.createSpy('originalGet');
            const promise = feature.registerPasskeyRequest(
                { challenge: new Uint8Array([1]), rpId: 'example.com' },
                { mediation: 'conditional', publicKey: { challenge: new Uint8Array([1]) } },
                originalGet,
                {},
            );

            handler?.({ credentialId: btoa('abc'), requestId: 'wrong-id' });

            // Allow microtasks to run; the promise must stay pending.
            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(originalGet).not.toHaveBeenCalled();

            const { requestId } = feature.notify.calls.mostRecent().args[1];
            handler?.({ credentialId: btoa('abc'), requestId });
            await expectAsync(promise).toBeResolved();
        });

        it('rejects the prior request when a new conditional passkey request supersedes it', async () => {
            const feature = createFeature();
            feature.subscribe = jasmine.createSpy('subscribe').and.returnValue(() => {});

            const options = { mediation: 'conditional', publicKey: { challenge: new Uint8Array([1]) } };
            const publicKey = { challenge: new Uint8Array([1]), rpId: 'example.com' };
            const originalGet = jasmine.createSpy('originalGet').and.returnValue(Promise.resolve(null));

            const first = feature.registerPasskeyRequest(publicKey, options, originalGet, {});
            feature.registerPasskeyRequest(publicKey, options, originalGet, {});

            await expectAsync(first).toBeRejectedWithError(DOMException, /superseded/);
        });

        it('rejects when the page abort signal fires', async () => {
            const feature = createFeature();
            feature.subscribe = jasmine.createSpy('subscribe').and.returnValue(() => {});

            const controller = new AbortController();
            const promise = feature.registerPasskeyRequest(
                { challenge: new Uint8Array([1]), rpId: 'example.com' },
                { mediation: 'conditional', publicKey: { challenge: new Uint8Array([1]) }, signal: controller.signal },
                jasmine.createSpy('originalGet'),
                {},
            );

            controller.abort();
            await expectAsync(promise).toBeRejectedWithError(DOMException, /aborted/i);
        });
    });

    describe('init', () => {
        /**
         * @param {object} params
         * @param {boolean} params.secure
         * @param {CredentialRequestOptions} params.options
         * @param {() => Promise<Credential | null>} params.originalGet
         */
        function setupWrappedGet({ secure, options, originalGet }) {
            class CredentialsContainer {
                get(opts) {
                    return originalGet(opts);
                }
            }
            const credentials = new CredentialsContainer();
            globalThis.CredentialsContainer = CredentialsContainer;
            Object.defineProperty(globalThis, 'navigator', {
                configurable: true,
                writable: true,
                value: { credentials },
            });
            globalThis.isSecureContext = secure;

            const feature = createFeature();
            feature.init();
            return credentials.get.bind(credentials);
        }

        it('passes through to the original get when mediation is not conditional', async () => {
            const originalGet = jasmine.createSpy('originalGet').and.returnValue(Promise.resolve(null));
            const get = setupWrappedGet({
                secure: true,
                options: { mediation: 'optional', publicKey: { challenge: new Uint8Array([1]) } },
                originalGet,
            });

            await get({ mediation: 'optional', publicKey: { challenge: new Uint8Array([1]) } });
            expect(originalGet).toHaveBeenCalled();
        });

        it('passes through when not in a secure context', async () => {
            const originalGet = jasmine.createSpy('originalGet').and.returnValue(Promise.resolve(null));
            const get = setupWrappedGet({
                secure: false,
                options: { mediation: 'conditional', publicKey: { challenge: new Uint8Array([1]) } },
                originalGet,
            });

            await get({ mediation: 'conditional', publicKey: { challenge: new Uint8Array([1]) } });
            expect(originalGet).toHaveBeenCalled();
        });

        it('intercepts conditional passkey requests in a secure context', async () => {
            const feature = createFeature();
            spyOn(feature, 'registerPasskeyRequest').and.returnValue(Promise.resolve(null));

            class CredentialsContainer {
                get() {
                    return Promise.resolve(null);
                }
            }
            const credentials = new CredentialsContainer();
            // @ts-expect-error - minimal CredentialsContainer stub for unit tests
            globalThis.CredentialsContainer = CredentialsContainer;
            Object.defineProperty(globalThis, 'navigator', {
                configurable: true,
                writable: true,
                value: { credentials },
            });
            globalThis.isSecureContext = true;

            feature.init();
            await navigator.credentials.get({
                mediation: 'conditional',
                publicKey: { challenge: new Uint8Array([1]), rpId: 'example.com' },
            });

            expect(feature.registerPasskeyRequest).toHaveBeenCalled();
        });
    });
});
