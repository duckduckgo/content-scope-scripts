---
title: Customizer
---

## Drawer Feature Flag

- To enable the drawer feature for customization, change the {@link "NewTab Messages".NewTabPageSettings "Settings"} that are part of the `initialSetup` message
- It will default to the popover menu
- Example:


**Example InitialSetup response**

```json
{
  "...": "...",
  "widgets": [
    { "id": "rmf" },
    { "id": "nextSteps" },
    { "id": "favorites" },
    { "id": "privacyStats" }
  ],
  "widgetConfigs": [
    { "id": "favorites", "visibility": "visible" },
    { "id": "privacyStats", "visibility": "visible" },
  ],
  "settings": {
    "customizerDrawer": {
      "state": "enabled"
    }
  }
}
```

