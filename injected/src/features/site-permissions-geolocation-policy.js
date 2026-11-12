import ContentFeature from '../content-feature.js';

import {
    embeddingFramesAllow,
    geolocationBridgeEvent,
    hasNetworkOrigin,
    isSameOriginAsTopLevel,
    permissionsPolicy,
    randomHexToken,
} from './site-permissions/shared.js';

const NONCE_PATTERN = /^[0-9a-f]{32}$/;

/**
 * @param {unknown} value
 * @returns {value is string}
 */
const isNonce = (value) => typeof value === 'string' && NONCE_PATTERN.test(value);

/**
 * Evaluates document policy for `sitePermissionsGeolocation` in the isolated world.
 *
 * Page scripts cannot reach this world, so it needs no captured globals, and native code trusts
 * it with the frame's policy and document identity. Its checks post no messages, so the page
 * never observes them.
 *
 * - Cross-origin frames are unsupported: origin alone cannot prove that an iframe's allow
 *   attribute or response headers permit geolocation.
 * - Like WebKit, only a sandbox that makes the origin opaque blocks geolocation.
 * - Where WebKit doesn't expose `allowsFeature`, same-origin frames follow the allow attributes
 *   of their embedding frames. Native code checks the top-level response policy.
 *
 * The page feature shares its document identity over `geolocationBridgeEvent` events. This
 * feature reports it alongside its own, and checks both before forwarding native updates to the
 * page feature, so a frame that outlives its document cannot deliver to the replacement.
 * Native code activates this feature by injecting the `enabled` setting.
 */
export default class SitePermissionsGeolocationPolicy extends ContentFeature {
    load() {
        const messageSecret = /** @type {{ messageSecret?: unknown } | undefined} */ (this.args)?.messageSecret;
        if (this.getFeatureSetting('enabled') !== true || typeof messageSecret !== 'string' || messageSecret.length === 0) {
            return;
        }

        const documentID = randomHexToken();

        // The page feature announces its document identity, whichever feature loads first.
        /** @type {string | null} */
        let pageDocumentID = null;
        globalThis.addEventListener(geolocationBridgeEvent('document', messageSecret), (event) => {
            const announced = /** @type {CustomEvent} */ (event).detail;
            if (pageDocumentID === null && isNonce(announced)) {
                pageDocumentID = announced;
            }
        });
        const requestPageDocument = () => {
            if (pageDocumentID === null) {
                globalThis.dispatchEvent(new CustomEvent(geolocationBridgeEvent('document-request', messageSecret)));
            }
            return pageDocumentID;
        };
        requestPageDocument();

        const policy = permissionsPolicy();
        const policyAllowsGeolocation = () => {
            try {
                if (typeof policy?.allowsFeature === 'function') {
                    return policy.allowsFeature('geolocation') === true;
                }
                return embeddingFramesAllow('geolocation');
            } catch (_) {
                return false;
            }
        };
        const isSecureContext = globalThis.isSecureContext === true;
        const isFramePolicyEligible = hasNetworkOrigin() && isSameOriginAsTopLevel();
        // hasNetworkOrigin already rejects an opaque origin, so this never changes the verdict by
        // itself. It reports the same fact to native code, which needs it.
        const isSandboxed = globalThis.origin === 'null';

        // Native code calls these subscriptions in a frame's isolated world: it reads the constraints,
        // and whether the page feature accepted a delivery as its ownership acknowledgement.
        this.subscribe('geolocationPolicyConstraints', () =>
            Object.freeze({
                documentID,
                pageDocumentID: requestPageDocument(),
                isSecureContext,
                isPolicyAllowed: documentID !== null && isFramePolicyEligible && policyAllowsGeolocation(),
                isSandboxed,
            }),
        );
        this.subscribe('geolocationDeliver', (value) => {
            const delivery = /** @type {{ documentID?: unknown, subscriptionName?: unknown, params?: unknown }} */ (value);
            if (documentID === null || delivery.documentID !== documentID || typeof delivery.subscriptionName !== 'string') {
                return false;
            }
            const event = new CustomEvent(geolocationBridgeEvent('deliver', messageSecret), {
                cancelable: true,
                detail: JSON.stringify({ subscriptionName: delivery.subscriptionName, params: delivery.params }),
            });
            return !globalThis.dispatchEvent(event);
        });
    }
}
