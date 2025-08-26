---
title: Tabs
---

# Tabs

This feature allows native sides to indicate which 'tab' is currently active. 

The fields `tabId` and `tabIds` are used together to indicate which tabs are open and which is active.

For example, the following indicates that there are three tabs and `def` is the visible one.

```json
{
  "tabId": "def",
  "tabIds": ["abc", "def", "ghi"]
}
```

To remove a tab you would send a shorter list. To add a tab, send a longer list. To switch between tabs, send the 
entire list still, but update `tabId` to reflect the currently active tab.

**NOTE: you MUST send both fields every time.**

## Setup

Since this data is global in nature, you must add the initial tab state to {@link "NewTab Messages".InitialSetupResponse}  

- Add {@link "NewTab Messages".Tabs} to the `tabs` field on {@link "NewTab Messages".InitialSetupResponse}
- Example:

```json
{
  "...": "...",
  "tabs": {
    "tabId": "abc",
    "tabIds": ["abc", "def"]
  }
}
```

## Subscriptions:

Once the page is running, you can send `tabs_onDataUpdate` updates as often as you need to.

### `tabs_onDataUpdate` 
- {@link "NewTab Messages".TabsOnDataUpdateSubscription}. 
```json
{
   "tabId": "string",
   "tabIds": ["string", "string"]
}
```