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
  response?: Record<string, any>;
}

interface Window {
  webkit: UnstableWebkit
  __playwright_01: {
    mockResponses: Record<string, import('../index.js').MessageResponse>,
    subscriptionEvents: import('../index.js').SubscriptionEvent[],
    mocks: {
      outgoing: UnstableMockCall[],
    }
  }
}

declare let windowsInteropPostMessage: any
declare let windowsInteropAddEventListener: any
declare let windowsInteropRemoveEventListener: any
