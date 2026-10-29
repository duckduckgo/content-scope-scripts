---
title: Page Translation
---

# Page Translation

Finds the text on a page that needs translating, writes translations back onto the page's own nodes, and puts the original back. Native does language detection, translation, batching and ordering. Nothing runs until native sends a message.

Bundled for `apple` (page world) and `android`. `extract` and `apply` always reply, even when a unit or the page's DOM throws.

Apple native must fill `$CONTENT_SCOPE_JSON$` (the config as a JavaScript string literal) in every Apple bundle, isolated and Duck.ai ones included. That is the C-S-S 18.0.0 change, not specific to this feature, but this feature needs it.

## Messages

Native sends subscriptions; the feature replies with notifications.

| Native sends                                                          | Feature replies | Params                                                                        |
| --------------------------------------------------------------------- | --------------- | ----------------------------------------------------------------------------- |
| `extract` `{}`                                                        | `extractResult` | `{ units: Unit[] }`                                                           |
| `apply` `{ sourceLanguage, targetLanguage, updates: [{ id, text }] }` | `applyResult`   | `{ count }`: updates written                                                  |
| `revert` `{}`                                                         | `revertResult`  | `{ count, exact }`: units restored; when `exact` is false, reload the page    |
| —                                                                     | `unitsAdded`    | `{ units: Unit[] }`: content that appeared after `extract` (**not sent yet**) |

`Unit = { id, text, html, vp }`:

- `html: false`: plain text. Translate it as plain text; the result is written as text.
- `html: true`: an HTML fragment. Translate it as HTML.
- `vp: 1`: the unit is in the viewport. Translate these first.
- Ids are never reused while the page is open.

`extract` needs no languages, so native can detect the page's language from the units it returns. `apply` carries `sourceLanguage` (the detected page language) and `targetLanguage` (the language translated into), both BCP 47. A second `extract` while the page is translated reverts it first, without sending `revertResult`.

## What becomes a unit

- The innermost block element that holds text, such as a `p`, `li`, `h1` or `td`. A block inside an inline element (`<li><a><div>…`) counts as a block.
- In a container that also holds blocks, each run of text and inline elements between those blocks is one unit.
- Floated elements count as inline, so a drop cap stays inside its paragraph.
- A unit needs at least one letter.
- Never translated: `script`, `style`, `noscript`, `template`, `textarea`, `code`, `kbd`, `samp`, `var`, `math`, `svg`, `iframe`, `embed`, `object`, `select` (for now), `translate="no"`, `.notranslate` and editable content.
- Content marked with a `lang` other than `sourceLanguage` is still extracted, but `apply` doesn't write it: a unit inside such an element is skipped (not counted), and such an element inside a unit comes back untouched while the rest of the sentence is translated. The `<html lang>` is ignored for this check, and an empty `sourceLanguage` turns it off.
- Inside a unit, a never-translated element is sent as an empty tag and comes back untouched: `Use <code data-t="0"></code> to check`.
- `script`, `style` and `template` inside a unit aren't sent at all. They, and comments, stay before or after the unit's text, as they were.

## What is sent

- A unit without child elements is sent as plain text.
- Otherwise each element becomes `<tag data-t="N">`, with no other attributes. `N` is the element's index within the unit.
- A unit that starts with an element (a drop cap: `<span>A</span>iwa…`) is wrapped in `<div>…</div>`, and must come back as a single `div`. Whitespace and invisible formatting characters (such as bidi marks) outside the `div` are accepted; the formatting characters are kept.
- Soft hyphens are removed.

## Writing back

The translation is parsed with the browser's parser through a Trusted Types policy (`ddg-translation`), or with a small parser of our own when the page refuses that policy. Either way, output with tags or attributes we didn't send is rejected and the unit stays as it is.

The translation is then merged onto the original nodes. Elements are moved, never recreated, so listeners, form values and framework-managed nodes survive. Text goes into the existing text nodes.

- A tag the engine returns twice: the second gets a copy built only from copies. Original nodes never move into a copy.
- A tag returned empty: stays empty. The engine empties a tag when it moves the text elsewhere, so putting the original back would double it. Elements inside it are put back.
- A tag the engine dropped: put back at the end of its container.
- An id we didn't send, or a tag that would end up inside itself: its text is kept, no element is created or moved.

The first write sets `<html lang>` to `targetLanguage`. `revert` puts back every text, attribute, node order and the original `lang`. It then checks that every original node it moved is back in the page, and reports `exact: false` if not, so native can reload as a fallback.

## Tests

From `injected/`:

```sh
npm run build && npx playwright test integration-test/page-translation.spec.js --project ios-main-world --project android --reporter list
npx jasmine --config=unit-test/config.json --filter="page-translation parse"
```

Fixtures are in `integration-test/test-pages/page-translation/pages/`. Each one lists its expected units in the spec's `FIXTURES`, and runs the extract, apply and revert checks. Apply uses a fake translator that marks each text run as `‹…›`.
