# Web-detection: keep matching captured, and captcha/anti-bot matching layout-free

## Captured globals

Detector selectors, XPath expressions and text patterns come from remote config and are evaluated
against hostile pages. Every DOM API and intrinsic this directory touches must come from
`injected/src/captured-globals.js`, taken at document_start: a page that replaces
`Document.prototype.querySelectorAll`, `RegExp.prototype.test`, `Array.prototype.some` or any
comparable slot otherwise reads the detector configuration out of the arguments and receivers it is
handed. `eslint.config.js` restricts the globals, prototype methods and iteration forms this
directory may use; treat a change that relaxes those restrictions, or adds a `// eslint-disable` for
them, as a disclosure of the detector list.

### Flag when a change in this directory

- Reads a DOM global (`document`, `getComputedStyle`, `DOMParser`, …) or calls a prototype method
  (`.test`, `.querySelectorAll`, `.some`, `.join`, …) directly rather than through a captured
  reference.
- Iterates config-derived data with `for...of`, spread or array destructuring, all of which route
  through `Array.prototype[Symbol.iterator]`.
- Adds a captured reference that is looked up lazily rather than at module evaluation: the capture
  is only sound because it happens before any page script runs.

## Layout

web-detection runs its detector selectors on live pages, including
Cloudflare/Turnstile/hCaptcha/reCAPTCHA challenge pages. Forcing synchronous
layout on challenge elements perturbs their anti-bot heuristics and can cause
challenge **reload loops**. The `visibility: 'content'` mode (`hasContent`)
exists to detect presence WITHOUT forcing layout — it inspects a detached
`DOMParser` copy of the element. This risk is invisible to the hermetic test
suite, so it must be caught in review.

### Flag when a change in this directory

- Introduces `getBoundingClientRect`, `getClientRects`, `getComputedStyle`,
  `offset*` / `scroll*` / `client*` dimension reads, or `elementFromPoint` into
  the `content` / `hasContent` code path. That path must stay layout-free (it
  operates on a detached copy).
- Adds a new visibility mode or captcha/anti-bot detector that measures live
  element geometry/style instead of using the layout-free `content` path.
- Routes captcha/challenge detectors through a path that forces layout on matched
  elements (e.g. the `visible` path, which calls `isVisible`).

### Require

For captcha/anti-bot detection, keep element/visibility checks layout-free
(prefer `visibility: 'content'`). Any change that must read live layout in a
challenge-detection path should be justified, config-gated, and A/B / slow-rolled
before wide enablement. Rate such changes at least Medium risk (never Low).

## Don't flag

- Direct DOM and prototype use in test code (`integration-test` / `unit-test`), which replaces these
  slots deliberately to prove the captures hold.
- Layout reads in test code.
- The existing `visible` / `hidden` modes themselves — they legitimately force
  layout and are intended for non-challenge detectors. Only flag if a
  captcha/anti-bot detector is newly routed through them.
