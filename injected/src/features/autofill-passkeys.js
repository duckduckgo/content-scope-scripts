import ContentFeature from '../content-feature';

const MSG_INBOUND_PASSKEY_SELECTED = 'passkeySelected';
const MSG_OUTBOUND_FEATURE = 'Autofill';
const MSG_OUTBOUND_NAME = 'getPasskeys';
const MEDIATION_CONDITIONAL = 'conditional';
const CREDENTIAL_TYPE_PUBLIC_KEY = 'public-key';

export default class AutofillPasskeys extends ContentFeature {
    init() {
        if (!navigator.credentials || typeof navigator.credentials.get !== 'function') return;

        /** @type {((value: Credential) => void) | null} */
        let pendingResolve = null;
        /** @type {((reason?: unknown) => void) | null} */
        let pendingReject = null;
        /** @type {CredentialRequestOptions | null} */
        let pendingOptions = null;

        const savedOriginalGet = navigator.credentials.get.bind(navigator.credentials);

        // @ts-expect-error windowsInteropAddEventListener is a Windows-specific global
        windowsInteropAddEventListener('message', async function (/** @type {MessageEvent} */ event) {
            if (!pendingResolve) return;

            if (event.data?.type === MSG_INBOUND_PASSKEY_SELECTED) {
                const raw = atob(event.data.credentialId);
                const arr = new Uint8Array(raw.length);
                for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);

                const options = /** @type {CredentialRequestOptions} */ (pendingOptions);
                if (options.publicKey) {
                    options.publicKey.allowCredentials = [{ type: CREDENTIAL_TYPE_PUBLIC_KEY, id: arr.buffer }];
                }
                delete options.mediation;

                const resolve = pendingResolve;
                const reject = /** @type {(reason?: unknown) => void} */ (pendingReject);
                pendingResolve = pendingReject = pendingOptions = null;

                try {
                    const credential = await savedOriginalGet(options);
                    resolve(credential);
                } catch (e) {
                    reject(e);
                }
            }
        });

        this.wrapMethod(CredentialsContainer.prototype, 'get', function (originalGet, options) {
            if (options?.mediation !== MEDIATION_CONDITIONAL) {
                return originalGet.call(this, options);
            }

            const rpId = options?.publicKey?.rpId || location.hostname;

            // @ts-expect-error windowsInteropPostMessage is a Windows-specific global
            windowsInteropPostMessage({
                Feature: MSG_OUTBOUND_FEATURE,
                Name: MSG_OUTBOUND_NAME,
                Data: { rpId },
            });

            return new Promise(function (resolve, reject) {
                pendingResolve = resolve;
                pendingReject = reject;
                pendingOptions = options;
            });
        });
    }
}
