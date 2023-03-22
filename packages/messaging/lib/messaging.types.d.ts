interface UnstableWebkit {
  messageHandlers: Record<
    string,
    {
      postMessage?: (...args: unknown[]) => void
    }
  >
}

interface Window {
  webkit: UnstableWebkit
}

declare let windowsInteropPostMessage: any
declare let windowsInteropAddEventListener: any
declare let windowsInteropRemoveEventListener: any
