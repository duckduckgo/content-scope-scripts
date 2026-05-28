# Tech Design: New Tab Page Omnibar — Support for Multi-Tab Attachment

- **Author:** https://app.asana.com/1/137249556945/profile/1213083311198664
- **Reviewer:** TBD
- **Stakeholders:** TBD
- **Project:** TBD

## Background & Requirements

The NTP omnibar lets users start a Duck.ai chat from a fresh tab. We want users to attach content from one or more open tabs to that chat. The web layer owns the picker UI, so two new bridge messages are needed (listing open tabs and extracting content by tab ID), plus one new field on an existing message to carry the attachments.

## Problem Statement

Native apps need to implement two new request handlers and extend one existing notification so the NTP omnibar can list open tabs, extract page content by ID, and forward attached contexts to Duck.ai on submit.

## Recommended Approach

Two new requests, one extended notification, plus a config flag on the existing `omnibar_getConfig` response:

```
JS                          Native Layer
│                                     │
│  omnibar_getOpenTabs (request)      │
├────────────────────────────────────►│
│                                     │  Collect tab metadata
│◄────────────────────────────────────┤
│  { tabs: TabMetadata[] }            │
│                                     │
│  omnibar_getTabContent (request)    │
├────────────────────────────────────►│  Extract page content
│  { tabId }                          │  by tab ID
│◄────────────────────────────────────┤
│  { pageContext } or null            │
│                                     │
│  omnibar_submitChat (notify)        │
├────────────────────────────────────►│  Submit with array of
│  { ..., pageContext }               │  attached page contexts
│                                     │
```

### Config flag: `enableAttachTabs`

Added to the existing `omnibar_getConfig` response (and to the `omnibar_onConfigUpdate` subscription payload). When `true`, the omnibar shows the paperclip entry point and accepts `@` mentions.

```json
{
  "mode": "ai",
  "enableAi": true,
  "enableAttachTabs": true
}
```

### Message 1: `omnibar_getOpenTabs` (request/response)

Returns metadata for all open tabs. Called when the user opens the picker (clicks the paperclip or types `@`). No content extraction — should be fast. Native excludes the requesting NTP tab and returns tabs in recency order.

**Request:** JS → Native, empty `{}`

**Response example:**

```json
{
  "tabs": [
    {
      "tabId": "tab-1",
      "title": "MacBook Neo - Apple",
      "url": "https://apple.com/macbook",
      "favicon": { "src": "https://apple.com/favicon.ico", "maxAvailableSize": 64 }
    },
    {
      "tabId": "tab-2",
      "title": "Starbucks Coffee Company",
      "url": "https://starbucks.com",
      "favicon": { "src": "https://starbucks.com/favicon.ico", "maxAvailableSize": 64 }
    }
  ]
}
```

**Response fields:**
- `tabId` *(string, required)* — Stable identifier for the tab
- `title` *(string, required)* — Tab title
- `url` *(string, required)* — Tab URL
- `favicon` *(`{ src, maxAvailableSize? }` | `null`, required)* — Matches the existing `favicon.json` shape used elsewhere in NewTab Messages

### Message 2: `omnibar_getTabContent` (request/response)

Extracts page content for a specific tab. Called when the user picks an entry from the picker. Returns `null` if the tab has any issues (closed, restricted page, extraction failure, etc).

**Request:** JS → Native

```json
{
  "tabId": "tab-1"
}
```

**Response example:**

```json
{
  "pageContext": {
    "tabId": "tab-1",
    "title": "MacBook Neo - Apple",
    "url": "https://apple.com/macbook",
    "favicon": { "src": "https://apple.com/favicon.ico", "maxAvailableSize": 64 },
    "content": "## MacBook Neo\n\nMarkdown content...",
    "truncated": false,
    "fullContentLength": 4200
  }
}
```

**Request fields:**
- `tabId` *(string, required)* — Tab to extract content from

**Response fields:**
- `pageContext` *(`PageContext` | `null`)* — Same shape used by the Duck.ai sidebar's `getAIChatPageContext`. Return `null` if the tab has issues or no longer exists.
  - `tabId` *(string, optional)* — Native may echo the requested `tabId` or omit it. NTP maps the response back to the requested tab either way.

### Augmented: `omnibar_submitChat` (notify)

Adds an optional `pageContext` field carrying the page contexts the user selected. Omitted when no tabs are attached, so existing native handlers continue to work unchanged. NTP echoes back the same `PageContext` objects it received from `omnibar_getTabContent` — native does not re-extract.

**Example payload:**

```json
{
  "chat": "Compare these laptops",
  "target": "same-tab",
  "modelId": "gpt-4o-mini",
  "pageContext": [
    {
      "tabId": "tab-1",
      "title": "MacBook Neo - Apple",
      "url": "https://apple.com/macbook",
      "favicon": { "src": "https://apple.com/favicon.ico", "maxAvailableSize": 64 },
      "content": "...",
      "truncated": false,
      "fullContentLength": 4200
    },
    { "tabId": "tab-2", "...": "..." }
  ]
}
```

**Fields:**
- `pageContext` *(`Array<PageContext>`, optional)* — Same shape as the `omnibar_getTabContent` response's `pageContext`. Each entry **must** include `tabId` — NTP always includes it on submit so native can attribute attachments back to their source tab.

## Implementation Steps (Native)

1. Add `enableAttachTabs: true` to the `omnibar_getConfig` response (and to the `omnibar_onConfigUpdate` subscription payload) on platforms that support the feature.
2. Handle `omnibar_getOpenTabs` — Collect metadata (`tabId`, `title`, `url`, `favicon`) for all open tabs. Exclude the requesting NTP tab. Order by recency.
3. Handle `omnibar_getTabContent` — Look up tab by `tabId`, run the existing page-content extraction (same code path as the sidebar's `getAIChatTabContent`), return `PageContext | null`.
4. Read `pageContext` on `omnibar_submitChat` and forward the attached contexts into the Duck.ai chat session alongside the user's message.

## Notes

- Request params for `omnibar_getOpenTabs` are empty for v1. Filtering / search is performed client-side over the returned list (including the `@`-typeahead). Server-side filtering can be added later without breaking existing implementations.
- No max attachment count for v1. Native can impose a cap in the Duck.ai session if needed.

## Testing

**FE:**
- Picker populates tab list on open (`omnibar_getOpenTabs`)
- `@`-typeahead filters the same list client-side
- Selecting a tab extracts content and renders a chip (`omnibar_getTabContent`)
- Removing a chip drops the corresponding context from the next submit
- Closed/broken tab returns `null` — UI handles gracefully (no chip added, no error toast required for v1)
- Submit with N chips includes `pageContext` of length N in `omnibar_submitChat`
- `enableAttachTabs` absent/false → paperclip and `@` typeahead hidden, existing flows unchanged
- Per-tab state: chips persist across browser tab switches and clear when the NTP tab closes

**Mock transport:** Testable via the existing NTP `mock-transport.js` with `?omnibar.enableAttachTabs=true`.

## Additional Considerations (if applicable)

- **Privacy** — TBD
- **Security** — TBD
