/**
 * @typedef {import("../../messaging/lib/windows.js").WindowsRequestMessage} WindowsRequestMessage
 * @typedef {import("../../messaging/lib/windows.js").WindowsNotification} WindowsNotification
 * @typedef {import("../../messaging/index.js").SubscriptionEvent} SubscriptionEvent
 * @typedef {import("../../messaging/index.js").MessageResponse} MessageResponse
 * @typedef {import("../../messaging/index.js").RequestMessage} RequestMessage
 * @typedef {import("../../messaging/index.js").NotificationMessage} NotificationMessage
 * @typedef {WindowsRequestMessage | WindowsNotification | SubscriptionEvent} AnyWindowsMessage
 * @typedef {import("../../../integration-test/playwright/type-helpers.mjs").PlatformInfo} PlatformInfo
 */
/**
 * Install a mock interface for windows messaging
 * @param {{
 *  messagingContext: import('../index.js').MessagingContext,
 *  responses: Record<string, any>
 *  errors: Record<string, any>
 * }} params
 */
export function mockWindowsMessaging(params) {
    window.__playwright_01 = {
        mockResponses: params.responses,
        errorResponses: {},
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
                msg = {
                    ...msg,
                    id: input.Id,
                }
            }

            // record the call
            window.__playwright_01.mocks.outgoing.push(JSON.parse(JSON.stringify({
                payload: msg
            })))

            // if there's no 'id' field, we don't need to respond
            if (!('id' in msg)) return;


            // If we get here, it needed a response **and** we have a value for it
            setTimeout(() => {

                if (msg.method in window.__playwright_01.errorResponses) {
                    const error = window.__playwright_01.errorResponses[msg.method];
                    for (const listener of listeners) {
                        listener({
                            origin: window.origin,
                            /** @type {Omit<MessageResponse, 'result'>} */
                            data: {
                                error: error,
                                context: msg.context,
                                featureName: msg.featureName,
                                // @ts-ignore - shane: fix this
                                id: msg.id,
                            },
                        })
                    }
                    return;
                }

                // if the mocked response is absent, bail with an error
                if (!(msg.method in window.__playwright_01.mockResponses)) {
                    throw new Error('response not found for ' + msg.method)
                }

                // now access the response
                const response = window.__playwright_01.mockResponses[msg.method]

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
 * Install a mock interface for windows messaging
 * @param {{
 *  messagingContext: import('../index.js').MessagingContext,
 *  responses: Record<string, any>
 *  errors: Record<string, any>
 * }} params
 */
export function mockWebkitMessaging(params) {
    window.__playwright_01 = {
        mockResponses: params.responses,
        errorResponses: {},
        subscriptionEvents: [],
        mocks: {
            outgoing: []
        }
    }
    window.webkit = {
        messageHandlers: {
            [params.messagingContext.context]: {
                /**
                 * @param {RequestMessage | NotificationMessage} msg
                 */
                async postMessage (msg) {
                    window.__playwright_01.mocks.outgoing.push(JSON.parse(JSON.stringify({
                        payload: msg
                    })))

                    // force a 'tick' to allow tests to reset mocks before reading responses
                    await new Promise(res => setTimeout(res, 0));

                    // if it's a notification, simulate the empty response and don't check for a response
                    if (!('id' in msg)) {
                        return JSON.stringify({});
                    }

                    if (msg.method in window.__playwright_01.errorResponses) {
                        const error = window.__playwright_01.errorResponses[msg.method];
                        throw new Error(error.message)
                    }

                    if (!(msg.method in window.__playwright_01.mockResponses)) {
                        throw new Error('response not found for ' + msg.method)
                    }

                    const response = window.__playwright_01.mockResponses[msg.method]

                    /** @type {Omit<MessageResponse, 'error'>} */
                    const r = {
                        result: response,
                        context: msg.context,
                        featureName: msg.featureName,
                        // @ts-ignore - shane: fix this
                        id: msg.id,
                    }

                    return JSON.stringify(r)
                }
            }
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
 * @param {Record<string, import("../index.js").MessageError>} params.errors
 */
export function mockErrors(params) {
    window.__playwright_01.errorResponses = {
        ...window.__playwright_01.errorResponses,
        ...params.errors
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
 * simulate what happens in Windows environment where globals get erased
 * @param {string} js
 * @param {Record<string, any>} replacements
 */
export function wrapWindowsScripts(js, replacements) {
    for (let [find, replace] of Object.entries(replacements)) {
        js = js.replace(find, JSON.stringify(replace));
    }
    return `
        (() => {
            try {
                window.windowsInteropPostMessage = window.chrome.webview.postMessage;
                window.windowsInteropAddEventListener = window.chrome.webview.addEventListener;
                window.windowsInteropRemoveEventListener = window.chrome.webview.removeEventListener;
                delete window.chrome.webview.postMessage;
                delete window.chrome.webview.addEventListener;
                delete window.chrome.webview.removeEventListener;
                ${js}
            } catch (e) {
                console.error(e)
            }
        })();
    `
}

/**
 * simulate what happens in Windows environment where globals get erased
 * @param {string} js
 * @param {Record<string, any>} replacements
 */
export function wrapWebkitScripts(js, replacements) {
    for (let [find, replace] of Object.entries(replacements)) {
        js = js.replace(find, JSON.stringify(replace));
    }
    return js;
}

/**
 * @param {object} params
 * @param {import('../index.js').MessagingContext} params.messagingContext
 * @param {string} params.name
 * @param {Record<string, any>} params.payload
 * @param {NonNullable<ImportMeta['injectName']>} params.injectName
 */
export function simulateSubscriptionMessage(params) {
    const subscriptionEvent = {
        context: params.messagingContext.context,
        featureName: params.messagingContext.featureName,
        subscriptionName: params.name,
        params: params.payload,
    }
    switch (params.injectName) {
    case "windows": {
        // @ts-expect-error
        const fn = window.chrome?.webview?.postMessage || window.windowsInteropPostMessage;
        fn(subscriptionEvent)
        break;
    }
    case "apple":
    case "apple-isolated": {
        if (!(params.name in window)) throw new Error('subscription fn not found for: ' + params.injectName);
        window[params.name](subscriptionEvent);
        break;
    }
    default: throw new Error('platform not supported yet: ' + params.injectName)
    }
}

