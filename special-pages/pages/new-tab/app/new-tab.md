---
title: New Tab Page
---

## Requests

- {@link "NewTab Messages".InitialSetupRequest `initialSetup`}
  - Returns {@link "NewTab Messages".InitialSetupResponse}
  - See the `initialSetupResponse` section of [example of initial data](../../../messages/new-tab/examples/widgets.js)

## Notifications

- {@link "NewTab Messages".ContextMenuNotification `contextMenu`}
  - Sent when the user right-clicks in the page
  - Note: Other widgets might prevent this (and send their own, eg: favorites)
  - Sends: {@link "NewTab Messages".ContextMenuNotify}
  - Example:

```json
{
  "visibilityMenuItems": [
    {
      "id": "favorites",
      "title": "Favorites"
    },
    {
      "id": "privacyStats",
      "title": "Privacy Stats"
    }
  ]
}
```

- {@link "NewTab Messages".ReportInitExceptionNotification `reportInitException`}
  - Sent when the application fails to initialize (for example, a JavaScript exception prevented it)
  - Sends: `{ message: string }` - see {@link "NewTab Messages".ReportInitExceptionNotify}

- {@link "NewTab Messages".ReportPageExceptionNotification `reportPageException`}
  - Sent when the application failed after initialization (for example, a JavaScript exception prevented it)
  - Sends: `{ message: string }` - see {@link "NewTab Messages".ReportPageExceptionNotify}
