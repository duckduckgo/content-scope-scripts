---
title: Update Notification
---

## Initial Data 

- Add the key `updateNotification` to `initialSetup`
- The data takes the following form: {@link "NewTab Messages".UpdateNotificationData}
- Example from `initialSetup`

*Signal there are no notes to show* 
```json
{
  "...": "...",
  "updateNotification": {
    "content": null
  }
}
```

Signal there are notes to show.

```json
{
  "...": "...",
  "updateNotification": {
    "content": {
      "version": "1.98.0",
      "notes": ["Bug fixes and improvements"]
    }
  }
}
```

**NOTE**: `updateNotification` and it's field `content` are **required**. Set `content` to `null` to indicate 
nothing to show. This mirrors how RMF is designed

## Subscriptions:
- {@link "NewTab Messages".UpdateNotificationOnDataUpdateSubscription `updateNotification_onDataUpdate`}.
    - Sends fresh {@link "NewTab Messages".UpdateNotificationData} whenever needed.
    - For example, it might send `{ content: null }` to remove existing notes
    - Or, it might send fresh at any point

## Notifications:
- {@link "NewTab Messages".UpdateNotificationDismissNotification `updateNotification_dismiss`}
    - Sent when the user chooses to dismiss the release notes
