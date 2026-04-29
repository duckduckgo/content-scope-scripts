import ContentFeature from '../content-feature';
// eslint-disable-next-line no-redeclare
import { Uint8Array, atob, Promise as CapturedPromise, DOMException as CapturedDOMException, charCodeAt } from '../captured-globals';

const MSG_INBOUND_PASSKEY_SELECTED = 'passkeySelected';
const MSG_OUTBOUND_FEATURE = 'Autofill';
const MSG_OUTBOUND_NAME = 'registerPasskeyRequest';
const MEDIATION_CONDITIONAL = 'conditional';
const CREDENTIAL_TYPE_PUBLIC_KEY = 'public-key';

export default class AutofillPasskeys extends ContentFeature {
    /** @type {(() => void) | null} */
    #cancelPending = null;
    /** @type {((msg: object) => void) | null} */
    #postMessage = null;
    /** @type {((type: string, handler: Function) => void) | null} */
    #addEventListener = null;
    /** @type {((type: string, handler: Function) => void) | null} */
    #removeEventListener = null;

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

        // Capture interop globals early so page code can't replace them later.
        this.#postMessage = /** @type {any} */ (windowsInteropPostMessage);
        this.#addEventListener = /** @type {any} */ (windowsInteropAddEventListener);
        this.#removeEventListener = /** @type {any} */ (windowsInteropRemoveEventListener);

        const credentialsSingleton = navigator.credentials;
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const feature = this;

        this.wrapMethod(CredentialsContainer.prototype, 'get', /** @this {CredentialsContainer} */ function (originalGet, options) {
            // Pass through for any receiver that isn't the known singleton.
            if (this !== credentialsSingleton) {
                return originalGet.call(this, options);
            }

            if (options?.mediation !== MEDIATION_CONDITIONAL || !options?.publicKey) {
                return originalGet.call(this, options);
            }

            const rpId = options?.publicKey?.rpId;
            if (typeof rpId === 'string' && rpId !== location.hostname && !location.hostname.endsWith('.' + rpId)) {
                return originalGet.call(this, options);
            }
            return feature.registerPasskeyRequest(typeof rpId === 'string' ? rpId : location.hostname, options, originalGet, this);
        });
    }

    /**
     * @param {string} rpId
     * @param {CredentialRequestOptions} options
     * @param {CredentialsContainer['get']} originalGet - unbound original method
     * @param {CredentialsContainer} receiver - the receiver from the intercepted call
     * @returns {Promise<Credential | null>}
     */
    registerPasskeyRequest(rpId, options, originalGet, receiver) {
        if (this.#cancelPending) {
            this.#cancelPending();
        }

        const optionsSnapshot = { ...options, publicKey: options.publicKey ? { ...options.publicKey } : undefined };

        return new CapturedPromise((resolve, reject) => {
            const cleanup = () => {
                this.#removeEventListener?.('message', handler);
                if (options.signal) {
                    options.signal.removeEventListener('abort', onAbort);
                }
                this.#cancelPending = null;
            };

            // Messages arrive via the WebView2 native interop channel (windowsInterop*),
            // which is a trusted browser-process-only channel — not a web postMessage listener.
            // Only the browser process can post to this channel; web content cannot.
            // No request correlation ID is needed: the native side processes one
            // registerPasskeyRequest at a time per tab, and passkeySelected is the
            // direct reply delivered on the same trusted channel. Shape validation
            // (type + string credentialId) plus atob decode validation below is sufficient.
            const handler = async (/** @type {MessageEvent} */ event) => {
                if (event.data?.type !== MSG_INBOUND_PASSKEY_SELECTED) return;
                if (typeof event.data.credentialId !== 'string' || event.data.credentialId.length === 0) return;

                cleanup();

                try {
                    const raw = atob(event.data.credentialId);
                    const arr = new Uint8Array(raw.length);
                    for (let i = 0; i < raw.length; i++) arr[i] = charCodeAt.call(raw, i);

                    const /** @type {CredentialRequestOptions} */ narrowed = {
                            ...optionsSnapshot,
                            mediation: undefined,
                            signal: options.signal,
                            publicKey: optionsSnapshot.publicKey
                                ? { ...optionsSnapshot.publicKey, allowCredentials: [{ type: CREDENTIAL_TYPE_PUBLIC_KEY, id: arr.buffer }] }
                                : undefined,
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

            this.#addEventListener?.('message', handler);

            this.#postMessage?.({
                Feature: MSG_OUTBOUND_FEATURE,
                Name: MSG_OUTBOUND_NAME,
                Data: { rpId },
            });
        });
    }
}
