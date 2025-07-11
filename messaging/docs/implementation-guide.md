---
title: Implementation Guide
---

# Messaging Implementation Guide

## Step 1) Receiving a notification or request message:

Each platform will 'receive' messages according to their own best practices, the following spec describes everything **after**
the message has been delivered from the clientside JavaScript (deliberately avoiding the platform specifics of *how* messages arrive)

For example, in Android this would be what happens within a `@Javascript` Interface, but on macOS it would be within
the WebKit messaging protocol, etc.

### Algorithm

1. let `s` be an incoming raw `JSON` payload
2. let `msg` be the result of parsing `s` into key/value pairs
    - 2.1 Note: 'parsing' here may not be required if the platform in question receives JSON data directly (ie: JavaScript environments)
3. if parsing was not successful, log an "invalid message" exception and exit. 
4. validate that `msg.context` exists and is a `string` value
5. validate that `msg.featureName` exists and is a `string` value
6. validate that `msg.method` exists and is a `string` value
    - 6.1 if `context`, `featureName` or `method` are invalid (not a string, or missing), log an "invalid message" Exception and exit.
7. let `params` be a reference to `msg.params` or a new, empty key/value structure
8. if `params` is not a valid key/value structure, log an "invalid params" exception and exit.
9. if the `msg.id` field is absent, then:
    - 9.1. mark `msg` as being of type {@link Messaging.NotificationMessage}
10. if the `msg.id` field is present, then:
    - 10.1. validate that `msg.id` a string value, log an "invalid id" exception if it isn't, and exit.
    - 10.2. mark `msg` as being of type {@link Messaging.RequestMessage}
11. At this point, you should have a structure that represents either a {@link Messaging.NotificationMessage} or
    {@link Messaging.RequestMessage}. Then move to Step 2)


## Step 2) Choosing and executing a handler

Once you've completed Step 1), you'll know whether you are dealing with a notification or a request (something you need
to respond to). At this point you don't know which feature will attempt the message, you just know the format was correct.

### Algorithm

1. let `feature` be the result of looking up a feature that matches name `msg.featureName`
2. if `feature` is not found:
   - 2.1 if `msg` was marked as type `Request`, return a "feature not found" [Error Response](./examples.md#error-response)
   - 2.2 if `msg` was marked as type `Notification`, optionally log a "feature not found" exception and exit
3. let `handler` be the result of calling `feature.handlerFor(msg.method)`
4. if `handler` is not found:
    - 4.1 if `msg` was marked as type `Request`, return a "method not found" [Error Response](./examples.md#error-response)
    - 4.2 if `msg` was marked as type `Notification`, optionally log a "feature not found" exception and exit
5. execute `handler` with `msg.params`
    - 5.1. if `msg` was marked as a {@link Messaging.NotificationMessage} (via step 1), then:
        1. do not wait for a response
        2. if the platform must respond (to prevent errors), then:
            1. respond with an empty key/value JSON structure `{}`
    - 5.2. if `msg` was marked as a {@link Messaging.RequestMessage}, then:
        1. let `response` be a new instance of {@link Messaging.MessageResponse}
            1. assign `msg.context` to `response.context`
            2. assign `msg.featureName` to `response.featureName`
            3. assign `msg.id` to `response.id`
        2. let `result` be the return value of _executing_ `handler(msg.params)`
        3. if `result` is empty, assign `result` to an empty key/value structure
        4. if an **error** occurred during execution, then:
            1. let `error` be a new instance of {@link Messaging.MessageError}
            2. assign a descriptive message if possible, to `error.message`
            3. assign `error` to `response.error`
        5. if an error **did not occur**, assign `result` to `response.result`
        6. let `json` be the string result of converting `response` into JSON
        7. deliver the JSON response in the platform-specified way

## Step 3) Push-based messaging

1. let `event` be a new instance of {@link Messaging.SubscriptionEvent}
2. assign `event.context` to the target context
3. assign `event.featureName` to the target feature
4. assign `event.subscriptionName` to the target subscriptionName
5. if the message contains data, then
    1. let `params` be a key/value structure
        1. Note: only key/value structures are permitted.
    2. assign `params` to `event.params`
6. let `json` be the string result of converting `event` into JSON
7. deliver the JSON response in the platform-specified way
