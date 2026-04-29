import ContentFeature from '../content-feature';

const MSG_INBOUND_PASSKEY_SELECTED = 'passkeySelected';
const MSG_OUTBOUND_FEATURE = 'Autofill';
const MSG_OUTBOUND_NAME = 'registerPasskeyRequest';
const MEDIATION_CONDITIONAL = 'conditional';
const CREDENTIAL_TYPE_PUBLIC_KEY = 'public-key';

export default class AutofillPasskeys extends ContentFeature {
    init() {
        if (!navigator.credentials || typeof navigator.credentials.get !== 'function') return;

        /** @type {{ resolve: (value: Credential | null) => void, reject: (reason?: unknown) => void, options: CredentialRequestOptions } | null} */
        let pending = null;

        const savedOriginalGet = navigator.credentials.get.bind(navigator.credentials);

        // @ts-expect-error windowsInteropAddEventListener is a Windows-specific global
        windowsInteropAddEventListener('message', async function (/** @type {MessageEvent} */ event) {
            if (!pending) return;

            if (event.data?.type === MSG_INBOUND_PASSKEY_SELECTED) {
                if (typeof event.data.credentialId !== 'string') return;

                const { resolve, reject, options } = pending;
                pending = null;

                try {
                    const raw = atob(event.data.credentialId);
                    const arr = new Uint8Array(raw.length);
                    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);

                    if (options.publicKey) {
                        options.publicKey.allowCredentials = [{ type: CREDENTIAL_TYPE_PUBLIC_KEY, id: arr.buffer }];
                    }
                    delete options.mediation;

                    const credential = await savedOriginalGet(options);
                    resolve(credential);
                } catch (e) {
                    reject(e);
                }
            }
        });

        this.wrapMethod(CredentialsContainer.prototype, 'get', /** @this {CredentialsContainer} */ function (originalGet, options) {
            if (options?.mediation !== MEDIATION_CONDITIONAL || !options?.publicKey) {
                return originalGet.call(this, options);
            }

            if (pending) {
                pending.reject(new DOMException('A new passkey request superseded this one.', 'AbortError'));
                pending = null;
            }

            const rpId = options?.publicKey?.rpId || location.hostname;

            // @ts-expect-error windowsInteropPostMessage is a Windows-specific global
            windowsInteropPostMessage({
                Feature: MSG_OUTBOUND_FEATURE,
                Name: MSG_OUTBOUND_NAME,
                Data: { rpId },
            });

            return new Promise(function (resolve, reject) {
                pending = { resolve, reject, options };

                if (options.signal) {
                    options.signal.addEventListener('abort', function () {
                        if (pending?.reject === reject) {
                            pending = null;
                            reject(options.signal?.reason ?? new DOMException('The operation was aborted.', 'AbortError'));
                        }
                    });
                }
            });
        });
    }
}
