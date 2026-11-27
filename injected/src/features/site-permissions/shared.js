import {
    Arrayfrom,
    ReflectApply,
    Uint32Array as NativeUint32Array,
    getRandomValues,
    numberToString,
    URL as NativeURL,
    getOwnPropertyDescriptor,
    promiseThen,
} from '../../captured-globals.js';
import { isBeingFramed } from '../../utils.js';

/**
 * Helpers shared by the iOS site permission features. Call them from `load()`,
 * before page scripts can replace the globals they read.
 */

/**
 * `promise.then(...)` without looking up `then` on a prototype the page may have replaced.
 *
 * @type {(promise: Promise<any>, onFulfilled?: ((value: any) => any) | undefined, onRejected?: (reason: any) => any) => Promise<any>}
 */
export const callThen = (promise, onFulfilled, onRejected) => ReflectApply(promiseThen, promise, [onFulfilled, onRejected]);

/**
 * @returns {string | null} 32 lowercase hex characters, or null without `crypto.getRandomValues`
 */
export function randomHexToken() {
    if (typeof getRandomValues !== 'function') {
        return null;
    }
    const values = new NativeUint32Array(4);
    getRandomValues(values);
    return Arrayfrom(values, (value) => ReflectApply(numberToString, value, [16]).padStart(8, '0')).join('');
}

/**
 * WebKit exposes the document's effective Permissions Policy under either name, or neither.
 *
 * @returns {{ allowsFeature?: (feature: string) => boolean } | undefined}
 */
export function permissionsPolicy() {
    const doc = /** @type {Document & { permissionsPolicy?: any, featurePolicy?: any }} */ (document);
    return doc.permissionsPolicy ?? doc.featurePolicy;
}

/**
 * Whether this document has exactly the top-level document's origin.
 *
 * Stricter than `isThirdPartyFrame()`: a same-site frame on another subdomain, port, or scheme
 * does not qualify, and a frame that cannot read the top-level location fails closed.
 *
 * @param {string} [origin] - this document's origin
 */
export function isSameOriginAsTopLevel(origin = globalThis.location.origin) {
    if (!isBeingFramed()) {
        return true;
    }
    try {
        return globalThis.top?.location.origin === origin;
    } catch (_) {
        return false;
    }
}

// Captured when the bundle loads, before page scripts can replace them.
const elementGetAttribute = globalThis.Element?.prototype?.getAttribute;
const elementMatches = globalThis.Element?.prototype?.matches;
const nodeBaseURI = getOwnPropertyDescriptor(globalThis.Node?.prototype ?? {}, 'baseURI')?.get;

/**
 * Whether the `allow` attribute of `frame` delegates `feature` to the document it embeds,
 * evaluated like WebKit's container policy: the feature name is a case-sensitive prefix, the
 * first directive for it wins, the first `*` or `'none'` decides, and without a directive the
 * allowlist is `'self'`.
 *
 * @param {Element} frame
 * @param {string} feature
 * @param {string} frameOrigin - origin of the embedded document
 * @param {string} parentOrigin - origin of the document that contains `frame`
 * @param {boolean} legacyColonSeparator - also accept `feature:` before the allowlist
 */
function allowAttributeAllows(frame, feature, frameOrigin, parentOrigin, legacyColonSeparator) {
    /** @param {string} name */
    const attribute = (name) => /** @type {string | null} */ (ReflectApply(elementGetAttribute, frame, [name]));
    const sourceOrigin = () => {
        const source = attribute('src');
        if (source === null || attribute('srcdoc') !== null || !nodeBaseURI) {
            return parentOrigin;
        }
        try {
            const url = new NativeURL(source, ReflectApply(nodeBaseURI, frame, []));
            return url.protocol === 'http:' || url.protocol === 'https:' ? url.origin : frameOrigin;
        } catch (_) {
            return parentOrigin;
        }
    };
    for (const directive of (attribute('allow') ?? '').split(';')) {
        const value = directive.trim();
        if (!value.startsWith(feature)) {
            continue;
        }
        let allowlist = value.slice(feature.length);
        if (legacyColonSeparator) {
            allowlist = allowlist.replace(/^:/, '');
        }
        allowlist = allowlist.trim();
        if (!allowlist) {
            return sourceOrigin() === frameOrigin;
        }
        let allowed = false;
        for (const token of allowlist.split(/[\t\n\f\r ]+/)) {
            const keyword = token.toLowerCase();
            if (token === '*') {
                return true;
            }
            if (keyword === "'none'") {
                return false;
            }
            if (keyword === "'self'") {
                allowed ||= parentOrigin === frameOrigin;
            } else if (keyword === "'src'") {
                allowed ||= sourceOrigin() === frameOrigin;
            } else {
                try {
                    allowed ||= new NativeURL(token).origin === frameOrigin;
                } catch (_) {}
            }
        }
        return allowed;
    }
    return parentOrigin === frameOrigin;
}

/**
 * Whether the iframe that embeds `frameWindow` delegates `feature` to it through its `allow`
 * attribute, as the attribute is now. Throws when `frameWindow`'s parent is cross-origin.
 *
 * @param {Window} frameWindow - a framed window
 * @param {string} feature
 * @param {{ legacyColonSeparator?: boolean }} [options]
 */
export function embeddingFrameAllows(frameWindow, feature, { legacyColonSeparator = false } = {}) {
    // A cross-origin parent hides the frame element.
    const frame = frameWindow.frameElement;
    return (
        !!frame &&
        ReflectApply(elementMatches, frame, ['iframe,frame']) === true &&
        allowAttributeAllows(frame, feature, frameWindow.origin, frameWindow.parent.location.origin, legacyColonSeparator)
    );
}

/**
 * Whether every iframe between this document and the top level delegates `feature` through its
 * `allow` attribute, which also applies an ancestor's restrictions to nested frames. Use it where
 * WebKit doesn't expose `allowsFeature`. Each attribute is read as it is now.
 *
 * Frames beneath a cross-origin ancestor fail closed. Scripts cannot read a frame's own
 * `Permissions-Policy` response header, so it isn't applied.
 *
 * @param {string} feature
 */
export function embeddingFramesAllow(feature) {
    try {
        for (
            let frameWindow = /** @type {Window} */ (globalThis.window);
            frameWindow !== frameWindow.parent;
            frameWindow = frameWindow.parent
        ) {
            if (!embeddingFrameAllows(frameWindow, feature)) {
                return false;
            }
        }
        return true;
    } catch (_) {
        return false;
    }
}

/**
 * Whether this is an HTTP(S) document with a real host and a non-opaque origin.
 */
export function hasNetworkOrigin() {
    return (
        globalThis.origin !== 'null' &&
        globalThis.location.hostname.length > 0 &&
        (globalThis.location.protocol === 'https:' || globalThis.location.protocol === 'http:')
    );
}

/**
 * Names an event passed between the page-world and isolated-world geolocation features.
 *
 * Like `message-bridge`, names carry the session's `messageSecret`, so page scripts can neither
 * listen for these events nor forge them. Events dispatch synchronously across worlds.
 *
 * @param {'document' | 'document-request' | 'deliver'} name
 * @param {string} messageSecret
 */
export function geolocationBridgeEvent(name, messageSecret) {
    return `ddg-site-permissions-geolocation-${name}-${messageSecret}`;
}

/**
 * Names the event a media capture frame dispatches on its same-origin parent to ask whether the
 * parent's policy allows `feature`. The parent answers yes by cancelling it. Like
 * `geolocationBridgeEvent`, the name carries the session's `messageSecret`.
 *
 * @param {'camera' | 'microphone'} feature
 * @param {string} messageSecret
 */
export function mediaCapturePolicyEvent(feature, messageSecret) {
    return `ddg-site-permissions-media-capture-policy-${feature}-${messageSecret}`;
}
