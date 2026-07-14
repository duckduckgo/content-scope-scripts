# PR Review Guidelines for Cursor Bugbot

## Web-platform API changes in injected code (anti-bot / captcha risk)

Injected code under `injected/src/features/**` runs inside arbitrary third-party
pages, including anti-bot and captcha flows (Cloudflare interstitials and
Turnstile, hCaptcha, reCAPTCHA, PerimeterX, DataDome, and similar). These flows
watch for signs that the page is being automated or tampered with. New or changed
web-platform API usage in injected code can perturb their heuristics and cause
challenge **reload loops**, failed challenges, or general breakage — often on
pages that are impossible to reproduce hermetically in CI.

Because this risk is invisible to the test suite, it must be caught in review.

### When to flag

Flag the PR when a diff **adds or changes** any of the following in injected
feature code (`injected/src/features/**`), and treat it as **at least Medium
risk — never Low** (so the auto-review workflow routes it to manual review):

- **Forced synchronous layout / style reads:** `getComputedStyle`,
  `getBoundingClientRect`, `getClientRects`, `offsetWidth`/`offsetHeight`,
  `offsetTop`/`offsetLeft`, `scrollWidth`/`scrollHeight`, `clientWidth`/`clientHeight`,
  `elementFromPoint`, `matchMedia`, `Range.getBoundingClientRect`. These are the
  known trigger for the Cloudflare challenge reload loop.
- **Global or prototype mutation observable to the page:** `Object.defineProperty`
  / `Object.defineProperties` on `window`, `Navigator`, `Document`, `Element`, or
  other built-in prototypes; `wrapMethod`/proxy shims that change observable
  behavior; new injected globals or overrides of existing web APIs.
- **Page-wide observers or polling:** new `MutationObserver`, `IntersectionObserver`,
  `ResizeObserver`, `PerformanceObserver`, or `setInterval` / `setTimeout` /
  `requestAnimationFrame` loops that run on all pages.
- **DOM serialization on all pages:** `outerHTML` / `innerHTML` reads feeding
  `DOMParser.parseFromString`, `XMLSerializer`, or `cloneNode` of large subtrees.
- **New or broadened detectors/selectors:** changes to `web-detection`,
  `web-compat`, element-hiding, or any selector touching `captcha`, `challenge`,
  `cf-*`, `turnstile`, `g-recaptcha`, `h-captcha`; or a selector broad enough to
  match page-level containers (e.g. `body`, `html`, `*`).
- **A feature that runs unconditionally** — i.e. not gated behind a remote-config
  feature flag, or enabled by default for all sites/frames.

### What the review comment must require

When flagging, the comment should state that the change needs a controlled
rollout and ask the author to confirm both of these before wide enablement:

1. **Config-gated.** The behavior is behind a `privacy-configuration` feature
   flag and is **not** on by default.
2. **A/B tested or slow / staged rollout with monitoring.** Ship it via a
   content-scope experiment (A/B) or a staged rollout, with breakage/telemetry
   signals watched, rather than enabling it for everyone at once. Reference the
   [content-scope experiments guide](https://github.com/duckduckgo/privacy-configuration/blob/main/.cursor/rules/content-scope-experiments.mdc).

Explicitly say in the comment that this change **needs A/B testing / slow
rollout** because it may perturb anti-bot/captcha pages.

### Prefer layout-free alternatives

If the change reads layout/geometry to detect presence or visibility, ask whether
a layout-free approach works instead (e.g. the `visibility: 'content'` mode in
`web-detection`, which parses a detached serialization rather than forcing
layout). Forcing layout on challenge elements is the specific pattern that caused
the Cloudflare reload loop.

### What NOT to flag

- Layout/style reads or observers added under `injected/integration-test/**` or
  `injected/unit-test/**` — test code does not ship to pages.
- Existing API usage in a file that the PR merely moves or reformats without
  changing behavior.
- Layout reads that are already gated behind an existing, unchanged config flag
  and are not being broadened by the PR.
- API usage in feature code that provably never runs in the page's main world on
  arbitrary sites (e.g. duck:// special-pages under `special-pages/**`).
