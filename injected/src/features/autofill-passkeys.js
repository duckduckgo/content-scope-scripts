import ContentFeature from '../content-feature';

const MSG_INBOUND_PASSKEY_SELECTED = 'passkeySelected';
const MSG_OUTBOUND_FEATURE = 'Autofill';
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
        if (!navigator.credentials || typeof navigator.credentials.get !== 'function') return;

        const savedOriginalGet = navigator.credentials.get.bind(navigator.credentials);
        const feature = this;

        this.wrapMethod(CredentialsContainer.prototype, 'get', /** @this {CredentialsContainer} */ function (originalGet, options) {
            if (options?.mediation !== MEDIATION_CONDITIONAL || !options?.publicKey) {
                return originalGet.call(this, options);
            }

            const rpId = options?.publicKey?.rpId || location.hostname;
            return feature.registerPasskeyRequest(rpId, options, savedOriginalGet);
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

        return new Promise((resolve, reject) => {
            const cleanup = () => {
                // @ts-expect-error windowsInteropRemoveEventListener is a Windows-specific global
                windowsInteropRemoveEventListener('message', handler);
                if (options.signal) {
                    options.signal.removeEventListener('abort', onAbort);
                }
                this.#cancelPending = null;
            };

            const handler = async (/** @type {MessageEvent} */ event) => {
                if (event.data?.type !== MSG_INBOUND_PASSKEY_SELECTED) return;
                if (typeof event.data.credentialId !== 'string') return;

                cleanup();

                try {
                    const raw = atob(event.data.credentialId);
                    const arr = new Uint8Array(raw.length);
                    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);

                    const /** @type {CredentialRequestOptions} */ narrowed = {
                        ...options,
                        mediation: undefined,
                        signal: undefined,
                        publicKey: options.publicKey
                            ? { ...options.publicKey, allowCredentials: [{ type: CREDENTIAL_TYPE_PUBLIC_KEY, id: arr.buffer }] }
                            : options.publicKey,
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

            // @ts-expect-error windowsInteropAddEventListener is a Windows-specific global
            windowsInteropAddEventListener('message', handler);

            // @ts-expect-error windowsInteropPostMessage is a Windows-specific global
            windowsInteropPostMessage({
                Feature: MSG_OUTBOUND_FEATURE,
                Name: MSG_OUTBOUND_NAME,
                Data: { rpId },
            });
        });
    }
}
