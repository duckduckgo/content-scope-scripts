interface UnstableWebkit {
  messageHandlers: Record<
    string,
    {
      postMessage?: (...args: unknown[]) => void
    }
  >
}

interface UnstableMockCall {
  payload: import('../index.js').RequestMessage;
  response?: Record<string, unknown>;
}

interface Window {
  webkit: UnstableWebkit
  __playwright_01: {
    mockResponses: Record<string, import('../index.js').MessageResponse>,
    errorResponses: Record<string, import('../index.js').MessageError>,
    subscriptionEvents: import('../index.js').SubscriptionEvent[],
    mocks: {
      outgoing: UnstableMockCall[],
    }
  }
}

declare let windowsInteropPostMessage: unknown
declare let windowsInteropAddEventListener: unknown
declare let windowsInteropRemoveEventListener: unknown
