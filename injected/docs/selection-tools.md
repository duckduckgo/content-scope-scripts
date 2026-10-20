---
title: Selection Tools
---

# Selection Tools

Offers Duck.ai actions for text the user selects. Native owns the actions and runs them; this feature classifies the
selection, ranks the actions that fit it, and shows them in a toolbar over the selection. It also reports the fitting
actions when the context menu opens, so the native menu can offer the same ones.

Runs in the top frame only. Windows only for now.

## Turning it on

Native decides. `initialSetup` answers `enabled`, `showToolbar` and the actions, and `selectionToolsConfigChanged` pushes
changes. On Windows these come from the `aiChat` → `selectionTools` sub-feature, the global AI toggle and the user's
setting, so they can change while a page is open. Nothing visible happens until `initialSetup` says the feature is
enabled.

The feature is in `platformSpecificFeatures`, like `contextMenu` and `textSelection`, so it starts without a top-level
`selectionTools` entry in the privacy config, and also runs on sites where protections are off. If the privacy config
does have that entry, its `state` is still a kill switch and its `exceptions` turn the feature off on those sites.

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
- Sent on the first selection, or the first context menu on one, and again on the next if that failed. A page where
  the user selects nothing sends nothing. Nothing shows until it's answered.
- Response: {@link "SelectionTools Messages".SelectionToolsConfig}

**Example**

```json
{
    "enabled": true,
    "showToolbar": true,
    "userLanguage": "en-US",
    "actions": [
        {
            "id": "explain",
            "label": "Explain",
            "icon": [{ "d": "M2 2h12v12H2z" }, { "d": "M4 4h8v8H4z", "fillRule": "evenodd" }],
            "selectionTypes": ["code", "text", "long"]
        },
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
the toolbar alone. `askAvailable` (default `true`) says whether the built-in Ask is offered; without it the toolbar keeps the Duck.ai logo
as a mark, and shows nothing at all when no action fits either.

Pushes may repeat the current config; only a real change hides a showing toolbar, so it's rebuilt from the new config
on the next selection.

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

Settings are read from a top-level `selectionTools` entry when there is one (see [Turning it on](#turning-it-on)):

| Setting             | Default | Meaning                                     |
| ------------------- | ------- | ------------------------------------------- |
| `maxVisibleActions` | `5`     | Toolbar buttons before "more", Ask included |
| `minChars`          | `2`     | Shortest selection, ignoring whitespace     |

## Strings and icons

The toolbar's own strings are in `src/locales/selection-tools/` and are picked by the locale C-S-S is given, falling
back to English. Action and option labels come from native, already localised.

Icons are the design system's 16px glyphs, drawn as filled paths in the toolbar's text colour. The toolbar's own (the
Duck.ai logo, more, hide, AI settings, chevrons, check and the default action sparkle) are in
`src/features/selection-tools/icons.js`. An action's `icon` comes from native as a list of `{ d, fillRule? }` paths and
is set through attributes, never markup; an icon in any other form gets the default sparkle. An action with choices has
no trailing chevron: while its choices are open, a chevron takes its icon's place.

## Testing

- Unit: `unit-test/selection-tools.js` (classification, ranking, placement). Run `npm run test-unit` from `injected/`.
- Integration: `integration-test/selection-tools.spec.js`. Run
  `npx playwright test --project=windows selection-tools --reporter list` from `injected/` after a build.
