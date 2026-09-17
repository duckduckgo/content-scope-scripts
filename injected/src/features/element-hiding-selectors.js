/**
 * Wrap selector(s) in :is(..) to make them forgiving
 * @param {string} selector
 */
export function forgivingSelector(selector) {
    return `:is(${selector})`;
}

/**
 * Resolve a rule's selector for use with querySelectorAll
 *
 * :is() makes a selector list forgiving, but has a perf cost since
 * it's a pseudo-class that isn't indexed. Only wrap when the selector
 * might be a list, in which case one malformed selector can lead to
 * the rest of the list not applying
 *
 * @param {string} selector
 */
export function querySelectorFor(selector) {
    return selector.includes(',') ? forgivingSelector(selector) : selector;
}
