# Recent AI Chats in New-Tab Omnibar

## Context

The new-tab page's omnibar already supports two modes: "search" (with suggestions list) and "ai" (Duck.ai chat). When in AI mode, only a textarea is shown. We need to add a list of recent AI chats below the textarea, matching the design shown in the screenshot (clock icons + chat titles). This feature already works on other platforms via `injected/src/features/duck-ai-chat-history.js`, which retrieves chats from localStorage. For the new-tab special page, the native layer will provide this data through the standard messaging pipeline.

## Implementation Steps

### 1. Add message schemas

Create 5 new JSON schema files in `special-pages/pages/new-tab/messages/`:

**`messages/types/ai-chat.json`** - Single chat item type:
- `chatId` (string, required), `title` (string, required), `model` (string), `lastEdit` (string), `pinned` (boolean)
- Matches the shape from `duck-ai-chat-history.js:formatChat()`

**`messages/types/ai-chats-data.json`** - Response wrapper:
- `chats`: array of `$ref: ai-chat.json` (combined pinned-first + unpinned list)

**`messages/omnibar_getAiChats.request.json`** - Empty object (no params needed for v1)

**`messages/omnibar_getAiChats.response.json`** - `$ref: types/ai-chats-data.json`

**`messages/omnibar_openAiChat.notify.json`** - `chatId` (string) + `target` (`$ref: types/open-target.json`)

### 2. Regenerate types

Run `node types.mjs` from `special-pages/` to regenerate `types/new-tab.ts` with the new `AiChat`, `AiChatsData` types.

### 3. Add service methods

**File:** `app/omnibar/omnibar.service.js`
- Add `getAiChats()` → `ntp.messaging.request('omnibar_getAiChats')`
- Add `openAiChat({chatId, target})` → `ntp.messaging.notify('omnibar_openAiChat', ...)`

### 4. Expose via provider context

**File:** `app/omnibar/components/OmnibarProvider.js`
- Add `getAiChats` and `openAiChat` to `OmnibarContext` default values
- Add `useCallback` wrappers delegating to `service.current`
- Add to the `<OmnibarContext.Provider value={...}>` object

### 5. Create AiChatsList component

**New file:** `app/omnibar/components/AiChatsList.js`
- Fetches chats via `getAiChats()` from context on mount (component only renders in AI mode, so mount = entering AI mode)
- Renders `role="listbox"` container with `role="option"` buttons
- Each item: `HistoryIcon` (clock icon, already in `Icons.js`) + title text
- Click handler calls `openAiChat({ chatId, target })` using `eventToTarget()` for modifier key support
- Returns `null` when no chats (empty state = no list shown)

**New file:** `app/omnibar/components/AiChatsList.module.css`
- Reuse styling patterns from `SuggestionsList.module.css` (border-top separator, flex column, 32px items, icon+title layout)
- Title `max-width: 80%` (no suffix/badge needed)

### 6. Wire into Omnibar component

**File:** `app/omnibar/components/Omnibar.js`
- Import `AiChatsList`
- Add `{mode === 'ai' && <AiChatsList />}` after the existing `{mode === 'search' && <SuggestionsList ... />}` (line 124)
- Both are inside `.popup` but outside `ResizingContainer`, matching the layout pattern
- The existing CSS selector `.root:has([role="listbox"]) .popup` will apply correct border-radius/margin automatically

### 7. Update mock transport

**File:** `app/omnibar/mocks/omnibar.mock-transport.js`
- Add `case 'omnibar_getAiChats'` to request handler → return mock data
- Add `case 'omnibar_openAiChat'` to notify handler → console.log

**File:** `app/omnibar/mocks/omnibar.mocks.js`
- Add `getMockAiChats()` function returning 5 sample chats with realistic titles

### 8. Update integration test defaults

**File:** `integration-tests/new-tab.page.js`
- Add `omnibar_getAiChats: { chats: [] }` and `omnibar_openAiChat: {}` to default mock responses (around line 52-57)

### 9. Add integration tests

**File:** `app/omnibar/integration-tests/omnibar.page.js`
- Add `aiChatsList()` and `aiChats()` locator helpers

**File:** `app/omnibar/integration-tests/omnibar.spec.js`
- Test: shows recent AI chats when in AI mode
- Test: clicking a chat sends `omnibar_openAiChat` notification
- Test: chats list does not show in search mode

### 10. Add translation string

**File:** `app/omnibar/strings.json`
- Add `omnibar_aiChatsListLabel` for the accessible `aria-label` on the listbox

## Key Files

| File | Action |
|------|--------|
| `special-pages/pages/new-tab/messages/types/ai-chat.json` | Create |
| `special-pages/pages/new-tab/messages/types/ai-chats-data.json` | Create |
| `special-pages/pages/new-tab/messages/omnibar_getAiChats.request.json` | Create |
| `special-pages/pages/new-tab/messages/omnibar_getAiChats.response.json` | Create |
| `special-pages/pages/new-tab/messages/omnibar_openAiChat.notify.json` | Create |
| `special-pages/pages/new-tab/app/omnibar/components/AiChatsList.js` | Create |
| `special-pages/pages/new-tab/app/omnibar/components/AiChatsList.module.css` | Create |
| `special-pages/pages/new-tab/app/omnibar/omnibar.service.js` | Modify |
| `special-pages/pages/new-tab/app/omnibar/components/OmnibarProvider.js` | Modify |
| `special-pages/pages/new-tab/app/omnibar/components/Omnibar.js` | Modify |
| `special-pages/pages/new-tab/app/omnibar/mocks/omnibar.mock-transport.js` | Modify |
| `special-pages/pages/new-tab/app/omnibar/mocks/omnibar.mocks.js` | Modify |
| `special-pages/pages/new-tab/integration-tests/new-tab.page.js` | Modify |
| `special-pages/pages/new-tab/app/omnibar/integration-tests/omnibar.page.js` | Modify |
| `special-pages/pages/new-tab/app/omnibar/integration-tests/omnibar.spec.js` | Modify |
| `special-pages/pages/new-tab/app/omnibar/strings.json` | Modify |
| `special-pages/pages/new-tab/types/new-tab.ts` | Auto-generated |

## Existing code to reuse

- `HistoryIcon` from `app/components/Icons.js` (clock icon matching the screenshot)
- `eventToTarget()` from `shared/handlers.js` (modifier key → target mapping)
- `usePlatformName()` from `app/settings.provider.js`
- `SuggestionsList.module.css` patterns for styling
- `OmnibarContext` pattern for context/provider wiring
- `omnibar.mock-transport.js` pattern for mock handling

## Verification

1. `cd special-pages && node types.mjs` — types regenerate without errors
2. `npm run build` — builds successfully
3. `npm run serve-special-pages` — open new-tab page, switch to Duck.ai tab, verify chat list appears below textarea
4. `cd special-pages && npm run test-unit` — unit tests pass
5. `cd special-pages && npx playwright test app/omnibar/integration-tests/ --reporter list` — integration tests pass
6. `npm run lint` — no lint errors
