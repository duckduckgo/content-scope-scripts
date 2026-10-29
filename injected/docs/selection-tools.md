---
title: Selection Tools
---

# Selection Tools

Reports the user's text selection to native, which offers Duck.ai actions for it: a toolbar over the selection, and
the same actions in the context menu. This feature reads the selection, works out what kind of text it is and where it
is on screen, and tells native. It draws nothing and knows nothing of the actions: native owns them, picks the ones
that fit and runs them.

Runs in the top frame only. Windows only for now.

## Turning it on

Native decides, through the feature's own config. It sets the `selectionTools` entry in the config it injects for the
user: `state` is `disabled` when the `aiChat` → `selectionTools` sub-feature or the global AI toggle is off, its
`exceptions` hold native's own sites such as Duck.ai, and the `showToolbar` setting is the user's toolbar setting.
Native only ever turns the feature off this way; a remote `disabled` still wins.

These can change while a page is open, but the injected config only reaches pages that load afterwards, so
`selectionToolsConfigChanged` pushes `enabled` and `showToolbar` to open pages and overrides the injected config until
the page reloads. A page that loaded with the feature off doesn't run it at all, so turning it on reaches that page
only once it reloads.

The feature is in `platformSpecificFeatures`, like `contextMenu` and `textSelection`, so it starts without a top-level
`selectionTools` entry in the privacy config, and also runs on sites where protections are off. If the privacy config
does have that entry, its `state` is still a kill switch and its `exceptions` turn the feature off on those sites.

## Page footprint

On Windows the feature runs in the page's main world, so pages can see any element it adds. It adds one only to
measure a selection in a text field, which has no geometry of its own: a host element (`<ddg-selection-tools>`) with
the field's text laid out again in a closed shadow root, appended and removed again within the same task.

It listens to mouse, key, selection, scroll and resize events without cancelling or stopping any of them, and only
acts on trusted ones, so page script can't fire them to make it report a selection.

## What a selection is

- Selected page text, or selected text in a textarea or a text, search, email or URL input. Password, read-only and
  disabled fields are ignored. Text inside open shadow roots counts, such as code blocks drawn by a custom element;
  closed ones can't be read.
- At least `minChars` non-space characters.

Selected page text leaves out what the user can't see, which a page could use to slip instructions into what's sent
to Duck.ai: text with zero or near-zero opacity, hidden visibility, a colour that's fully or nearly transparent (gradient
text drawn through `background-clip: text` still counts as visible), a font under 4px, or a box shrunk to a pixel with
its overflow cut off, as screen-reader-only text is. Text in the same colour as its background still gets through.

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

The `language` comes from the text's writing system or common words, then the nearest `lang` attribute, as a primary
subtag. When neither says, it's left out, and native takes the text to be in the user's language.

## Reporting a selection

A selection is reported with `selectionChanged` when a selection gesture ends: a primary-button release, a Shift key
release, or select-all while editing. Only while `enabled` and `showToolbar` are both on, and not for selections in the
top layer (a modal dialog, popover or fullscreen element), where the toolbar would sit behind. It's reported again when
the same text is reselected; native drops repeats.

While it's reported, scrolling and resizing send `selectionMoved`, at most once per animation frame. The report ends
with `selectionCleared` on a click (other than a right-click), Escape, the selection collapsing, select-all on the page,
`pagehide`, or a pushed config that turns the tools or `showToolbar` off.

The context menu sends `contextMenuOpened` instead, while `enabled`. Its `rect` lets native show the toolbar, collapsed,
once the menu closes, and starts a report, or leaves one in place, that later moves and clears as above. It has no
`rect` when no toolbar would show: with `showToolbar` off, or in the top layer.

## Subscriptions

### `selectionToolsConfigChanged`

- {@link "SelectionTools Messages".SelectionToolsConfigChangedSubscription}
- `{ enabled, showToolbar }`, pushed to the main frame whenever either changes for that page. `enabled: false` turns
  the feature off for the page, context-menu reports included; `showToolbar: false` stops selection reports, and the
  context menu's `rect`, but not context-menu reports.
- Pushes may repeat the current config, which changes nothing.

## Notifications

### `selectionChanged`

- {@link "SelectionTools Messages".SelectionChangedNotification}
- A selection to show the toolbar for. `rect` is the selected text's bounds in CSS pixels relative to the viewport;
  multiply by `devicePixelRatio` (which includes page zoom) for physical pixels.

```json
{
    "text": "El perro de la casa es muy grande y le gusta correr por el parque.",
    "editable": false,
    "selectionType": "text",
    "language": "es",
    "rect": { "left": 320, "top": 181, "right": 960, "bottom": 229 },
    "devicePixelRatio": 1.25
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
- The reported selection went away. Sent once, and only after a report with a `rect`. Params are `{}`.

### `contextMenuOpened`

- {@link "SelectionTools Messages".ContextMenuOpenedNotification}
- Sent on `contextmenu` while `enabled`, whatever `showToolbar` says, with the same fields as `selectionChanged` plus
  `selectedTextKey`. Without a selection it's `{ "text": "" }`, so native knows the page has none.
- `text` leaves out hidden text (see [What a selection is](#what-a-selection-is)), so it can differ from the selected
  text the browser gives native with its own context menu event. `selectedTextKey` pairs the two: the 32-bit FNV-1a
  hash, as 8 lowercase hex digits, of the browser's text over its UTF-16 code units, after collapsing each run of
  whitespace (`\s`) to one space and trimming. Native runs a paired action with the report's `text`. Where there's no
  report to pair with (frames, or sites the feature doesn't run on), native only has the browser's text, hidden parts
  included.

```json
{
    "text": "El perro",
    "selectedTextKey": "a43a2364",
    "editable": false,
    "selectionType": "text",
    "language": "es",
    "rect": { "left": 320, "top": 181, "right": 392, "bottom": 205 },
    "devicePixelRatio": 1.25
}
```

## Remote Config

Settings are read from a top-level `selectionTools` entry when there is one (see [Turning it on](#turning-it-on)):

| Setting       | Default | Meaning                                                                |
| ------------- | ------- | ---------------------------------------------------------------------- |
| `minChars`    | `2`     | Shortest selection, ignoring whitespace                                |
| `showToolbar` | `true`  | Set by native from the user's setting; `false` stops selection reports |

## Testing

- Unit: `unit-test/selection-tools.js` (classification and `selectedTextKey`). Run `npm run test-unit` from
  `injected/`.
- Integration: `integration-test/selection-tools.spec.js`. Run
  `npx playwright test --project=windows selection-tools --reporter list` from `injected/` after a build.
