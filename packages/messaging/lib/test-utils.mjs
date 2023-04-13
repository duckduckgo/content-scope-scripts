/**
 * @typedef {import("../../messaging/lib/windows.js").WindowsRequestMessage} WindowsRequestMessage
 * @typedef {import("../../messaging/lib/windows.js").WindowsNotification} WindowsNotification
 * @typedef {import("../../messaging/index.js").SubscriptionEvent} SubscriptionEvent
 * @typedef {import("../../messaging/index.js").MessageResponse} MessageResponse
 * @typedef {import("../../messaging/index.js").RequestMessage} RequestMessage
 * @typedef {import("../../messaging/index.js").NotificationMessage} NotificationMessage
 * @typedef {WindowsRequestMessage | WindowsNotification | SubscriptionEvent} AnyWindowsMessage
 */
/**
 * Install a mock interface for windows messaging
 * @param {{messagingContext: import('../index.js').MessagingContext}} params
 */
export function mockWindows(params) {
    window.__playwright_01 = {
        mockResponses: {},
        subscriptionEvents: [],
        mocks: {
            outgoing: []
        }
    }
    const listeners = []
    // @ts-ignore
    window.chrome = {};
    // @ts-ignore
    window.chrome.webview = {
        /**
         * @param {AnyWindowsMessage} input
         */
        postMessage (input) {

            // subscription events come through here also
            if ('subscriptionName' in input) {
                setTimeout(() => {
                    for (const listener of listeners) {
                        listener({ origin: window.origin, data: input })
                    }
                }, 0);
                return;
            }
            /** @type {NotificationMessage | RequestMessage} */
            let msg = {
                context: input.Feature,
                featureName: input.SubFeatureName,
                params: input.Data,
                method: input.Name,
                id: undefined,
            };

            // add the Id if it was a RequestMessage
            if ('Id' in input) {
                msg.id = input.Id
            }

            // record the call
            window.__playwright_01.mocks.outgoing.push(JSON.parse(JSON.stringify({
                payload: msg
            })))

            // if there's no 'id' field, we don't need to respond
            if (!('id' in msg)) return;

            // if the mocked response is absent, bail with an error
            if (!(msg.method in window.__playwright_01.mockResponses)) {
                throw new Error('response not found for ' + msg.method)
            }

            // now access the response
            const response = window.__playwright_01.mockResponses[msg.method]

            // If we get here, it needed a response **and** we have a value for it
            setTimeout(() => {
                for (const listener of listeners) {
                    listener({
                        origin: window.origin,
                        /** @type {Omit<MessageResponse, 'error'>} */
                        data: {
                            result: response,
                            context: msg.context,
                            featureName: msg.featureName,
                            // @ts-ignore - shane: fix this
                            id: msg.id,
                        },
                    })
                }
            }, 0)
        },
        removeEventListener (_name, _listener) {
            const index = listeners.indexOf(_listener)
            if (index > -1) {
                listeners.splice(index, 1)
            }
        },
        addEventListener (_name, listener) {
            listeners.push(listener)
        }
    }
}

/**
 * @param {object} params
 * @param {Record<string, any>} params.responses
 */
export function mockResponses(params) {
    window.__playwright_01.mockResponses = {
        ...window.__playwright_01.mockResponses,
        ...params.responses
    }
}

/**
 * @param {object} params
 * @param {string} params.method
 * @param {number} params.count
 */
export function waitForCallCount(params) {
    const outgoing = window.__playwright_01.mocks.outgoing
    const filtered = outgoing.filter(({ payload }) => params.method === payload.method)
    return filtered.length === params.count
}

/**
 * Just access to readOutgoingMessages
 * @return {any}
 */
export function readOutgoingMessages() {
    return window.__playwright_01.mocks.outgoing
}

/**
 * @param {object} params
 * @param {import('../index.js').MessagingContext} params.messagingContext
 * @param {string} params.name
 * @param {Record<string, any>} params.payload
 * @param {PlatformInfo} params.platform
 */
export function simulateSubscriptionMessage(params) {
    switch (params.platform.name) {
    case "windows": {
        // @ts-expect-error
        window.chrome.webview.postMessage({
            context: params.messagingContext.context,
            featureName: params.messagingContext.featureName,
            subscriptionName: params.name,
            params: params.payload,
        })
        break;
    }
    default: throw new Error('platform not supported yet: ' + params.platform.name)
    }
}

export class PlatformInfo {
    /**
     * @param {object} params
     * @param {"apple" | "windows"} params.name
     */
    constructor (params) {
        this.name = params.name;
    }
}
