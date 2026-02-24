# Recent AI Chats - Implementation Progress

## Steps

- [x] 1. Add message schemas (5 JSON files)
- [x] 2. Regenerate types
- [x] 3. Add service methods to OmnibarService
- [x] 4. Expose via OmnibarProvider context
- [x] 5. Create AiChatsList component + CSS
- [x] 6. Wire into Omnibar component
- [x] 7. Update mock transport + mock data
- [x] 8. Update integration test defaults
- [x] 9. Add integration tests (3 new tests)
- [x] 10. Add translation string
- [x] 11. Verify: build, lint, tests
- [x] 12. Add keyboard navigation + filtering for AiChatsList

## Step 12 Details

Added keyboard navigation and text filtering for AI chats, following the SuggestionsList/SearchForm pattern:

**New files:**
- `useAiChats.js` — combined fetch + navigation hook with `useReducer` (actions: setChats, previousChat, nextChat, setSelectedChat, clearSelectedChat) + `useMemo` text filtering + `getAiChatElementId()` helper
- `AiChatsProvider.js` — context provider wrapping `useAiChats` + `useId()` for aiChatsListId

**Modified files:**
- `AiChatForm.js` — keyboard handling (ArrowUp/Down/Enter/Escape) + ARIA attributes (aria-expanded, aria-haspopup, aria-controls, aria-activedescendant)
- `AiChatsList.js` — selection state from context (id, tabIndex, aria-selected, onMouseOver/onMouseLeave), ChatBubbleIcon/PinIcon
- `Omnibar.js` — wrapped with `<AiChatsProvider filter={query}>`

## Verification Results

- Build: PASS
- Lint (ESLint + TypeScript + Prettier): PASS
- Unit tests (104): PASS
- Integration tests (62, including 3 new for AI chats): PASS
