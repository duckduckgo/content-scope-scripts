---
title: History View
---

# History view

## Requests

### `initialSetup`
{@link "History Messages".InitialSetupRequest}

Configures initial history system settings.

**Types:**
- Response: {@link "History Messages".InitialSetupResponse}

```json
{
  "locale": "en",
  "env": "production",
  "platform": {
    "name": "macos"
  }
}
```

### `getRanges`
{@link "History Messages".GetRangesRequest}

Retrieves available time ranges for history filtering.

**Types:**
- Response: {@link "History Messages".GetRangesResponse}

```json
{
  "ranges": ["today", "yesterday", "monday", "recentlyOpened"]
}
```


### `query`
{@link "History Messages".QueryRequest}

Queries history items with filtering and pagination.

**Types:**
- Parameters: {@link "History Messages".HistoryQuery}
- Response: {@link "History Messages".HistoryQueryResponse}

params for a query: (note: can be an empty string!)

```json
{
  "query": {
    "term": "example.com"
  },
  "offset": 0,
  "limit": 50
}
```

params for a range, note: the values here will match what you returned from `getRanges`

```json
{
  "query": {
    "range": "today"
  },
  "offset": 0,
  "limit": 50
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
      "url": "https://example.com/page"
    }
  ]
}
```

### `deleteRange`
- Sent to delete a range as displayed in the sidebar.
- Parameters: {@link "History Messages".DeleteRangeParams}
- If the user confirms, respond with `{ action: 'delete' }`
- otherwise `{ action: 'none' }`
  - Response: {@link "History Messages".DeleteRangeResponse}

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

### `title_menu`
{@link "History Messages".MenuTitleRequest}

Sent when a right-click is issued on a section title (or when the three-dots button is clicked)  

**Types:**
- Parameters: {@link "History Messages".MenuTitleParams}
- Response: {@link "History Messages".MenuTitleResponse}

**params**
```json
{
  "dateRelativeDay": "Today - Wednesday 15 January 2025"
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

## Notifications

### `open`
- {@link "History Messages".OpenNotification}
- Sent when a user clicks a link, sends {@link "History Messages".OpenNotification}
- Target is one of {@link "History Messages".OpenTarget}

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
{@link "History Messages".ReportInitExceptionNotification}

Reports initialization errors in the history system.

```json
{
  "message": "Failed to initialize history database"
}
```

### `reportPageException`
{@link "History Messages".ReportPageExceptionNotification}

Reports errors during page history operations.

```json
{
  "message": "Failed to load page history"
}
```