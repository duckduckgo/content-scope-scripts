import ContentFeature from '../content-feature.js';
import { isBeingFramed, matchHostname } from '../utils.js';
import {
    CustomEvent as NativeCustomEvent,
    DOMException as NativeDOMException,
    Event as NativeEvent,
    EventTarget as NativeEventTarget,
    addEventListener as addWindowEventListener,
    ReflectApply as apply,
    getOwnPropertyDescriptor,
    objectDefineProperty as defineProperty,
    objectGetPrototypeOf as getPrototypeOf,
    promiseReject as rejectPromise,
} from '../captured-globals.js';
import {
    callThen,
    embeddingFrameAllows,
    isSameOriginAsTopLevel,
    mediaCapturePolicyEvent,
    permissionsPolicy,
    randomHexToken,
} from './site-permissions/shared.js';

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
        const messageSecret = /** @type {{ messageSecret?: unknown } | undefined} */ (this.args)?.messageSecret;
        if (typeof capability !== 'string' || capability.length === 0 || typeof messageSecret !== 'string' || messageSecret.length === 0) {
            return;
        }

        // Save native methods before page scripts can replace them.
        const messaging = this.messaging;
        const toBoolean = Boolean;
        const dispatchEventOn = NativeEventTarget.prototype.dispatchEvent;
        const preventDefault = NativeEvent.prototype.preventDefault;
        const mediaDevices = navigator.mediaDevices;
        const prototype = mediaDevices && getPrototypeOf(mediaDevices);
        const descriptor = prototype && getOwnPropertyDescriptor(prototype, 'getUserMedia');
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
        const isDuckAIHost = hostname === 'duck.ai' || matchHostname(hostname, 'duckduckgo.com');
        const hasNonOpaqueOrigin = origin !== 'null' && origin.length > 0;
        const isSyntheticDocument = locationProtocol === 'about:';
        const sameOriginAsTopLevel = isSameOriginAsTopLevel(origin);
        // WebKit owns each document's effective sandbox restrictions, including after navigation.
        // An allow-same-origin sandbox may request media; opaque origins are marked ineligible.
        const policy = permissionsPolicy();
        const allowsFeature = policy?.allowsFeature;
        const hasPolicyIntrospection = typeof allowsFeature === 'function';
        // Some WebKit versions don't expose whether an embedded page (iframe) may use media.
        // Fall back to the iframe's allow attribute, and keep the parent's restrictions for nested
        // frames. A document's policy is fixed when it loads, so the parent answers from its own
        // load-time result; a parent without this feature never answers, which fails closed.
        // This is a best-effort precheck; WebKit makes the final capture decision.
        /**
         * @param {'camera' | 'microphone'} feature
         */
        const parentPolicyAllows = (feature) => {
            const question = new NativeCustomEvent(mediaCapturePolicyEvent(feature, messageSecret), { cancelable: true });
            return !apply(dispatchEventOn, globalThis.parent, [question]);
        };
        /**
         * @param {'camera' | 'microphone'} feature
         */
        const fallbackPolicyAllows = (feature) => {
            if (!sameOriginAsTopLevel) {
                return false;
            }
            if (!isBeingFramed()) {
                return true;
            }
            try {
                return parentPolicyAllows(feature) && embeddingFrameAllows(globalThis.window, feature, { legacyColonSeparator: true });
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
        for (const feature of /** @type {const} */ (['camera', 'microphone'])) {
            addWindowEventListener(mediaCapturePolicyEvent(feature, messageSecret), (event) => {
                if (policyAllows(feature)) {
                    apply(preventDefault, event, []);
                }
            });
        }
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

        defineProperty(prototype, 'getUserMedia', { ...descriptor, value: getUserMedia });
    }
}
