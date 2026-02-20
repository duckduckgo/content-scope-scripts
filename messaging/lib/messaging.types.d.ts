interface UnstableWebkit {
    messageHandlers: Record<
        string,
        {
            postMessage?: (...args: unknown[]) => void;
        }
    >;
}

interface Navigator {
    /**
     * DuckDuckGo-specific extension used by WebKit transport + tests.
     *
     * Subscriptions and response callbacks are exposed under
     * `navigator.duckduckgo.messageHandlers[name](event)`.
     */
    duckduckgo?: {
        messageHandlers: Record<string, (...args: unknown[]) => unknown>;
        [key: string]: unknown;
    };
}

interface UnstableMockCall {
    payload: import('../index.js').RequestMessage | import('../index.js').NotificationMessage | import('../index.js').Subscription;
    response?: Record<string, unknown>;
}

interface Window {
    webkit: UnstableWebkit;
    /** Special-pages test-time subscription handler (WebKit) */
    onUpdate?: (...args: unknown[]) => unknown;
    /** DuckPlayer test-time subscription handler (WebKit) */
    onUserValuesChanged?: (...args: unknown[]) => unknown;
    windowsInteropPostMessage: Window['postMessage'];
    windowsInteropAddEventListener: Window['addEventListener'];
    windowsInteropRemoveEventListener: Window['removeEventListener'];
    __playwright_01: {
        mockResponses: Record<string, import('../index.js').MessageResponse>;
        subscriptionEvents: import('../index.js').SubscriptionEvent[];
        publishSubscriptionEvent?: (evt: import('../index.js').SubscriptionEvent) => void;
        mocks: {
            outgoing: UnstableMockCall[];
        };
    };
}

declare let windowsInteropPostMessage: unknown;
declare let windowsInteropAddEventListener: unknown;
declare let windowsInteropRemoveEventListener: unknown;
