---
title: Search
---

## Setup

- Widget ID: `"search"`
- Add it to the `widgets` + `widgetConfigs` fields on [initialSetup](../new-tab.md)
- Example:

```json
{
  "...": "...",
  "widgets": [
    {"...":  "..."},
    {"id": "search"}
  ],
  "widgetConfigs": [
    {"...":  "..."},
    {"id": "search", "visibility": "visible" }
  ]
}
```

## Requests:
### `search_getSuggestions` 
- {@link "NewTab Messages".SearchGetSuggestionsRequest}
- returns {@link "NewTab Messages".SuggestionsData}

{@includeCode ./mocks/getSuggestions.json}

## Notifications:
### `search_openSuggestion` 
- {@link "NewTab Messages".SearchOpenSuggestionNotification}
- Sends {@link "NewTab Messages".SearchOpenSuggestion}

## Notifications:
### `search_submit` 
- {@link "NewTab Messages".SearchSubmitNotification}
- Sends {@link "NewTab Messages".SearchSubmitParams}

## Notifications:
### `search_submitChat` 
- {@link "NewTab Messages".SearchSubmitChatNotification}
- Sends {@link "NewTab Messages".SearchSubmitChatParams}
```json
{
  "chat": "Give me 5 pub-quiz style facts about Austria",
  "target": "same-tab"
}
```