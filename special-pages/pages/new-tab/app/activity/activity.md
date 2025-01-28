---
title: Activity
---

## Setup

- Widget ID: `"activity"`
- Add it to the `widgets` + `widgetConfigs` fields on [initialSetup](../new-tab.md)
- Example:

```json
{
  "...": "...",
  "widgets": [
    {"...":  "..."},
    {"id":  "activity"}
  ],
  "widgetConfigs": [
    {"...":  "..."},
    {"id": "activity", "visibility": "visible" }
  ]
}
```

## Requests:
### `activity_getData` 
- {@link "NewTab Messages".ActivityGetDataRequest}
- Used to fetch the initial data (during the first render)
- returns {@link "NewTab Messages".ActivityData}

```json
{
  "activity": [
    {
      "favicon": "<any img url>",
      "url": "https://www.youtube.com",
      "title": "youtube.com",
      "etldPlusOne": "youtube.com",
      "favorite": true,
      "trackersFound": true,
      "trackingStatus": {
        "trackerCompanies": [{ "displayName": "Adobe Analytics" }],
        "totalCount": 0
      },
      "history": [
        {
          "title": "Electric Callboy - Hypa Hypa (OFFICIAL VIDEO) - YouTube",
          "url": "https://youtube.com/watch?v=abc",
          "relativeTime": "Just now"
        }
      ]
    }
  ]
}
```

Notes: 
    - on `macOS`, `history.title` should be a path-like string to match current implementations
    - `etldPlusOne` will be used for fallback favicons/colors, so the logic should match the NTP

### `activity_getConfig`
- {@link "NewTab Messages".ActivityGetConfigRequest}
- Used to fetch the initial config data (eg: expanded vs collapsed)
- returns {@link "NewTab Messages".ActivityConfig}
- 
### `activity_confirmBurn`
- {@link "NewTab Messages".ActivityConfirmBurnRequest}
- Used to confirm the burn action - native side may or may not show a modal
- sends {@link "NewTab Messages".ConfirmBurnParams}
- returns {@link "NewTab Messages".ConfirmBurnResponse}

Sends
```json
{ "url": "..." }
```

Response:
```json
{ "action": "burn" }
```

Response (do nothing)
```json
{ "action": "none" }
```

If `{ "action": "burn" }` is returned, the burn animation will play, and will follow 
by sending the notification `activity_burnAnimationComplete` 

## Subscriptions:
### `activity_onDataUpdate`
- {@link "NewTab Messages".ActivityOnDataUpdateSubscription}
- The activity data used in the feed.
- returns {@link "NewTab Messages".ActivityData}

### `activity_onConfigUpdate` 
- {@link "NewTab Messages".ActivityOnDataUpdateSubscription }
- The widget config
- returns {@link "NewTab Messages".ActivityConfig}

## Notifications:

### `activity_setConfig` 
- {@link "NewTab Messages".ActivitySetConfigNotification}
- Sent when the user toggles the expansion of the activity feed
- sends {@link "NewTab Messages".ActivityConfig}
- example payload:
  ```json
  {
    "expansion": "collapsed"
  }
  ```

### `activity_addFavorite`
- {@link "NewTab Messages".ActivityAddFavoriteNotification}
- Sent when the user clicks the favorite icon
- sends {@link "NewTab Messages".ActivityAddFavoriteNotify}
- example payload: `{ "url": "..." }`

### `activity_removeFavorite`
- {@link "NewTab Messages".ActivityRemoveFavoriteNotification}
- Sent when the user clicks the favorite icon, if already a favorite
- sends {@link "NewTab Messages".ActivityRemoveFavoriteNotify}
- example payload: `{ "url": "..." }`

### `activity_removeItem`
- {@link "NewTab Messages".ActivityRemoveItemNotification}
- (windows only) Sent when the user clicks the cross icon
- sends {@link "NewTab Messages".ActivityRemoveItemNotify}
- example payload: `{ "url": "..." }`

### `activity_burn`
- {@link "NewTab Messages".ActivityBurnNotification}
- (macos only) Sent when the user clicks the burn icon
- sends {@link "NewTab Messages".ActivityBurnNotify}
- example payload: `{ "url": "..." }`

### `activity_open`
- {@link "NewTab Messages".ActivityOpenNotification}
- Sent when a user clicks a link, sends {@link "NewTab Messages".ActivityOpenAction}

example payload (with id):
```json
{ 
  "url": "https://example.com/path", 
  "target": "same-tab" 
}
```

example payload without id (for example, on history items)
```json
{
  "url": "https://example.com/path",
  "target": "same-tab"
}
```

### `activity_burnAnimationComplete`
- Sent when the burn animation completes