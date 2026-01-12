---
title: Next Steps List
---

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

## Requests:
### `nextStepsList_getData`
- {@link "NewTab Messages".NextStepsListGetDataRequest}
- Used to fetch the initial data (during the first render)
- returns {@link "NewTab Messages".NextStepsListData} - either `{content: null}` or `{content: Array<{id: string}>}`
- Note: Please use `null` to represent when there's nothing to show (instead of an empty array.)
- Example:

```json
{
  "content": [
    { "id": "item1" },
    { "id": "item2" }
  ]
}
```

or:

```json
{
  "content": null
}
```

### `nextStepsList_getConfig`
- {@link "NewTab Messages".NextStepsListGetConfigRequest}
- Used to fetch the initial config (during the first render)
- returns {@link "NewTab Messages".NextStepsListConfig}

## Subscriptions:
### `nextStepsList_onDataUpdate`
- {@link "NewTab Messages".NextStepsListOnDataUpdateSubscription}.
- The messages available for the platform
- returns {@link "NewTab Messages".NextStepsListData}
- as mentioned in the request, please use `null` to represent when there's nothing to show (instead of an empty array.)
### `nextStepsList_onConfigUpdate`
- {@link "NewTab Messages".NextStepsListOnConfigUpdateSubscription}.
- The widget-specific config, to toggle things like the expansion
- returns {@link "NewTab Messages".NextStepsListConfig}

## Notifications:
### `nextStepsList_action`
- {@link "NewTab Messages".NextStepsListActionNotification}
- Sent when the user clicks the action button
- sends {@link "NewTab Messages".NextStepsListActionNotify}
- example payload:
```json
{
  "id": "item1"
}
```
### `nextStepsList_dismiss`
- {@link "NewTab Messages".NextStepsListDismissNotification}
- Sent when the user clicks the dismiss button
- sends {@link "NewTab Messages".NextStepsListDismissNotify}
- example payload:
```json
{
  "id": "item1"
}
```
### `nextStepsList_setConfig`
- {@link "NewTab Messages".NextStepsListSetConfigNotification}
- Sent when the user toggles the expansion of the next steps list
- sends {@link "NewTab Messages".NextStepsListConfig}
- example payload:
```json
{
  "expansion": "collapsed"
}
```
