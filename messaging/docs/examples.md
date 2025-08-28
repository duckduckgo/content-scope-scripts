---
title: Example JSON payloads
---

## Example JSON payloads

## Notifications

**{@link Messaging.NotificationMessage}**

```json
{
  "context": "contentScopeScripts",
  "featureName": "duckPlayer",
  "method": "saveUserValues"
}
```

**{@link Messaging.NotificationMessage} with params**

```json
{
  "context": "contentScopeScripts",
  "featureName": "duckPlayer",
  "method": "saveUserValues",
  "params": { "hello": "world" }
}
```

**{@link Messaging.NotificationMessage} with `invalid` params**

```json
{
  "context": "contentScopeScripts",
  "featureName": "duckPlayer",
  "method": "getUserValues",
  "params": "oops! <- cannot be a string/number/boolean/null"
}
```

## Requests

**{@link Messaging.RequestMessage}**

```json
{
  "context": "contentScopeScripts",
  "featureName": "duckPlayer",
  "method": "getUserValues",
  "id": "abc123"
}
```


**{@link Messaging.RequestMessage} with params**

```json
{
  "context": "contentScopeScripts",
  "featureName": "duckPlayer",
  "method": "getUserValues",
  "params": { "hello": "world" },
  "id": "abc123"
}
```


**{@link Messaging.RequestMessage} with invalid params**

```json
{
  "context": "contentScopeScripts",
  "featureName": "duckPlayer",
  "method": "getUserValues",
  "params": "oops! <- cannot be a string/number/boolean/null",
  "id": "abc123"
}
```

## Responses

**{@link Messaging.MessageResponse} with data**

```json
{
  "context": "contentScopeScripts",
  "featureName": "duckPlayer",
  "id": "abc123",
  "result": { "hello":  "world" }
}
```

## Error Response

**{@link Messaging.MessageResponse} with error**

```json
{
  "context": "contentScopeScripts",
  "featureName": "duckPlayer",
  "id": "abc123",
  "error": {
    "message": "Method not found"
  }
}
```


## Subscriptions

**{@link Messaging.SubscriptionEvent} without data**

```json
{
  "context": "contentScopeScripts",
  "featureName": "duckPlayer",
  "subscriptionName": "onUserValuesUpdated"
}
```

**{@link Messaging.SubscriptionEvent} with data**

```json
{
  "context": "contentScopeScripts",
  "featureName": "duckPlayer",
  "subscriptionName": "onUserValuesUpdated",
  "params": { "hello":  "world" }
}
```