Tech Design: Recent AI Chats in New Tab Omnibar

Author: TBD
Reviewer: TBD
Stakeholders: TBD
Project: TBD


BACKGROUND & REQUIREMENTS

The NTP omnibar has two modes: search and ai (Duck.ai). In AI mode the user currently sees only a text input. We want to show recent AI chat sessions below the input so users can resume previous conversations.

The injected duck-ai-chat-history.js already does this on other platforms by reading from Duck.ai's localStorage/IndexedDB. The NTP runs in a separate context without that access, so the native layer provides the data through the messaging bridge.

https://github.com/duckduckgo/content-scope-scripts/blob/main/injected/src/features/duck-ai-chat-history.js


PROBLEM STATEMENT

Native apps need to implement two new message handlers so the NTP frontend can retrieve and open recent Duck.ai chat sessions.


RECOMMENDED APPROACH

Message Architecture Overview

Two new messages, mirroring the existing search suggestions pattern:

- omnibar_getSuggestions → omnibar_getAiChats (request/response)
- omnibar_openSuggestion → omnibar_openAiChat (notify)

```
NTP Frontend                          Native Layer
    │                                     │
    │  omnibar_getAiChats (request)       │
    ├────────────────────────────────────►│
    │                                     │  Read chat data
    │◄────────────────────────────────────┤  from Duck.ai
    │  { chats: AiChat[] }               │
    │                                     │
    │  omnibar_openAiChat (notify)        │
    ├────────────────────────────────────►│  Navigate to
    │  { chatId, target }                │  duck.ai/chat/id
```


Message 1: omnibar_getAiChats (request/response)

Returns recent AI chat sessions. Called when the user enters AI mode.

Request: FE → Native, empty {}

Response example:

```
{
  "chats": [
    {
      "chatId": "abc-123",
      "title": "How to optimize database queries",
      "pinned": true,
      "lastEdit": "2026-02-20T10:30:00Z"
    },
    {
      "chatId": "def-456",
      "title": "Explain the observer pattern",
      "pinned": false,
      "lastEdit": "2026-02-19T15:45:00Z"
    }
  ]
}
```

AiChat schema

Fields match duck-ai-chat-history.js formatChat() output (minus model, which isn't needed for display).
https://github.com/duckduckgo/content-scope-scripts/blob/main/injected/src/features/duck-ai-chat-history.js#L242-L256

- chatId (string, required) — Duck.ai chat identifier
- title (string, required) — Display title (FE applies CSS truncation)
- pinned (boolean, optional) — Whether the chat is pinned. Defaults to false
- lastEdit (string, optional) — ISO 8601 timestamp of last edit

Ordering: The chats array must be pre-sorted by native: pinned first, then unpinned, both by recency. The FE renders as-is and only does client-side text filtering on title.

Empty / error handling: Always return { "chats": [] } — when there are no chats, when Duck.ai hasn't been used, or on error. The FE hides the list when the array is empty.


Message 2: omnibar_openAiChat (notify)

Opens a chat when clicked. Fire-and-forget, no response.

Notification: FE → Native

```
{
  "chatId": "abc-123",
  "target": "same-tab"
}
```

- chatId (string, required) — Chat to open
- target (OpenTarget, required) — "same-tab" | "new-tab" | "new-window", same as omnibar_openSuggestion


JSON Schema Files

All in special-pages/pages/new-tab/messages/:
https://github.com/duckduckgo/content-scope-scripts/tree/alavrenchuk/ntp-show-recent-duckai-chats/special-pages/pages/new-tab/messages

- types/ai-chat.json — AiChat type
- types/ai-chats-data.json — Response wrapper ({ chats: AiChat[] })
- omnibar_getAiChats.request.json — Request (empty params)
- omnibar_getAiChats.response.json — Response (refs AiChatsData)
- omnibar_openAiChat.notify.json — Notify (chatId + target)


Implementation Steps (Native)

1. Handle omnibar_getAiChats — Read chat history from Duck.ai storage, return response. See duck-ai-chat-history.js for storage access patterns: https://github.com/duckduckgo/content-scope-scripts/blob/main/injected/src/features/duck-ai-chat-history.js
2. Handle omnibar_openAiChat — Build duck.ai/chat/{chatId} URL and navigate per target. Same logic as omnibar_openSuggestion.


NOTES

- Extensibility: Request params are empty for v1. Optional fields (limit, offset, query) can be added later without breaking existing implementations.
- model field omitted: The injected feature includes model in formatChat() but it's not needed for display. Can be added later if we want model badges.


TESTING

FE:
- Shows recent AI chats in AI mode (omnibar_getAiChats)
- Clicking a chat sends correct omnibar_openAiChat notification
