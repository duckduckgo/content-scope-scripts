import ContentFeature from '../content-feature.js';
import { permissionsPolicy, randomHexToken } from './site-permissions/shared.js';

// Native code calls `getConstraints()` on this isolated-world global for each frame.
const POLICY_PROPERTY = '__ddgSitePermissionsGeolocationPolicy';

/**
 * Evaluates document policy for `sitePermissionsGeolocation` in the isolated world.
 * Signing state and asynchronous sandbox verdicts never enter the page's JavaScript realm.
 *
 * A child cannot reliably inspect its embedding element, so parent and child frames
 * exchange signed sandbox verdicts over `postMessage`, including ancestor restrictions.
 * Native code activates this feature by injecting the `signingToken` setting, which
 * authenticates those public messages without exposing the key.
 */
export default class SitePermissionsGeolocationPolicy extends ContentFeature {
    load() {
        const signingToken = this.getFeatureSetting('signingToken');
        if (typeof signingToken !== 'string' || signingToken.length === 0 || POLICY_PROPERTY in globalThis) {
            return;
        }
        const callThen = Function.prototype.call.bind(Promise.prototype.then);
        const scheduleTask = globalThis.setTimeout.bind(globalThis);
        const cancelTask = globalThis.clearTimeout.bind(globalThis);
        const apply = globalThis.Reflect.apply;
        const addWindowEventListener = globalThis.addEventListener;
        const postWindowMessage = globalThis.postMessage;
        const querySelectorAll = globalThis.Document?.prototype?.querySelectorAll;
        const elementQuerySelectorAll = globalThis.Element?.prototype?.querySelectorAll;
        const elementMatches = globalThis.Element?.prototype?.matches;
        const hasAttribute = globalThis.Element?.prototype?.hasAttribute;
        const nodeListLength = Object.getOwnPropertyDescriptor(globalThis.NodeList?.prototype ?? {}, 'length')?.get;
        const nodeListItem = globalThis.NodeList?.prototype?.item;
        const mapGet = globalThis.Map.prototype.get;
        const mapSet = globalThis.Map.prototype.set;
        const mapDelete = globalThis.Map.prototype.delete;
        const weakSetAdd = globalThis.WeakSet.prototype.add;
        const weakSetHas = globalThis.WeakSet.prototype.has;
        /** @type {typeof MutationObserver | undefined} */
        const NativeMutationObserver = globalThis.MutationObserver;
        const observeMutations = NativeMutationObserver?.prototype?.observe;
        const mutationRecordPrototype = globalThis.MutationRecord?.prototype ?? {};
        const mutationRecordType = Object.getOwnPropertyDescriptor(mutationRecordPrototype, 'type')?.get;
        const mutationRecordTarget = Object.getOwnPropertyDescriptor(mutationRecordPrototype, 'target')?.get;
        const mutationRecordAttributeName = Object.getOwnPropertyDescriptor(mutationRecordPrototype, 'attributeName')?.get;
        const mutationRecordOldValue = Object.getOwnPropertyDescriptor(mutationRecordPrototype, 'oldValue')?.get;
        const mutationRecordAddedNodes = Object.getOwnPropertyDescriptor(mutationRecordPrototype, 'addedNodes')?.get;
        const freeze = globalThis.Object.freeze;
        /** @type {((this: Element) => Window | null)[]} */
        const contentWindowGetters = [];
        for (const prototype of [globalThis.HTMLIFrameElement?.prototype, globalThis.HTMLFrameElement?.prototype]) {
            const getter = Object.getOwnPropertyDescriptor(prototype ?? {}, 'contentWindow')?.get;
            if (getter) {
                contentWindowGetters.push(getter);
            }
        }
        const nonce = randomHexToken();
        const documentID = randomHexToken();

        const textEncoder = globalThis.TextEncoder ? new globalThis.TextEncoder() : null;
        const encodeText = textEncoder?.encode.bind(textEncoder);
        /** @type {SubtleCrypto | undefined} */
        const subtleCrypto = globalThis.crypto?.subtle;
        const importHMACKey = subtleCrypto?.importKey.bind(subtleCrypto);
        const signHMAC = subtleCrypto?.sign.bind(subtleCrypto);
        const NativeUint8Array = globalThis.Uint8Array;
        /** @type {Promise<CryptoKey | null>} */
        const hmacKey =
            typeof importHMACKey === 'function' && encodeText
                ? callThen(
                      importHMACKey('raw', encodeText(signingToken), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
                      undefined,
                      () => null,
                  )
                : Promise.resolve(null);
        const numberToString = globalThis.Number.prototype.toString;
        const noncePattern = /^[0-9a-f]{32}$/;
        const testPattern = globalThis.RegExp.prototype.test;

        // This entire Promise graph belongs to the isolated content world.
        /**
         * @param {string} value
         * @param {(proof: string | null) => void} completion
         */
        const signSandboxProbe = (value, completion) => {
            callThen(
                hmacKey,
                (/** @type {CryptoKey | null} */ key) => {
                    if (!key || !signHMAC || !encodeText) {
                        completion(null);
                        return;
                    }
                    try {
                        callThen(
                            signHMAC('HMAC', key, encodeText(value)),
                            (/** @type {ArrayBuffer} */ signature) => {
                                const bytes = new NativeUint8Array(signature);
                                let result = '';
                                for (let index = 0; index < 32; index++) {
                                    const byte = bytes[index] ?? 0;
                                    const hex = apply(numberToString, byte, [16]);
                                    result += byte < 16 ? `0${hex}` : hex;
                                }
                                completion(result);
                            },
                            () => completion(null),
                        );
                    } catch (_) {
                        completion(null);
                    }
                },
                () => completion(null),
            );
        };

        // Cross-origin frames are unsupported. Same-origin frames also need the
        // platform's effective policy: origin alone cannot prove that an iframe's
        // allow attribute or response headers permit geolocation.
        const isSameOriginAsTopLevel = (() => {
            if (globalThis.top === globalThis.window) {
                return true;
            }
            try {
                return globalThis.top?.location.origin === globalThis.location.origin;
            } catch (_) {
                return false;
            }
        })();
        const hasNetworkOrigin =
            globalThis.origin !== 'null' &&
            globalThis.location.hostname.length > 0 &&
            (globalThis.location.protocol === 'https:' || globalThis.location.protocol === 'http:');
        const nativePermissionsPolicy = permissionsPolicy();
        const nativePolicyAllowsFeature = nativePermissionsPolicy?.allowsFeature;
        const policyAllowsGeolocation = () => {
            try {
                if (typeof nativePolicyAllowsFeature === 'function') {
                    return apply(nativePolicyAllowsFeature, nativePermissionsPolicy, ['geolocation']) === true;
                }
                // Native code checks the top-level response policy. Without this API,
                // subframe response policies cannot be verified, so deny subframes.
                return globalThis.top === globalThis.window;
            } catch (_) {
                return false;
            }
        };

        const sandboxProbeChannel = 'ddg-site-permissions-geolocation-sandbox';
        /** @param {string} childNonce */
        const sandboxRequestValue = (childNonce) => `${sandboxProbeChannel}:request:${childNonce}`;
        /**
         * @param {string} childNonce
         * @param {boolean} sandboxed
         */
        const sandboxResponseValue = (childNonce, sandboxed) => `${sandboxProbeChannel}:response:${childNonce}:${sandboxed ? '1' : '0'}`;
        const parentWindow = globalThis.parent;
        const hasOpaqueOrigin = globalThis.origin === 'null';
        /** @type {Map<string, MessageEventSource | null>} */
        const pendingSandboxProbeSources = new Map();
        /** @type {WeakSet<Element>} */
        const sandboxedEmbeddingFrames = new WeakSet();

        /**
         * @param {unknown} element
         * @param {boolean} [force]
         */
        const rememberSandboxedFrame = (element, force = false) => {
            try {
                if (apply(elementMatches, element, ['iframe,frame']) && (force || apply(hasAttribute, element, ['sandbox']))) {
                    apply(weakSetAdd, sandboxedEmbeddingFrames, [element]);
                }
            } catch (_) {}
        };

        /**
         * @param {unknown} root
         */
        const rememberSandboxedFrames = (root) => {
            rememberSandboxedFrame(root);
            if (!elementQuerySelectorAll || !nodeListLength || !nodeListItem) {
                return;
            }
            try {
                const elements = apply(elementQuerySelectorAll, root, ['iframe[sandbox],frame[sandbox]']);
                const elementCount = apply(nodeListLength, elements, []);
                for (let index = 0; index < elementCount; index++) {
                    rememberSandboxedFrame(apply(nodeListItem, elements, [index]), true);
                }
            } catch (_) {}
        };

        // Removing a sandbox attribute does not unsandbox the current document.
        // Remember observed restrictions so a later probe cannot overlook them.
        let sandboxHistoryAvailable = false;
        if (
            NativeMutationObserver &&
            observeMutations &&
            typeof elementMatches === 'function' &&
            typeof hasAttribute === 'function' &&
            typeof querySelectorAll === 'function' &&
            nodeListLength &&
            nodeListItem &&
            mutationRecordType &&
            mutationRecordTarget &&
            mutationRecordAttributeName &&
            mutationRecordOldValue &&
            mutationRecordAddedNodes
        ) {
            try {
                const sandboxHistoryObserver = new NativeMutationObserver((records) => {
                    for (let recordIndex = 0; recordIndex < records.length; recordIndex++) {
                        const record = records[recordIndex];
                        const recordType = apply(mutationRecordType, record, []);
                        if (recordType === 'attributes' && apply(mutationRecordAttributeName, record, []) === 'sandbox') {
                            const target = apply(mutationRecordTarget, record, []);
                            if (apply(mutationRecordOldValue, record, []) !== null || apply(hasAttribute, target, ['sandbox'])) {
                                rememberSandboxedFrame(target, true);
                            }
                        } else if (recordType === 'childList') {
                            const addedNodes = apply(mutationRecordAddedNodes, record, []);
                            const addedNodeCount = apply(nodeListLength, addedNodes, []);
                            for (let nodeIndex = 0; nodeIndex < addedNodeCount; nodeIndex++) {
                                rememberSandboxedFrames(apply(nodeListItem, addedNodes, [nodeIndex]));
                            }
                        }
                    }
                });
                apply(observeMutations, sandboxHistoryObserver, [
                    document,
                    {
                        attributes: true,
                        attributeFilter: ['sandbox'],
                        attributeOldValue: true,
                        childList: true,
                        subtree: true,
                    },
                ]);
                sandboxHistoryAvailable = true;
                const existingFrames = apply(querySelectorAll, document, ['iframe[sandbox],frame[sandbox]']);
                const existingFrameCount = apply(nodeListLength, existingFrames, []);
                for (let index = 0; index < existingFrameCount; index++) {
                    rememberSandboxedFrame(apply(nodeListItem, existingFrames, [index]), true);
                }
            } catch (_) {}
        }

        /**
         * @param {MessageEventSource | null} source
         * @returns {Element | null}
         */
        const embeddingFrameForSource = (source) => {
            if (!source || !querySelectorAll || !hasAttribute || !nodeListLength || !nodeListItem || contentWindowGetters.length === 0) {
                return null;
            }
            const elements = apply(querySelectorAll, document, ['iframe,frame']);
            const elementCount = apply(nodeListLength, elements, []);
            for (let index = 0; index < elementCount; index++) {
                const element = /** @type {Element} */ (apply(nodeListItem, elements, [index]));
                for (const getter of contentWindowGetters) {
                    try {
                        if (apply(getter, element, []) === source) {
                            return element;
                        }
                    } catch (_) {}
                }
            }
            return null;
        };

        /** @type {((sandboxed: boolean) => void) | undefined} */
        let finishSandboxProbe;
        /** @type {ReturnType<typeof setTimeout> | undefined} */
        let sandboxProbeTimeout;
        // Missing or unverifiable parent replies deny access after the timeout.
        /** @type {Promise<boolean>} */
        const sandboxVerdict =
            parentWindow === globalThis.window
                ? Promise.resolve(hasOpaqueOrigin)
                : new Promise((resolve) => {
                      let finished = false;
                      finishSandboxProbe = (sandboxed) => {
                          if (finished) {
                              return;
                          }
                          finished = true;
                          cancelTask(sandboxProbeTimeout);
                          resolve(sandboxed || hasOpaqueOrigin);
                      };
                      sandboxProbeTimeout = scheduleTask(() => finishSandboxProbe?.(true), 1_000);
                  });

        /**
         * @param {MessageEvent} event
         */
        const handleSandboxProbeMessage = (event) => {
            try {
                const data = event.data;
                const source = event.source;
                const kind = data?.kind;
                const childNonce = data?.nonce;
                const proof = data?.proof;
                const reportedSandboxed = data?.sandboxed;
                if (
                    data?.channel !== sandboxProbeChannel ||
                    typeof childNonce !== 'string' ||
                    !apply(testPattern, noncePattern, [childNonce])
                ) {
                    return;
                }

                if (kind === 'response') {
                    const finish = finishSandboxProbe;
                    if (
                        source !== parentWindow ||
                        typeof reportedSandboxed !== 'boolean' ||
                        typeof proof !== 'string' ||
                        proof.length !== 64 ||
                        !finish
                    ) {
                        return;
                    }
                    signSandboxProbe(sandboxResponseValue(childNonce, reportedSandboxed), (expectedProof) => {
                        if (expectedProof !== null && childNonce === nonce && proof === expectedProof) {
                            finish(reportedSandboxed);
                        }
                    });
                    return;
                }

                if (kind !== 'request' || typeof proof !== 'string' || proof.length !== 64) {
                    return;
                }
                const pinnedSource = apply(mapGet, pendingSandboxProbeSources, [childNonce]);
                if (pinnedSource && pinnedSource !== source) {
                    return;
                }
                const embeddingFrame = embeddingFrameForSource(source);
                if (!embeddingFrame) {
                    return;
                }
                apply(mapSet, pendingSandboxProbeSources, [childNonce, source]);
                const directlySandboxed =
                    !sandboxHistoryAvailable ||
                    apply(weakSetHas, sandboxedEmbeddingFrames, [embeddingFrame]) ||
                    apply(hasAttribute, embeddingFrame, ['sandbox']);
                const clearPendingSource = () => {
                    apply(mapDelete, pendingSandboxProbeSources, [childNonce]);
                };
                signSandboxProbe(sandboxRequestValue(childNonce), (expectedProof) => {
                    if (expectedProof === null || proof !== expectedProof) {
                        clearPendingSource();
                        return;
                    }
                    try {
                        callThen(
                            sandboxVerdict,
                            (/** @type {boolean} */ ancestorSandboxed) => {
                                const sandboxed = ancestorSandboxed || directlySandboxed;
                                signSandboxProbe(sandboxResponseValue(childNonce, sandboxed), (responseProof) => {
                                    clearPendingSource();
                                    if (responseProof !== null) {
                                        try {
                                            apply(postWindowMessage, source, [
                                                {
                                                    channel: sandboxProbeChannel,
                                                    kind: 'response',
                                                    nonce: childNonce,
                                                    sandboxed,
                                                    proof: responseProof,
                                                },
                                                '*',
                                            ]);
                                        } catch (_) {}
                                    }
                                });
                            },
                            clearPendingSource,
                        );
                    } catch (_) {
                        clearPendingSource();
                    }
                });
            } catch (_) {}
        };

        apply(addWindowEventListener, globalThis, [
            'message',
            (/** @type {MessageEvent} */ event) => {
                handleSandboxProbeMessage(event);
            },
            false,
        ]);

        if (parentWindow !== globalThis.window) {
            try {
                if (nonce === null) {
                    finishSandboxProbe?.(true);
                } else {
                    signSandboxProbe(sandboxRequestValue(nonce), (proof) => {
                        if (proof === null) {
                            finishSandboxProbe?.(true);
                            return;
                        }
                        try {
                            apply(postWindowMessage, parentWindow, [
                                {
                                    channel: sandboxProbeChannel,
                                    kind: 'request',
                                    nonce,
                                    proof,
                                },
                                '*',
                            ]);
                        } catch (_) {
                            finishSandboxProbe?.(true);
                        }
                    });
                }
            } catch (_) {
                finishSandboxProbe?.(true);
            }
        }

        const isSecureContext = globalThis.isSecureContext === true;
        const isFramePolicyEligible = hasNetworkOrigin && isSameOriginAsTopLevel;
        const getConstraints = () => {
            const requestedDocumentID = documentID;
            return callThen(sandboxVerdict, (/** @type {boolean} */ isSandboxed) =>
                freeze({
                    documentID: requestedDocumentID,
                    isSecureContext,
                    isPolicyAllowed: requestedDocumentID !== null && isFramePolicyEligible && policyAllowsGeolocation(),
                    isSandboxed,
                }),
            );
        };

        Object.defineProperty(globalThis, POLICY_PROPERTY, {
            configurable: false,
            value: freeze({ documentID, getConstraints }),
        });
    }
}
