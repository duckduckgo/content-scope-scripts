---
title: Selection Tools
---

# Selection Tools

Offers Duck.ai actions for text the user selects. Native owns the actions, draws the toolbar over the selection and
runs the actions; this feature classifies the selection, ranks the actions that fit it, and reports them to native with
where the selection is on screen. It draws nothing itself. It also reports the fitting actions when the context menu
opens, so the native menu can offer the same ones.

Runs in the top frame only. Windows only for now.

## Turning it on

Native decides. `initialSetup` answers `enabled`, `showToolbar` and the actions, and `selectionToolsConfigChanged` pushes
changes. On Windows these come from the `aiChat` → `selectionTools` sub-feature, the global AI toggle and the user's
setting, so they can change while a page is open. Nothing is reported until `initialSetup` says the feature is
enabled.

The feature is in `platformSpecificFeatures`, like `contextMenu` and `textSelection`, so it starts without a top-level
`selectionTools` entry in the privacy config, and also runs on sites where protections are off. If the privacy config
does have that entry, its `state` is still a kill switch and its `exceptions` turn the feature off on those sites.

## Page footprint

On Windows the feature runs in the page's main world, so pages can see any element it adds. It adds one only to
measure a selection in a text field, which has no geometry of its own: a host element (`<ddg-selection-tools>`) with
the field's text laid out again in a closed shadow root, appended and removed again within the same task.

It listens to mouse, key, selection, scroll and resize events without cancelling or stopping any of them.

## What a selection is

- Selected page text, or selected text in a textarea or a text, search, email or URL input. Password, read-only and
  disabled fields are ignored.
- At least `minChars` non-space characters.
- Not inside the top layer (a modal dialog, popover or fullscreen element).

Each selection is classified locally, from its text and the element it starts in:

| Type       | When                                                                                 |
| ---------- | ------------------------------------------------------------------------------------ |
| `code`     | Inside `pre`, `code`, `kbd` or `samp`, or dense with code punctuation and keywords   |
| `word`     | One word of 2–30 characters, in any language, not counting the punctuation around it |
| `question` | Ends with a question mark                                                            |
| `long`     | Over 500 characters                                                                  |
| `text`     | Anything else                                                                        |

A word needs a letter, so a bare number is text; it may have digits ("19th"), apostrophes, hyphens and abbreviation
dots ("U.S."). In writing systems without spaces between words, such as Chinese and Japanese, a word is at most 4
characters, so a sentence isn't taken for one.

The language comes from the text's writing system or common words, then the nearest `lang` attribute, then the user's
language. Text that isn't code and isn't in the user's language is `differentLanguage`.

## Ranking

An action fits when its `selectionTypes` (if any) include the type, its `editable` (if set) matches, its
`condition` (if set) holds, and the trimmed selection's length is within its `minLength` and `maxLength` (if set, both
inclusive). Unknown conditions never hold; a length limit that isn't an integer is ignored. Fitting actions keep native's order, except that actions
with a `language` parameter lead for text in another language, and run straight away with the first option (the
user's language). Otherwise their options are offered, minus the selection's own language.

Ask is built in and never listed: native adds it to the toolbar and the menu.

## Reporting a selection

A selection is reported with `selectionChanged` when a selection gesture ends: a primary-button release, a Shift key
release, or select-all while editing. Only while `enabled` and `showToolbar` are both on. It's reported even when no
action fits, and again when the same text is reselected; native decides whether Ask alone is worth a toolbar and drops
repeats.

While it's reported, scrolling and resizing send `selectionMoved`, at most once per animation frame. The report ends
with `selectionCleared` on a click (other than a right-click), Escape, the selection collapsing, select-all on the page,
`pagehide`, or a pushed config that turns the tools or `showToolbar` off.

The context menu doesn't end the report: native hides its own toolbar while its menu is open.

## Requests

### `initialSetup`

- {@link "SelectionTools Messages".InitialSetupRequest}
- Sent on the first selection, or the first context menu on one, and again on the next if that failed. A page where
  the user selects nothing sends nothing. Nothing is reported until it's answered.
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
the toolbar alone. `startCollapsed`, `askAvailable` and the actions' `icon` are for native's toolbar; the page doesn't
read them.

Pushes may repeat the current config. A selection reported under the old config isn't reported again; the next
selection uses the new one.

## Subscriptions

### `selectionToolsConfigChanged`

- {@link "SelectionTools Messages".SelectionToolsConfigChangedSubscription}
- The whole config again, pushed to the main frame whenever it changes for that page.

## Notifications

### `selectionChanged`

- {@link "SelectionTools Messages".SelectionChangedNotification}
- A selection to show the toolbar for. `actions` is the same list `contextMenuOpened` would send, and
  `sourceLanguage` is worked out the same way. `rect` is the selected text's bounds in CSS pixels relative to the
  viewport; multiply by `devicePixelRatio` (which includes page zoom) for physical pixels. `maxVisibleActions` comes
  from the remote config.

```json
{
    "text": "El perro de la casa es muy grande y le gusta correr por el parque.",
    "editable": false,
    "selectionType": "text",
    "sourceLanguage": "es",
    "actions": [{ "id": "translate", "parameter": "en" }, { "id": "explain" }, { "id": "tone", "options": ["formal", "casual"] }],
    "rect": { "left": 320, "top": 181, "right": 960, "bottom": 229 },
    "devicePixelRatio": 1.25,
    "maxVisibleActions": 5
}
```

### `selectionMoved`

- {@link "SelectionTools Messages".SelectionMovedNotification}
- The reported selection's new `rect` and `devicePixelRatio` after a scroll or resize.

```json
{ "rect": { "left": 320, "top": 81, "right": 960, "bottom": 129 }, "devicePixelRatio": 1.25 }
```

### `selectionCleared`

- {@link "SelectionTools Messages".SelectionClearedNotification}
- The reported selection went away. Sent once, and only after a `selectionChanged`. Params are `{}`.

### `contextMenuOpened`

- {@link "SelectionTools Messages".ContextMenuOpenedNotification}
- Sent on `contextmenu` while `enabled`, whatever `showToolbar` says. Without a selection, `text` and `actions` are
  empty and `selectionType` and `editable` are left out. `sourceLanguage` is the nearest `lang` marking, when there
  is one.

```json
{
    "text": "El perro",
    "sourceLanguage": "es",
    "selectionType": "text",
    "editable": false,
    "actions": [{ "id": "translate", "parameter": "en" }, { "id": "explain" }, { "id": "tone", "options": ["formal", "casual"] }]
}
```

## Remote Config

Settings are read from a top-level `selectionTools` entry when there is one (see [Turning it on](#turning-it-on)):

| Setting             | Default | Meaning                                                       |
| ------------------- | ------- | ------------------------------------------------------------- |
| `maxVisibleActions` | `5`     | Passed to native: toolbar buttons before "more", Ask included |
| `minChars`          | `2`     | Shortest selection, ignoring whitespace                       |

## Testing

- Unit: `unit-test/selection-tools.js` (classification and ranking). Run `npm run test-unit` from `injected/`.
- Integration: `integration-test/selection-tools.spec.js`. Run
  `npx playwright test --project=windows selection-tools --reporter list` from `injected/` after a build.
