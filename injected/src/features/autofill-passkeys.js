import ContentFeature from '../content-feature';
/* eslint-disable no-redeclare */
import {
    Uint8Array,
    atob,
    Promise as CapturedPromise,
    DOMException as CapturedDOMException,
    charCodeAt,
    randomUUID,
} from '../captured-globals';
/* eslint-enable no-redeclare */

const MSG_INBOUND_PASSKEY_SELECTED = 'passkeySelected';
const MSG_OUTBOUND_NAME = 'registerPasskeyRequest';
const MEDIATION_CONDITIONAL = 'conditional';
const CREDENTIAL_TYPE_PUBLIC_KEY = 'public-key';

export default class AutofillPasskeys extends ContentFeature {
    /** @type {(() => void) | null} */
    #cancelPending = null;

    init() {
        // Bail if the Credentials API is absent. Note: web-compat's navigatorCredentialsFix()
        // polyfills a rejecting stub when the API is missing entirely — that and this feature
        // are complementary (web-compat handles missing API, we wrap an existing one).
        if (
            typeof CredentialsContainer === 'undefined' ||
            !navigator.credentials ||
            !(navigator.credentials instanceof CredentialsContainer) ||
            typeof navigator.credentials.get !== 'function'
        ) {
            return;
        }

        const credentialsSingleton = navigator.credentials;
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const feature = this;

        this.wrapMethod(
            CredentialsContainer.prototype,
            'get',
            /** @this {CredentialsContainer} */ function (originalGet, options) {
                // Pass through for any receiver that isn't the known singleton.
                if (this !== credentialsSingleton) {
                    return originalGet.call(this, options);
                }

                // Native get() is a WebIDL promise-returning operation: reads of the
                // page-supplied options dictionary that throw surface as a rejected
                // promise, never a synchronous throw. Mirror that here.
                try {
                    const mediation = options?.mediation;
                    const publicKey = options?.publicKey;
                    if (!globalThis.isSecureContext || mediation !== MEDIATION_CONDITIONAL || !publicKey) {
                        return originalGet.call(this, options);
                    }
                    return feature.registerPasskeyRequest(publicKey, options, originalGet, this);
                } catch (e) {
                    return CapturedPromise.reject(e);
                }
            },
        );
    }

    /**
     * @param {PublicKeyCredentialRequestOptions} publicKey - page-supplied publicKey dictionary (already confirmed present)
     * @param {CredentialRequestOptions} options
     * @param {CredentialsContainer['get']} originalGet - unbound original method
     * @param {CredentialsContainer} receiver - the receiver from the intercepted call
     * @returns {Promise<Credential | null>}
     */
    registerPasskeyRequest(publicKey, options, originalGet, receiver) {
        if (this.#cancelPending) {
            this.#cancelPending();
        }

        const requestId = randomUUID?.();
        if (!requestId) {
            return originalGet.call(receiver, options);
        }

        return new CapturedPromise((resolve, reject) => {
            // Snapshot the page-supplied getters inside the executor so a throwing
            // getter rejects this promise (matching native get()) rather than
            // throwing synchronously to the caller.
            const publicKeySnapshot = {
                challenge: publicKey.challenge,
                timeout: publicKey.timeout,
                rpId: publicKey.rpId,
                userVerification: publicKey.userVerification,
                extensions: publicKey.extensions,
            };
            // RP ID validation (registrable domain, public suffix, Related Origin
            // Requests via .well-known/webauthn) is the native side's responsibility.
            const rpId = typeof publicKeySnapshot.rpId === 'string' ? publicKeySnapshot.rpId : location.hostname;

            /** @type {(() => void) | undefined} */
            // eslint-disable-next-line prefer-const -- assigned after closures that read it (see abort path); const would hit the TDZ
            let unsubscribe;

            const cleanup = () => {
                unsubscribe?.();
                if (options.signal) {
                    options.signal.removeEventListener('abort', onAbort);
                }
                this.#cancelPending = null;
            };

            const handler = async (/** @type {any} */ data) => {
                if (typeof data?.credentialId !== 'string' || data.credentialId.length === 0) return;
                if (data.requestId !== requestId) return;

                cleanup();

                try {
                    const raw = atob(data.credentialId);
                    const arr = new Uint8Array(raw.length);
                    for (let i = 0; i < raw.length; i++) arr[i] = charCodeAt.call(raw, i);

                    const /** @type {CredentialRequestOptions} */ narrowed = {
                            signal: options.signal,
                            publicKey: {
                                ...publicKeySnapshot,
                                allowCredentials: [{ type: CREDENTIAL_TYPE_PUBLIC_KEY, id: arr.buffer }],
                            },
                        };

                    const credential = await originalGet.call(receiver, narrowed);
                    resolve(credential);
                } catch (e) {
                    reject(e);
                }
            };

            const onAbort = () => {
                cleanup();
                reject(options.signal?.reason ?? new CapturedDOMException('The operation was aborted.', 'AbortError'));
            };

            this.#cancelPending = () => {
                cleanup();
                reject(new CapturedDOMException('A new passkey request superseded this one.', 'AbortError'));
            };

            if (options.signal?.aborted) {
                onAbort();
                return;
            }

            if (options.signal) {
                options.signal.addEventListener('abort', onAbort);
            }

            unsubscribe = this.subscribe(MSG_INBOUND_PASSKEY_SELECTED, handler);
            this.notify(MSG_OUTBOUND_NAME, { rpId, requestId });
        });
    }
}
