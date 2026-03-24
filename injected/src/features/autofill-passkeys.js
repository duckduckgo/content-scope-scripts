import ContentFeature from '../content-feature';
import { matchHostname } from '../utils.js';

export default class AutofillPasskeys extends ContentFeature {
    init() {
        const excludedDomains = this.getFeatureSetting('excludedDomains') || [];
        const host = location.hostname.toLowerCase();
        const isExcluded = excludedDomains.some(
            /** @param {{ domain: string }} entry */
            (entry) => {
                const d = entry.domain?.toLowerCase();
                return d ? matchHostname(host, d) : false;
            },
        );
        if (isExcluded) return;

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
            if (event.data?.type === 'passkeySelected' && pendingResolve) {
                const raw = atob(event.data.credentialId);
                const arr = new Uint8Array(raw.length);
                for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);

                const options = /** @type {CredentialRequestOptions} */ (pendingOptions);
                if (options.publicKey) {
                    options.publicKey.allowCredentials = [{ type: 'public-key', id: arr.buffer }];
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
            if (options?.mediation !== 'conditional') {
                return originalGet.call(this, options);
            }

            const rpId = options?.publicKey?.rpId || location.hostname;

            // @ts-expect-error windowsInteropPostMessage is a Windows-specific global
            windowsInteropPostMessage({
                Feature: 'Autofill',
                Name: 'getPasskeys',
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
