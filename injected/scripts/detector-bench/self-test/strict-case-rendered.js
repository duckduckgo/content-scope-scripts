/**
 * Wrong in exactly the same way as `strict-case.js`, by a different route: rendered text
 * rather than `textContent`.
 *
 * Two implementations agreeing on a wrong answer is the case that must not fail the run -
 * neither introduced anything. Reaching it differently keeps the test from passing merely
 * because both variants resolved to the same bundle.
 */
export function evaluateMatch() {
    return (document.body.innerText || '').includes('PAYWALL');
}
