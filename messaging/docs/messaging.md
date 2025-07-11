---
title: Messaging
children:
  - ./implementation-guide.md
  - ./examples.md
---

# Messaging 

An abstraction for communications between JavaScript and host platforms. Note: We avoid the term 'client' in these docs 
since it can be confused with the Browser itself, which is often referred to as the 'client' in other contexts.

The purpose of this library is to enable three idiomatic JavaScript methods for communicating with native platforms:

**tl;dr:**

```javascript
// notification
messaging.notify("helloWorld", { some: "data" })

// requests
const response = await messaging.request("helloWorld", { some: "data" });

// subscriptions
const unsubscribe = messaging.subscribe("helloWorld", (data) => {
   console.log(data)
});
```

## Notifications

Notifications do not produce a response, they are fire+forget by nature. A call to `.notify(method, params)` will never 
throw an exception, so is safe to call at all times. If you need acknowledgement, or a response, use a Request instead.

```js
// with params
messaging.notify("helloWorld", { some: "data" })

// without params
messaging.notify("helloWorld")
```

## Requests

Request should be used when you require acknowledgement or a response. Calls to `.request(method, params)` return a promise
that can be awaited. Note: calls to `.request()` can throw exceptions - this is deliberate to ensure compatibility with 
JavaScript APIs like `Promise.all([...])`.

**A single request->response** 
```js
const response = await messaging.request("helloWorld", { some: "data" });
```

**With try/catch**
```js
try {
    const response = await messaging.request("helloWorld", { some: "data" });
    // use the response
} catch (e) {
    // handle the error
}
```

### Ignoring errors (default values)
In cases where you don't need to handle the error, use the await/catch pattern to simulate a default value

```js
const response = await messaging.request("helloWorld", { some: "data" }).catch(() => null);
```

**With Platform APIs, like `Promise.all`**
```js
const request1 = messaging.request("helloWorld", { some: "data" });
const request2 = messaging.request("other");

const [response1, response2] = await Promise.all([request1, request2])
```

## Subscriptions

A subscription is created in JavaScript as a means for the host platform to _push_ values. Note: Subscriptions are created
in JavaScript and DO NOT include acknowledgment from the host platform. If you need that kind of guarantee, 
use a request first successful request->response.

```js
const unsubscribe = messaging.subscribe("helloWorld", (data) => {
   console.log(data)
});
```
