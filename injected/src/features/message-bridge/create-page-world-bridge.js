import * as capturedGlobals from '../../captured-globals.js';
import {
    InstallProxy,
    ProxyNotification,
    ProxyRequest,
    ProxyResponse,
    SubscriptionRequest,
    SubscriptionResponse,
    SubscriptionUnsubscribe,
} from './schema.js';

/**
 * @import { MessagingInterface } from "./schema.js"
 * @typedef {Pick<import("../../captured-globals.js"),
 *    "dispatchEvent" | "addEventListener" | "removeEventListener" | "CustomEvent" | "String" | "mathRandom">
 * } Captured
 */
/** @type {Captured} */
const captured = capturedGlobals;

/**
 * This part can be called from any script.
 *
 * @param {string} featureName
 * @param {string} [token]
 * @return {MessagingInterface}
 */
export function createPageWorldBridge(featureName, token) {
    const appendToken = (eventName) => {
        return `${eventName}-${token}`;
    };

    /**
     * Create the sender to centralize the sending logic
     * @param {{name: string} & Record<string, any>} incoming
     */
    const send = (incoming) => {
        // when the token is absent, just silently fail
        if (!token) return;
        const event = new captured.CustomEvent(appendToken(incoming.name), { detail: incoming });
        captured.dispatchEvent(event);
    };

    send(new InstallProxy({ featureName }));

    return createMessagingInterface(featureName, send, appendToken);
}

function random() {
    return captured.String(captured.mathRandom());
}

/**
 * @param {string} featureName
 * @param {(evt: {name: string} & Record<string, any>) => void} send
 * @param {(s: string) => string} appendToken
 * @returns {MessagingInterface}
 */
function createMessagingInterface(featureName, send, appendToken) {
    return {
        /**
         * @param {string} method
         * @param {Record<string, any>} params
         */
        notify(method, params) {
            send(
                new ProxyNotification({
                    method,
                    params,
                    featureName,
                }),
            );
        },

        /**
         * @param {string} method
         * @param {Record<string, any>} params
         * @returns {Promise<any>}
         */
        request(method, params) {
            const id = random();

            send(
                new ProxyRequest({
                    method,
                    params,
                    featureName,
                    id,
                }),
            );

            return new Promise((resolve, reject) => {
                const responseName = appendToken(ProxyResponse.NAME + '-' + id);
                const handler = (/** @type {CustomEvent<unknown>} */ e) => {
                    const response = ProxyResponse.create(e.detail);
                    if (response && response.id === id) {
                        if ('error' in response && response.error) {
                            reject(new Error(response.error.message));
                        } else if ('result' in response) {
                            resolve(response.result);
                        }
                        captured.removeEventListener(responseName, handler);
                    }
                };
                captured.addEventListener(responseName, handler);
            });
        },

        /**
         * @param {string} name
         * @param {(d: any) => void} callback
         * @returns {() => void}
         */
        subscribe(name, callback) {
            const id = random();

            send(
                new SubscriptionRequest({
                    subscriptionName: name,
                    featureName,
                    id,
                }),
            );

            const handler = (/** @type {CustomEvent<unknown>} */ e) => {
                const subscriptionEvent = SubscriptionResponse.create(e.detail);
                if (subscriptionEvent) {
                    const { id: eventId, params } = subscriptionEvent;
                    if (eventId === id) {
                        callback(params);
                    }
                }
            };

            const type = appendToken(SubscriptionResponse.NAME + '-' + id);
            captured.addEventListener(type, handler);

            return () => {
                captured.removeEventListener(type, handler);
                const evt = new SubscriptionUnsubscribe({ id });
                send(evt);
            };
        },
    };
}
