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
- Used to fetch the initial data (during the first render)
- returns {@link "NewTab Messages".SuggestionsData}

{@includeCode ./mocks/getSuggestions.json}