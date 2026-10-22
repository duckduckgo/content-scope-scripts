import ContentFeature from '../content-feature.js';
import { permissionsPolicy, randomHexToken } from './site-permissions/shared.js';

// Each frame exposes its policy check here so same-origin children can inherit it.
const INHERITED_POLICY_PROPERTY = '__ddgMediaCapturePolicy';

/**
 * Delays a website's getUserMedia call so the iOS app can ask for site permission first.
 *
 * WebKit can request iOS camera/microphone authorization before calling WKUIDelegate's
 * media-permission method, so that delegate alone cannot provide the required prompt order.
 *
 * This feature runs at document start in each frame's page world. It sends the requested
 * types and frame eligibility to native code, then waits for the reply. Native code owns
 * the saved choices, dialogs, and OS authorization, and records a short-lived approval
 * before replying `allow`; WebKit's later WKUIDelegate callback consumes that approval.
 * A `bypass` reply restores WebKit's flow when the feature is off or for the Duck.ai
 * exception. Native code activates this feature by injecting the `capability` setting,
 * which authenticates every message.
 */
export default class SitePermissionsMediaCapture extends ContentFeature {
    load() {
        const capability = this.getFeatureSetting('capability');
        if (typeof capability !== 'string' || capability.length === 0 || INHERITED_POLICY_PROPERTY in globalThis) {
            return;
        }

        // Save native methods before page scripts can replace them.
        const messaging = this.messaging;
        const apply = Reflect.apply;
        const getPrototypeOf = Object.getPrototypeOf;
        const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
        const defineProperty = Object.defineProperty;
        const toBoolean = Boolean;
        const rejectPromise = Promise.reject.bind(Promise);
        const callThen = Function.prototype.call.bind(Promise.prototype.then);
        const NativeDOMException = DOMException;
        const getAttribute = Element.prototype.getAttribute;
        const baseURIGetter = getOwnPropertyDescriptor(Node.prototype, 'baseURI')?.get;
        const mediaDevices = navigator.mediaDevices;
        const prototype = mediaDevices && apply(getPrototypeOf, Object, [mediaDevices]);
        const descriptor = prototype && apply(getOwnPropertyDescriptor, Object, [prototype, 'getUserMedia']);
        const nativeGetUserMedia = descriptor && descriptor.value;

        if (typeof nativeGetUserMedia !== 'function') {
            return;
        }

        const nonce = randomHexToken();
        if (nonce === null) {
            return;
        }
        const origin = globalThis.origin;
        const locationProtocol = globalThis.location.protocol;
        const isSecureContext = globalThis.isSecureContext === true;
        const hostname = globalThis.location.hostname.toLowerCase();
        const isDuckAIHost = hostname === 'duck.ai' || hostname === 'duckduckgo.com' || hostname.endsWith('.duckduckgo.com');
        const hasNonOpaqueOrigin = origin !== 'null' && origin.length > 0;
        const isSyntheticDocument = locationProtocol === 'about:';
        const isSameOriginAsTopLevel = (() => {
            if (globalThis.top === globalThis.window) {
                return true;
            }
            try {
                return globalThis.top?.location.origin === origin;
            } catch (_) {
                return false;
            }
        })();
        // WebKit owns each document's effective sandbox restrictions, including after navigation.
        // An allow-same-origin sandbox may request media; opaque origins are marked ineligible.
        const policy = permissionsPolicy();
        const allowsFeature = policy?.allowsFeature;
        const hasPolicyIntrospection = typeof allowsFeature === 'function';
        // Some WebKit versions don't expose whether an embedded page (iframe) may use media.
        // Fall back to its HTML allow attribute and retain the parent's restrictions for nested
        // frames. This is a best-effort precheck; WebKit makes the final capture decision.
        /**
         * @param {'camera' | 'microphone'} feature
         */
        const fallbackPolicyAllows = (feature) => {
            if (!isSameOriginAsTopLevel) {
                return false;
            }
            if (globalThis.top === globalThis.window) {
                return true;
            }
            try {
                const parent = globalThis.parent;
                const inheritedPolicy = /** @type {Record<string, unknown>} */ (/** @type {unknown} */ (parent))[INHERITED_POLICY_PROPERTY];
                if (typeof inheritedPolicy !== 'function' || !inheritedPolicy(feature)) {
                    return false;
                }
                const frame = globalThis.frameElement;
                if (!frame) {
                    return false;
                }
                const allowAttribute = apply(getAttribute, frame, ['allow']) ?? '';
                const source = apply(getAttribute, frame, ['src']);
                let sourceOrigin = parent.location.origin;
                if (source !== null && apply(getAttribute, frame, ['srcdoc']) === null && baseURIGetter) {
                    try {
                        const sourceURL = new URL(source, apply(baseURIGetter, frame, []));
                        sourceOrigin = sourceURL.protocol === 'http:' || sourceURL.protocol === 'https:' ? sourceURL.origin : origin;
                    } catch (_) {}
                }
                for (const directive of allowAttribute.split(';')) {
                    const value = directive.trim();
                    if (!value.startsWith(feature)) {
                        continue;
                    }
                    // WebKit also accepts the legacy colon separator after a feature name.
                    const allowlist = value.slice(feature.length).replace(/^:/, '').trim();
                    if (!allowlist) {
                        return sourceOrigin === origin;
                    }
                    let allowed = false;
                    for (const token of allowlist.split(/[\t\n\f\r ]+/)) {
                        if (token === '*') {
                            return true;
                        }
                        if (token.toLowerCase() === "'none'") {
                            return false;
                        }
                        if (token.toLowerCase() === "'self'") {
                            allowed ||= parent.location.origin === origin;
                        } else if (token.toLowerCase() === "'src'") {
                            allowed ||= sourceOrigin === origin;
                        } else {
                            try {
                                allowed ||= new URL(token).origin === origin;
                            } catch (_) {}
                        }
                    }
                    return allowed;
                }
                return true;
            } catch (_) {
                return false;
            }
        };
        const fallbackCameraAllowed = fallbackPolicyAllows('camera');
        const fallbackMicrophoneAllowed = fallbackPolicyAllows('microphone');
        /**
         * @param {'camera' | 'microphone'} feature
         */
        const policyAllows = (feature) => {
            if (!hasPolicyIntrospection) {
                return feature === 'camera' ? fallbackCameraAllowed : fallbackMicrophoneAllowed;
            }
            try {
                return toBoolean(apply(allowsFeature, policy, [feature]));
            } catch (_) {
                return false;
            }
        };
        apply(defineProperty, Object, [globalThis, INHERITED_POLICY_PROPERTY, { value: policyAllows }]);
        let nextRequestID = 0;

        const permissionDenied = () => new NativeDOMException('Permission denied', 'NotAllowedError');
        /**
         * @this {MediaDevices}
         * @param {MediaStreamConstraints} [constraints]
         */
        const getUserMedia = function (constraints) {
            if (constraints === null || (typeof constraints !== 'object' && typeof constraints !== 'function')) {
                return apply(nativeGetUserMedia, this, arguments);
            }

            /** @type {MediaStreamConstraints['video']} */
            let rawVideo;
            /** @type {MediaStreamConstraints['audio']} */
            let rawAudio;
            // Read getters once so native code approves the same media types that WebKit receives.
            try {
                rawVideo = constraints.video;
                rawAudio = constraints.audio;
            } catch (error) {
                return rejectPromise(error);
            }

            const video = toBoolean(rawVideo);
            const audio = toBoolean(rawAudio);
            const capturedConstraints = { video: rawVideo, audio: rawAudio };
            if (!video && !audio) {
                return apply(nativeGetUserMedia, this, [capturedConstraints]);
            }

            // Send ineligible requests too: native code checks rollback before denying custom-flow requests.
            const isEligibleContext =
                this === mediaDevices &&
                hasNonOpaqueOrigin &&
                (isDuckAIHost ||
                    (isSecureContext &&
                        !isSyntheticDocument &&
                        (!video || policyAllows('camera')) &&
                        (!audio || policyAllows('microphone'))));

            nextRequestID += 1;
            /** @type {Promise<{ decision?: unknown }>} */
            let bridgePromise;
            try {
                bridgePromise = messaging.request('requestPermission', {
                    capability,
                    requestID: `${nonce}:${nextRequestID}`,
                    isEligible: isEligibleContext,
                    video,
                    audio,
                });
            } catch (_) {
                return rejectPromise(permissionDenied());
            }

            return callThen(
                bridgePromise,
                (/** @type {{ decision?: unknown } | null} */ reply) => {
                    if (reply && (reply.decision === 'allow' || reply.decision === 'bypass')) {
                        return apply(nativeGetUserMedia, this, [capturedConstraints]);
                    }
                    throw permissionDenied();
                },
                () => {
                    throw permissionDenied();
                },
            );
        };

        apply(defineProperty, Object, [
            prototype,
            'getUserMedia',
            {
                ...descriptor,
                value: getUserMedia,
            },
        ]);
    }
}
