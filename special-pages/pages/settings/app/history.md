---
title: Settings View
---

# Settings view

## Requests

### `initialSetup`
{@link "Settings Messages".InitialSetupRequest}

Configure initial settings system settings.

**Types:**
- Response: {@link "Settings Messages".InitialSetupResponse}

```json
{
  "locale": "en",
  "env": "production",
  "platform": {
    "name": "macos"
  }
}
```

With {@link "Settings Messages".DefaultStyles} overrides 

```json
{
  "locale": "en",
  "env": "production",
  "platform": {
    "name": "macos"
  },
  "defaultStyles": {
    "lightBackgroundColor": "#E9EBEC",
    "darkBackgroundColor": "#27282A"
  }
}
```

### `getRanges`
{@link "Settings Messages".GetRangesRequest}

Retrieves available time ranges for settings filtering.

**Types:**
- Response: {@link "Settings Messages".GetRangesResponse}

```json
{
  "ranges": [
    {
      "id": "today",
      "count": 13
    },
    {
      "id": "yesterday",
      "count": 10
    },
    {
      "id": "monday",
      "count": 2
    },
    {
      "id": "older",
      "count": 120
    }
  ]
}
```


### `query`
{@link "Settings Messages".QueryRequest}

Queries settings items with filtering and pagination.

**Types:**
- Parameters: {@link "Settings Messages".SettingsQuery}
- Response: {@link "Settings Messages".SettingsQueryResponse}

params for a query: (note: can be an empty string!)

```json
{
  "query": {
    "term": "example.com"
  },
  "offset": 0,
  "limit": 50,
  "source": "initial"
}
```

params for a range, note: the values here will match what you returned from `getRanges`

```json
{
  "query": {
    "range": "today"
  },
  "offset": 0,
  "limit": 50,
  "source": "initial"
}
```

Response, note: always return the same query I sent: 

```json
{
  "info": {
    "finished": false,
    "query": {
      "term": "example.com"
    }
  },
  "value": [
    {
      "id": "12345",
      "dateRelativeDay": "Today - Wednesday 15 January 2025",
      "dateShort": "15 Jan 2025",
      "dateTimeOfDay": "11:01",
      "domain": "example.com",
      "etldPlusOne": "example.com",
      "title": "Example Website",
      "url": "https://example.com/page",
      "favicon": {
        "src": "...",
        "maxAvailableSize": 64
      }
    }
  ]
}
```

### `deleteRange`
- Sent to delete a range as displayed in the sidebar.
- Parameters: {@link "Settings Messages".DeleteRangeParams}
- If the user confirms, respond with `{ action: 'delete' }`
- otherwise `{ action: 'none' }`
  - Response: {@link "Settings Messages".DeleteRangeResponse}

**params**
```json
{
  "range": "today" 
}
```

**response**
```json
{
  "action": "delete" 
}
```

### `deleteDomain`
- Sent to delete a domain - which might be the etld+1 or domain.
- Parameters: {@link "Settings Messages".DeleteDomainParams}
- If the user confirms, respond with `{ action: 'delete' }`
- otherwise `{ action: 'none' }`
  - Response: {@link "Settings Messages".DeleteDomainResponse}

**params**
```json
{
  "domain": "youtube.com" 
}
```

**response**
```json
{
  "action": "delete" 
}
```

### `deleteTerm`
- Sent to delete a search term
- Parameters: {@link "Settings Messages".DeleteTermParams}
- If the user confirms, respond with `{ action: 'delete' }`
- otherwise `{ action: 'none' }`
  - Response: {@link "Settings Messages".DeleteTermResponse}

**params**
```json
{
  "term": "youtube" 
}
```

**response**
```json
{
  "action": "delete" 
}
```

**response, if deleted**
```json
{
  "action": "delete" 
}
```

**response, otherwise**
```json
{
  "action": "none" 
}
```

### `entries_menu`
{@link "Settings Messages".EntriesMenuRequest}

Sent when a right-click is issued on a section title (or when the three-dots button is clicked)  

**Types:**
- Parameters: {@link "Settings Messages".EntriesMenuParams}
- Response: {@link "Settings Messages".EntriesMenuResponse}

**params**
```json
{
  "ids": ["abc", "def"]
}
```

**response, if deleted**
```json
{
  "action": "delete" 
}
```

**response, to trigger a domain search**
```json
{
  "action": "domain-search" 
}
```

**response, otherwise**
```json
{
  "action": "none" 
}
```

### `entries_delete`
{@link "Settings Messages".EntriesDeleteRequest}
{@link "Settings Messages".EntriesDeleteRequest}

Sent when the delete key is pressed on an item, or a group of items

**Types:**
- Parameters: {@link "Settings Messages".EntriesDeleteParams}
- Response: {@link "Settings Messages".EntriesDeleteResponse}

Note: if a single `id` is sent, **no modal/confirmation should be shown** - but you must
still reply with an {@link "Settings Messages".ActionResponse} when the action was completed.

If multiple `id`s are sent, then present a modal window for confirmation, eventually 
responding to the message with {@link "Settings Messages".ActionResponse}

## Notifications

### `open`
- {@link "Settings Messages".OpenNotification}
- Sent when a user clicks a link, sends {@link "Settings Messages".OpenNotification}
- Target is one of {@link "Settings Messages".OpenTarget}

example payload
```json
{ 
  "url": "https://example.com/path", 
  "target": "same-tab" 
}
```
```json
{ 
  "url": "https://example.com/path", 
  "target": "new-tab" 
}
```

### `reportInitException`
{@link "Settings Messages".ReportInitExceptionNotification}

Reports initialization errors in the settings system.

```json
{
  "message": "Failed to initialize settings database"
}
```

### `reportPageException`
{@link "Settings Messages".ReportPageExceptionNotification}

Reports errors during page settings operations.

```json
{
  "message": "Failed to load page settings"
}
```