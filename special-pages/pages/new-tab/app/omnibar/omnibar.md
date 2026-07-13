---
title: Omnibar Widget
---

## Setup

- Widget ID: `"omnibar"`
- Add it to the `widgets` + `widgetConfigs` fields on [initialSetup](../new-tab.md)
- Example:

```json
{
  "...": "...",
  "widgets": [
    {"...":  "..."},
    {"id": "omnibar"}
  ],
  "widgetConfigs": [
    {"...":  "..."},
    {"id": "omnibar", "visibility": "visible" }
  ]
}
```

## Requests:

### `omnibar_getConfig` 
- {@link "NewTab Messages".OmnibarGetConfigRequest}
- Used to fetch the initial config data (during the first render)
- returns {@link "NewTab Messages".OmnibarConfig}
- key fields:
  - `mode` — `"search"` or `"ai"` (required)
  - `enableAi` — enables the Duck.ai tab (default `true`)
  - `enableAiChatTools` — enables AI chat tools: model selector, image attachments (default `false`)
  - `enableImageGeneration` — shows "Create Image" in the tools menu (default `false`)
  - `enableWebSearch` — shows "Web Search" in the tools menu (default `false`)
  - `enableVoiceChatAccess` — when true and the input is empty, replaces the AI chat submit button with a 1-click voice-chat button. Click/Enter sends `omnibar_submitChat` with an empty `chat` and `mode: "voice-mode"` — native handles the voice handoff (default `false`)
  - `enableAskAiSuggestion` — when `false`, hides the inline "Ask Duck.ai: <query>" entry in the suggestions dropdown. Missing/undefined is treated as `true` (default `true`). Does not affect the Duck.ai mode pill or any other AI affordance — those remain governed by `enableAi`
  - `enableAttachTabs` — when `true`, the omnibar shows the page context entry point and accepts `@` mentions for attaching open tabs as context. Requires native to handle `omnibar_getOpenTabs` and `omnibar_getTabContent` (default `false`).
  - `aiModelSections` — array of model sections for the model selector. Each model may include `supportedReasoningEffort` (e.g. `["none", "low", "medium"]`) to surface the reasoning picker
  - `selectedModelId` — the user's persisted model choice
  - `selectedReasoningEffort` — the user's persisted reasoning-effort choice for the active model. Native validates against the model's `supportedReasoningEffort` on write
```json
{
   "mode": "search",
   "enableAi": true,
   "enableAiChatTools": false,
   "enableImageGeneration": false,
   "enableWebSearch": false,
   "enableVoiceChatAccess": false,
   "enableAskAiSuggestion": true,
   "enableAttachTabs": false
}
```

### `omnibar_getOpenTabs`
- {@link "NewTab Messages".OmnibarGetOpenTabsRequest}
- Used to populate the attach-tabs picker. Called when the user opens the picker (clicks the paperclip's "Attach Page Content" menu item, or types `@` in the chat input).
- No params for v1. Filtering / `@`-typeahead is performed client-side over the returned list.
- Native is expected to exclude the requesting NTP tab and return tabs in recency order.
- returns {@link "NewTab Messages".GetOpenTabsResponse}
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
         "favicon": null
      }
   ]
}
```

### `omnibar_getTabContent`
- {@link "NewTab Messages".OmnibarGetTabContentRequest}
- Extracts page content for a specific tab. Called when the user picks a tab from the picker.
- requires `tabId` (returned by `omnibar_getOpenTabs`).
- Returns `{ pageContext: null }` when the tab has any issue (closed, restricted page, extraction failure, etc) — the UI handles this by silently dropping the chip.
- returns {@link "NewTab Messages".GetTabContentResponse}
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

### `omnibar_getSuggestions` 
- {@link "NewTab Messages".OmnibarGetSuggestionsRequest}
- Used to fetch search suggestions based on user input
- requires `term` parameter (the search term to get suggestions for)
- returns {@link "NewTab Messages".SuggestionsData}
```json
{
   "suggestions": {
      "topHits": [
         {
            "kind": "bookmark",
            "title": "Example Site",
            "url": "https://example.com",
            "isFavorite": true,
            "score": 0.95
         }
      ],
      "duckduckgoSuggestions": [
         {
            "kind": "phrase",
            "phrase": "example search term"
         }
      ],
      "localSuggestions": [
         {
            "kind": "historyEntry",
            "title": "Previous Visit",
            "url": "https://previous.com",
            "score": 0.8
         }
      ]
   }
}
```

## Subscriptions:

### `omnibar_onConfigUpdate` 
- {@link "NewTab Messages".OmnibarOnConfigUpdateSubscription}
- The omnibar widget configuration updates
- returns {@link "NewTab Messages".OmnibarConfig}

## Notifications:

### `omnibar_setConfig` 
- {@link "NewTab Messages".OmnibarSetConfigNotification}
- Sent when the user changes the omnibar mode (search vs AI)
- sends {@link "NewTab Messages".OmnibarConfig}
- example payload:
```json
{
   "mode": "ai"
}
```

### `omnibar_submitSearch` 
- {@link "NewTab Messages".OmnibarSubmitSearchNotification}
- Sent when the user submits a search query
- requires `term` (the search term) and `target` (where to open the search)
- example payload:
```json
{
   "term": "duckduckgo privacy",
   "target": "same-tab"
}
```

### `omnibar_submitChat` 
- {@link "NewTab Messages".OmnibarSubmitChatNotification}
- Sent when the user submits a chat message to Duck.ai
- requires `chat` (the chat message) and `target` (where to open the chat)
- optional fields:
  - `modelId` — the selected AI model identifier. Omitted when in image-generation mode.
  - `reasoningEffort` — stable server key (e.g. `"none"`, `"low"`, `"medium"`) for the reasoning-effort selection. Omitted when the active model doesn't expose a reasoning picker, or in image-generation mode.
  - `mode` — `"chat"` or `"image-generation"`. Sent as `"image-generation"` when the Create Image tool is active. Omitted for normal chat (defaults to `"chat"`).
  - `toolChoice` — `["WebSearch"]` when the user has the Web Search tool active. Omitted otherwise.
  - `images` — array of `{ data, format }` objects for attached images. Omitted when no images are attached.
  - `pageContext` — array of {@link "NewTab Messages".PageContext} objects echoed back from `omnibar_getTabContent`. Each entry **always** includes `tabId` so native can attribute attachments to their source tab. Omitted when no tabs are attached so existing native handlers continue to work unchanged.
- example payloads:

**Normal chat:**
```json
{
   "chat": "How do I enable privacy protection?",
   "target": "new-tab",
   "modelId": "gpt-4o-mini"
}
```

**Image generation:**
```json
{
   "chat": "a neon duck flying over mountains",
   "target": "same-tab",
   "mode": "image-generation"
}
```

**Web search:**
```json
{
   "chat": "what happened today",
   "target": "same-tab",
   "modelId": "gpt-4o-mini",
   "toolChoice": ["WebSearch"]
}
```

**Chat with image attachment:**
```json
{
   "chat": "describe this image",
   "target": "same-tab",
   "modelId": "gpt-4o-mini",
   "images": [
      { "data": "<base64>", "format": "png" }
   ]
}
```

**Chat with attached tab page contexts:**
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

### `omnibar_openSuggestion` 
- {@link "NewTab Messages".OmnibarOpenSuggestionNotification}
- Sent when the user selects a suggestion from the dropdown
- requires `suggestion` (the selected suggestion) and `target` (where to open it)
- example payload:
```json
{
   "suggestion": {
      "kind": "bookmark",
      "title": "DuckDuckGo",
      "url": "https://duckduckgo.com",
      "isFavorite": true,
      "score": 1.0
   },
   "target": "same-tab"
}
```

### Picker impressions — `telemetryEvent`
Impression telemetry is sent via the shared `telemetryEvent` notification (not a bespoke message), so native only needs to add a name case + pixel mapping. Fired once per open (closed→open transition). Native maps `value.picker` to the platform-specific subscription funnel origin and fires the impression pixel.

- **Picker shown** — `{ attributes: { name: "omnibar_picker", value: { picker: "model" | "reasoning" } } }`, sent when the model or reasoning picker opens.
- **Upsell shown** — `{ attributes: { name: "omnibar_upsell", value: { picker: "model" | "reasoning" } } }`, sent when the conditional subscription upsell CTA is visible on open (only when a gated option exists).

Example payload:
```json
{
   "attributes": { "name": "omnibar_picker", "value": { "picker": "model" } }
}
```

### `omnibar_showSubscriptionUpsell`
- {@link "NewTab Messages".OmnibarShowSubscriptionUpsellNotification}
- Sent when the user taps "Try for free" on a subscription-gated model or reasoning-effort option.
- requires `source` — `"model"` or `"reasoning"`, identifying the picker the upsell was triggered from. Native maps `source` to the subscription funnel origin (and infers `flow_type`); the frontend does not send origin or flow information.
- example payload:
```json
{
   "source": "model"
}
```

### `omnibar_showSubscriptionUpgrade`
- {@link "NewTab Messages".OmnibarShowSubscriptionUpgradeNotification}
- Sent when a subscriber taps "Upgrade" on a model or reasoning-effort option gated behind a higher tier.
- requires `source` — `"model"` or `"reasoning"`, identifying the picker the upgrade was triggered from. Native maps `source` to the subscription funnel origin; the frontend does not send origin or flow information.
- example payload:
```json
{
   "source": "reasoning"
}
```

## Suggestion Types

The omnibar supports various types of suggestions:

- **bookmark**: Saved bookmarks with title, URL, favorite status, and relevance score
- **openTab**: Currently open browser tabs with title, tab ID, and relevance score  
- **phrase**: Search phrase suggestions from DuckDuckGo
- **website**: Direct website URL suggestions
- **historyEntry**: Previously visited pages from browser history with title, URL, and relevance score
- **internalPage**: Internal browser pages (settings, etc.) with title, URL, and relevance score

## Open Targets

All actions that open content support these target options:
- `"same-tab"`: Replace current tab content
- `"new-tab"`: Open in a new tab
- `"new-window"`: Open in a new browser window