/**
 * Ensures navigator.duckduckgo exists, creating it if necessary.
 * Used by webkit messaging and navigator-interface feature.
 * @param {object} options
 * @param {Window} options.window - The window object to use
 * @param {typeof Object.defineProperty} options.defineProperty - The defineProperty function to use
 * @param {object} [options.defineOn] - The object to define the property on (defaults to window.navigator)
 * @returns {object} The navigator.duckduckgo object
 */
export function ensureNavigatorDuckDuckGo({ window, defineProperty, defineOn }) {
    // @ts-expect-error - duckduckgo is a custom property added at runtime
    if (window.navigator.duckduckgo) {
        // @ts-expect-error - duckduckgo is a custom property added at runtime
        return window.navigator.duckduckgo;
    }
    const target = {};
    defineProperty(defineOn ?? window.navigator, 'duckduckgo', {
        value: target,
        enumerable: true,
        configurable: true,
        writable: false,
    });
    return target;
}

