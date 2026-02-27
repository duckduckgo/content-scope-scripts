# Messaging

Abstraction layer for web↔native messaging across DuckDuckGo platforms (macOS, iOS, Android, Windows, Extensions).

## Structure

```
index.js              # Main entry — Messaging class, MessagingContext, platform configs
schema.js             # Message schemas (NotificationMessage, RequestMessage, etc.)
native.js             # Native transport for embedded special pages
lib/
  webkit.js           # WebkitMessagingTransport (Apple platforms)
  windows.js          # WindowsMessagingTransport
  android.js          # AndroidMessagingTransport
  android-adsjs.js    # Android ads-specific transport
  typed-messages.js   # createTypedMessages() utility
  test-utils.mjs      # TestTransportConfig for testing
docs/
  messaging.md        # Protocol specification
  implementation-guide.md  # Native-side implementation algorithm
  examples.md         # JSON payload examples
```

## Core API

Three communication patterns — all require a `MessagingContext` and platform-specific config:

```javascript
// Fire-and-forget notification
messaging.notify("methodName", { some: "data" })

// Async request → response
const response = await messaging.request("methodName", { some: "data" })

// Push-based subscription
const unsubscribe = messaging.subscribe("methodName", (data) => console.log(data))
```

## Platform Configs

Each platform has its own config class:
- `WebkitMessagingConfig` — Apple (webkit message handlers)
- `WindowsMessagingConfig` — Windows (chrome.webview.postMessage)
- `AndroidMessagingConfig` — Android (@JavascriptInterface)
- `TestTransportConfig` — Testing (in `lib/test-utils.mjs`)

## Testing

Tests are in the parent project. Use `TestTransportConfig` from `lib/test-utils.mjs` to mock messaging in tests.

## Notes

- Message format follows [JSON-RPC](https://www.jsonrpc.org/specification)-inspired structure with `context`, `featureName`, `method`, and optional `params`/`id`
- See `docs/messaging.md` for the full protocol specification
- See `docs/implementation-guide.md` for the native-side implementation algorithm
