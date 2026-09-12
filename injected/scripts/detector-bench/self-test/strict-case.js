/**
 * Matches only an upper-case `PAYWALL`, so it is wrong about a page that says `paywall`.
 *
 * Used as the *baseline* in `pre-existing.mjs`, to produce a failure that is not any
 * variant's fault. See `self-test/README.md`.
 *
 * The condition config is ignored on purpose: this is a fixed outcome for the runner to
 * report, not an implementation of anything.
 */
export function evaluateMatch() {
    return (document.body.textContent || '').includes('PAYWALL');
}
