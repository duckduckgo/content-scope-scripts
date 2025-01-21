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

## Notifications

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