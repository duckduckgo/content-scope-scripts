---
title: New Tab Page
children: 
  - ./widget-list/widget-config.md
  - ./remote-messaging-framework/rmf.md
  - ./update-notification/update-notification.md
  - ./privacy-stats/privacy-stats.md
  - ./favorites/favorites.md
  - ./next-steps/next-steps.md
  - ./customizer/customizer.md
---

## Requests

- {@link "NewTab Messages".InitialSetupRequest `initialSetup`}
  - Returns {@link "NewTab Messages".InitialSetupResponse}
  - See the `initialSetupResponse` section of [example of initial data](../messages/examples/widgets.js)
  - See also
     - [Widget Config](./widget-list/widget-config.md) for the initial page widgets
     - [Update Notification](./update-notification/update-notification.md) for the optional data
     - [Customizer Drawer Feature Flags](./customizer/customizer.md) for optional feature flags like the customizer drawer
     about release notes (windows only).

## Notifications

### {@link "NewTab Messages".ContextMenuNotification `contextMenu`}
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

### {@link "NewTab Messages".TelemetryEventNotification `telemetryEvent`}
  - These are generic events that might be useful to observe. For example, you can use these to decide when to send pixels.
  - Sends a standard format `{ attributes: { name: string', value?: any  } }` - see {@link "NewTab Messages".TelemetryEventNotification `telemetryEvent`}
  - Example:

```json
{
  "attributes": {
    "name": "stats_toggle",
    "value": "show_more"
  }
}
```

### {@link "NewTab Messages".ReportInitExceptionNotification `reportInitException`}
  - Sent when the application fails to initialize (for example, a JavaScript exception prevented it)
  - Sends: `{ message: string }` - see {@link "NewTab Messages".ReportInitExceptionNotify}

### {@link "NewTab Messages".ReportPageExceptionNotification `reportPageException`}
  - Sent when the application failed after initialization (for example, a JavaScript exception prevented it)
  - Sends: `{ message: string }` - see {@link "NewTab Messages".ReportPageExceptionNotify}
