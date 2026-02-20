import { objectDefineProperty } from './captured-globals.js';

/**
 * Ensures navigator.duckduckgo exists, creating it if necessary.
 * Used by webkit messaging and navigator-interface feature.
 * @param {object} [options]
 * @param {typeof Object.defineProperty} [options.defineProperty] - Custom defineProperty (e.g. with logging), defaults to captured global
 * @returns {object} The navigator.duckduckgo object
 */
export function ensureNavigatorDuckDuckGo({ defineProperty = objectDefineProperty } = {}) {
    if (navigator.duckduckgo) {
        return navigator.duckduckgo;
    }
    const target = {messageHandlers: {}};
    defineProperty(Navigator.prototype, 'duckduckgo', {
        value: target,
        enumerable: true,
        configurable: true,
        writable: false,
    });
    return target;
}
