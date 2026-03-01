---
title: Next Steps List
---

## Overview

The Next Steps List widget provides an alternative UI for the Next Steps feature. It displays a single card at a time with a step indicator showing the total number of items, rather than the grid of cards shown by the regular Next Steps widget.

**Important:** This widget reuses the same message names as the [Next Steps](../next-steps/next-steps.md) widget to simplify native integration. Native devices can share the same message handlers for both widgets and simply include a different widget ID to control which UI is displayed.

## Behavior

- Displays one card at a time with image, title, description, and action buttons
- Shows a step indicator (pill-shaped dots) below the card representing total items
- Unknown IDs are filtered out (only known variants are displayed)
- When a card is dismissed, it animates out while the next card animates in (crossfade with scale effect)
- If no known items remain, the widget is hidden

## Setup

- Widget ID: `nextStepsList`
- Add it to the `widgets` field on [initialSetup](../new-tab.md)
- Example:

```json
{
  "...": "...",
  "widgets": [
    {"id":  "nextStepsList"},
    {"...":  "..."}
  ]
}
```

## Messages

This widget uses the **same message names** as the `nextSteps` widget. See the [Next Steps documentation](../next-steps/next-steps.md) for full details.

### Requests (reuses nextSteps_*)
- `nextSteps_getData` - Returns `{content: null}` or `{content: Array<{id: string}>}`
- `nextSteps_getConfig` - Returns `{expansion: 'expanded' | 'collapsed'}`

### Subscriptions (reuses nextSteps_*)
- `nextSteps_onDataUpdate` - Data updates
- `nextSteps_onConfigUpdate` - Config updates

### Notifications (reuses nextSteps_*)
- `nextSteps_action` - Sent when user clicks the primary action button
- `nextSteps_dismiss` - Sent when user clicks "Maybe Later"
- `nextSteps_setConfig` - Sent when expansion state changes

## Supported Item IDs

The following IDs are supported for the Next Steps List:

| ID | Description |
|----|-------------|
| `pinAppToTaskbarWindows` | Pin to Taskbar (Windows) |
| `addAppToDockMac` | Add to Dock (Mac) |
| `personalizeBrowser` | Personalize Your Browser |
| `duckplayer` | Duck Player |
| `emailProtection` | Email Protection |
| `bringStuff` | Import Bookmarks and Passwords |
| `defaultApp` | Set as Default Browser |
| `subscription` | DuckDuckGo Subscription |
| `sync` | Sync Across Devices |
