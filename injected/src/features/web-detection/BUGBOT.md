# Web-detection: keep captcha/anti-bot matching layout-free

web-detection runs its detector selectors on live pages, including
Cloudflare/Turnstile/hCaptcha/reCAPTCHA challenge pages. Forcing synchronous
layout on challenge elements perturbs their anti-bot heuristics and can cause
challenge **reload loops**. The `visibility: 'content'` mode (`hasContent`)
exists to detect presence WITHOUT forcing layout — it inspects a detached
`DOMParser` copy of the element. This risk is invisible to the hermetic test
suite, so it must be caught in review.

## Flag when a change in this directory

- Introduces `getBoundingClientRect`, `getClientRects`, `getComputedStyle`,
  `offset*` / `scroll*` / `client*` dimension reads, or `elementFromPoint` into
  the `content` / `hasContent` code path. That path must stay layout-free (it
  operates on a detached copy).
- Adds a new visibility mode or captcha/anti-bot detector that measures live
  element geometry/style instead of using the layout-free `content` path.
- Routes captcha/challenge detectors through a path that forces layout on matched
  elements (e.g. the `visible` path, which calls `isVisible`).

## Require

For captcha/anti-bot detection, keep element/visibility checks layout-free
(prefer `visibility: 'content'`). Any change that must read live layout in a
challenge-detection path should be justified, config-gated, and A/B / slow-rolled
before wide enablement. Rate such changes at least Medium risk (never Low).

## Don't flag

- Layout reads in test code (`integration-test` / `unit-test`).
- The existing `visible` / `hidden` modes themselves — they legitimately force
  layout and are intended for non-challenge detectors. Only flag if a
  captcha/anti-bot detector is newly routed through them.
