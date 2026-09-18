/**
 * Correct on every fixture in `self-test/`: matches `paywall` in any case.
 *
 * In `pre-existing.mjs` it is the variant that *fixes* what the baseline gets wrong, which
 * the runner should credit rather than merely tolerate. In `introduced.mjs` it is the
 * baseline that a worse variant is measured against.
 */
export function evaluateMatch() {
    return /paywall/i.test(document.body.textContent || '');
}
