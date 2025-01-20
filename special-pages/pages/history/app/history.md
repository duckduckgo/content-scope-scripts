---
title: History Page
---

## Requests

- {@link "History Messages".InitialSetupRequest `initialSetup`}
    - Returns {@link "History Messages".InitialSetupResponse}
    
## Requests

### {@link "History Messages".QueryRequest `query`}
- Sends {@link "History Messages".HistoryQuery}
- Receives {@link "History Messages".HistoryQueryResponse}
- Note: if an empty term is sent, you should reply with as many items as the limit allows.

The FE will send: 
```json
{ "term": "", "limit": 150, "offset": 0 }
```

The response will be:

```json
{
  "info": {
    "finished": false,
    "term": ""
  },
  "value": [
    {
      "dateRelativeDay": "Today - Wednesday 15 January 2025",
      "dateShort": "15 Jan 2025",
      "dateTimeOfDay": "11:10",
      "domain": "youtube.com",
      "fallbackFaviconText": "L",
      "time": 1736939416961.617,
      "title": "Electric Callboy - Hypa Hypa (OFFICIAL VIDEO) - YouTube",
      "url": "https://www.youtube.com/watch?v=75Mw8r5gW8E"
    },
    {"...":  "..."}
  ]
}
```

## Notifications

### {@link "History Messages".ReportInitExceptionNotification `reportInitException`}
- Sent when the application fails to initialize (for example, a JavaScript exception prevented it)
- Sends: `{ message: string }` - see {@link "History Messages".ReportInitExceptionNotify}

### {@link "History Messages".ReportPageExceptionNotification `reportPageException`}
- Sent when the application failed after initialization (for example, a JavaScript exception prevented it)
- Sends: `{ message: string }` - see {@link "History Messages".ReportPageExceptionNotify}
