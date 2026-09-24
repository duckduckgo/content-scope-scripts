---
title: New Tab Page
children:
  - ./widget-list/widget-config.md
  - ./remote-messaging-framework/rmf.md
  - ./update-notification/update-notification.md
  - ./privacy-stats/privacy-stats.md
  - ./activity/activity.md
  - ./favorites/favorites.md
  - ./next-steps/next-steps.md
  - ./next-steps-list/next-steps-list.md
  - ./customizer/customizer.md
  - ./protections/protections.md
  - ./omnibar/omnibar.md
  - ./tabs/tabs.md
---

## Requests

### `initialSetup`
- {@link "NewTab Messages".InitialSetupRequest}
- Returns {@link "NewTab Messages".InitialSetupResponse}
- See also
   - [Widget Config](./widget-list/widget-config.md) for the initial page widgets
   - [Update Notification](./update-notification/update-notification.md) for the optional data
   - [Customizer Drawer Feature Flags](./customizer/customizer.md) for optional feature flags like the customizer drawer
   about release notes (windows only).

{@includeCode ../messages/examples/widgets.js#initialSetupResponse}

## Notifications

### `contextMenu`
- {@link "NewTab Messages".ContextMenuNotification}
- Sent when the user right-clicks in the page
- Note: Other widgets might prevent this (and send their own, eg: favorites)
- Sends: {@link "NewTab Messages".ContextMenuNotify}
- **DEPRECATED**: The `visibilityMenuItems` property is deprecated and will be removed in a future version. Native apps should populate the context menu themselves instead of relying on frontend to tell it what widgets exist in the New Tab Page.
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

### `open`
- {@link "NewTab Messages".OpenNotification}
- Sent when the user clicks on a link, such as 'settings'
- Sends: {@link "NewTab Messages".OpenAction}
- Example:

```json
{
  "target": "settings"
}
```

### `telemetryEvent`
- {@link "NewTab Messages".TelemetryEventNotification}
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

### `reportInitException`
- {@link "NewTab Messages".ReportInitExceptionNotification}
- Sent when the application fails to initialize (for example, a JavaScript exception prevented it)
- Sends: `{ message: string }` - see {@link "NewTab Messages".ReportInitExceptionNotify}

### `reportPageException`
- {@link "NewTab Messages".ReportPageExceptionNotification}
- Sent when the application failed after initialization (for example, a JavaScript exception prevented it)
- Sends: `{ message: string }` - see {@link "NewTab Messages".ReportPageExceptionNotify}
