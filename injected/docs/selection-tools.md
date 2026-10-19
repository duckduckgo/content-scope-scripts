---
title: Selection Tools
---

# Selection Tools

Offers Duck.ai actions for text the user selects. Native owns the actions and runs them; this feature classifies the
selection, ranks the actions that fit it, and shows them in a toolbar over the selection. It also reports the fitting
actions when the context menu opens, so the native menu can offer the same ones.

Runs in the top frame only. Windows only for now.

## Turning it on

Two gates, as with `pageContext`:

1. **Remote config:** the top-level `selectionTools` feature in the privacy config native injects. C-S-S only runs
   `init()` when its `state` is enabled and the site isn't in its `exceptions`. This is the kill switch and the
   per-site breakage control; it can't change while a page is open.
2. **Native:** `initialSetup` answers `enabled`, `showToolbar` and the actions, and `selectionToolsConfigChanged`
   pushes changes. Native derives these from its own rollout flag (`aiChat` → `selectionTools`), the global AI
   toggle and the user's setting, so they can change while a page is open. Like `duckPlayer` and
   `chromeWebstorePatching`, the feature does nothing visible until `initialSetup` says it's enabled.

`pageContext` needs no `initialSetup`, because it only acts when native asks it to. This feature acts on the user's
selections by itself, so it has to know native's answer first.

## Page footprint

On Windows the feature runs in the page's main world, so pages can see any element it adds. To keep that to a minimum:

- the toolbar's host element (`<ddg-selection-tools>`) is only in the document while the toolbar is showing;
- everything inside it is in a closed shadow root, opened only in debug builds so tests can reach it;
- styles are constructed stylesheets, which the page's `style-src` CSP doesn't block;
- clicks on the toolbar don't move focus or the selection, and its key and mouse events don't reach the page's bubbling
  listeners.

Toolbar buttons only act on trusted clicks, so page script calling `click()` does nothing.

## What a selection is

- Selected page text, or selected text in a textarea or a text, search, email or URL input. Password, read-only and
  disabled fields are ignored.
- At least `minChars` non-space characters.
- Not inside the top layer (a modal dialog, popover or fullscreen element), where the toolbar would sit behind it.

Each selection is classified locally, from its text and the element it starts in:

| Type       | When                                                                               |
| ---------- | ---------------------------------------------------------------------------------- |
| `code`     | Inside `pre`, `code`, `kbd` or `samp`, or dense with code punctuation and keywords |
| `word`     | One word of 2–30 letters in the user's language                                    |
| `question` | Ends with a question mark                                                          |
| `long`     | Over 280 characters or more than two sentences                                     |
| `text`     | Anything else                                                                      |

The language comes from the text's writing system or common words, then the nearest `lang` attribute, then the user's
language. Text that isn't code and isn't in the user's language is `differentLanguage`.

## Ranking

An action fits when its `selectionTypes` (if any) include the type, its `editable` (if set) matches, and its
`condition` (if set) holds. Unknown conditions never hold. Fitting actions keep native's order, except that actions
with a `language` parameter lead for text in another language, and run straight away with the first option (the
user's language). Otherwise their options are offered, minus the selection's own language.

The toolbar shows Ask, then up to `maxVisibleActions - 1` actions, then a "more" button whose menu holds the rest,
"Hide selection tools" and "Open AI Settings". After an action, or while the context menu is open, the toolbar
collapses to the Ask chip; pointing at the chip expands it again.

## Requests

### `initialSetup`

- {@link "SelectionTools Messages".InitialSetupRequest}
- Sent once at start-up, and again on the next selection if that failed. Nothing shows until it's answered.
- Response: {@link "SelectionTools Messages".SelectionToolsConfig}

**Example**

```json
{
    "enabled": true,
    "showToolbar": true,
    "userLanguage": "en-US",
    "actions": [
        { "id": "explain", "label": "Explain", "icon": "M2 8h12", "selectionTypes": ["code", "text", "long"] },
        { "id": "fixGrammar", "label": "Fix grammar", "editable": true },
        {
            "id": "translate",
            "label": "Translate",
            "parameter": {
                "kind": "language",
                "options": [
                    { "value": "en", "label": "English" },
                    { "value": "es", "label": "Spanish" }
                ]
            }
        }
    ]
}
```

`enabled` turns the whole feature off for the page, context-menu reports included; `userLanguage` is then absent.
Native also answers `enabled: false` on its own sites, such as Duck.ai itself. `showToolbar` is the user's setting for
the toolbar alone.

## Subscriptions

### `selectionToolsConfigChanged`

- {@link "SelectionTools Messages".SelectionToolsConfigChangedSubscription}
- The whole config again, pushed to the main frame whenever it changes for that page.

## Notifications

### `actionRequested`

- {@link "SelectionTools Messages".ActionRequestedNotification}
- The user clicked an action. `actionId` is `"ask"` for Ask.

```json
{ "actionId": "translate", "text": "El perro", "parameter": "en", "sourceLanguage": "es" }
```

### `contextMenuOpened`

- {@link "SelectionTools Messages".ContextMenuOpenedNotification}
- Sent on `contextmenu` while `enabled`, with or without the toolbar. Without a selection, `text` and `actions` are
  empty.

```json
{
    "text": "El perro",
    "sourceLanguage": "es",
    "actions": [{ "id": "translate", "parameter": "en" }, { "id": "explain" }, { "id": "tone", "options": ["formal", "casual"] }]
}
```

### `hideSelectionTools`

- {@link "SelectionTools Messages".HideSelectionToolsNotification}
- The user chose "Hide selection tools". Native turns the setting off and pushes `selectionToolsConfigChanged`.

### `openAiSettings`

- {@link "SelectionTools Messages".OpenAiSettingsNotification}

## Remote Config

The feature's `state` and `exceptions` turn it off everywhere or on particular sites (see
[Turning it on](#turning-it-on)). Settings:

| Setting             | Default | Meaning                                     |
| ------------------- | ------- | ------------------------------------------- |
| `maxVisibleActions` | `5`     | Toolbar buttons before "more", Ask included |
| `minChars`          | `2`     | Shortest selection, ignoring whitespace     |

## Strings

The toolbar's own strings are in `src/locales/selection-tools/` and are picked by the locale C-S-S is given, falling
back to English. Action and option labels come from native, already localised. The toolbar's glyphs (Ask, more, hide,
settings, the default action icon) are bundled in `src/features/selection-tools/icons.js`; action icons are path data
from native, set as an attribute rather than markup.

## Testing

- Unit: `unit-test/selection-tools.js` (classification, ranking, placement). Run `npm run test-unit` from `injected/`.
- Integration: `integration-test/selection-tools.spec.js`. Run
  `npx playwright test --project=windows selection-tools --reporter list` from `injected/` after a build.
