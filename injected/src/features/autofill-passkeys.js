import ContentFeature from '../content-feature';
// eslint-disable-next-line no-redeclare
import { Uint8Array, atob, Promise as CapturedPromise } from '../captured-globals';

const MSG_INBOUND_PASSKEY_SELECTED = 'passkeySelected';
const MSG_OUTBOUND_FEATURE = 'Autofill';
const MSG_OUTBOUND_NAME = 'registerPasskeyRequest';
const MEDIATION_CONDITIONAL = 'conditional';
const CREDENTIAL_TYPE_PUBLIC_KEY = 'public-key';

export default class AutofillPasskeys extends ContentFeature {
    /** @type {(() => void) | null} */
    #cancelPending = null;
    /** @type {(msg: object) => void} */
    #postMessage;
    /** @type {(type: string, handler: Function) => void} */
    #addEventListener;
    /** @type {(type: string, handler: Function) => void} */
    #removeEventListener;

    init() {
        // Bail if the Credentials API is absent. Note: web-compat's navigatorCredentialsFix()
        // polyfills a rejecting stub when the API is missing entirely — that and this feature
        // are complementary (web-compat handles missing API, we wrap an existing one).
        if (!navigator.credentials || typeof navigator.credentials.get !== 'function') return;

        // Capture interop globals early so page code can't replace them later.
        this.#postMessage = /** @type {any} */ (windowsInteropPostMessage);
        this.#addEventListener = /** @type {any} */ (windowsInteropAddEventListener);
        this.#removeEventListener = /** @type {any} */ (windowsInteropRemoveEventListener);

        // navigator.credentials is a singleton (CredentialsContainer can't be independently
        // constructed), so binding to it is equivalent to preserving the original receiver.
        const savedOriginalGet = navigator.credentials.get.bind(navigator.credentials);

        this.wrapMethod(CredentialsContainer.prototype, 'get', (originalGet, options) => {
            if (options?.mediation !== MEDIATION_CONDITIONAL || !options?.publicKey) {
                return originalGet.call(navigator.credentials, options);
            }

            const rpId = options?.publicKey?.rpId || location.hostname;
            if (rpId !== location.hostname && !location.hostname.endsWith('.' + rpId)) {
                return originalGet.call(navigator.credentials, options);
            }
            return this.registerPasskeyRequest(rpId, options, savedOriginalGet);
        });
    }

    /**
     * @param {string} rpId
     * @param {CredentialRequestOptions} options
     * @param {typeof navigator.credentials.get} originalGet
     * @returns {Promise<Credential | null>}
     */
    registerPasskeyRequest(rpId, options, originalGet) {
        if (this.#cancelPending) {
            this.#cancelPending();
        }

        const optionsSnapshot = { ...options, publicKey: options.publicKey ? { ...options.publicKey } : undefined };

        return new CapturedPromise((resolve, reject) => {
            const cleanup = () => {
                this.#removeEventListener('message', handler);
                if (options.signal) {
                    options.signal.removeEventListener('abort', onAbort);
                }
                this.#cancelPending = null;
            };

            // Messages arrive via the WebView native interop channel (windowsInterop*),
            // which is a trusted browser-process channel — not a web postMessage listener.
            // Origin validation is unnecessary here; shape validation below is sufficient.
            const handler = async (/** @type {MessageEvent} */ event) => {
                if (event.data?.type !== MSG_INBOUND_PASSKEY_SELECTED) return;
                if (typeof event.data.credentialId !== 'string') return;

                cleanup();

                try {
                    const raw = atob(event.data.credentialId);
                    const arr = new Uint8Array(raw.length);
                    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);

                    const /** @type {CredentialRequestOptions} */ narrowed = {
                        ...optionsSnapshot,
                        mediation: undefined,
                        signal: options.signal,
                        publicKey: optionsSnapshot.publicKey
                            ? { ...optionsSnapshot.publicKey, allowCredentials: [{ type: CREDENTIAL_TYPE_PUBLIC_KEY, id: arr.buffer }] }
                            : undefined,
                    };

                    const credential = await originalGet(narrowed);
                    resolve(credential);
                } catch (e) {
                    reject(e);
                }
            };

            const onAbort = () => {
                cleanup();
                reject(options.signal?.reason ?? new DOMException('The operation was aborted.', 'AbortError'));
            };

            this.#cancelPending = () => {
                cleanup();
                reject(new DOMException('A new passkey request superseded this one.', 'AbortError'));
            };

            if (options.signal?.aborted) {
                onAbort();
                return;
            }

            if (options.signal) {
                options.signal.addEventListener('abort', onAbort);
            }

            this.#addEventListener('message', handler);

            this.#postMessage({
                Feature: MSG_OUTBOUND_FEATURE,
                Name: MSG_OUTBOUND_NAME,
                Data: { rpId },
            });
        });
    }
}
