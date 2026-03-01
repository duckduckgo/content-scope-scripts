import { DDGProxy, DDGReflect, isBeingFramed } from './utils.js';
import ContentFeature from './content-feature.js';

/**
 * @typedef {'push' | 'replace' | 'reload' | 'traverse' | 'unknown'} NavigationType
 * An enumerated value representing the type of navigation.
 *
 * Possible values:
 * - `'push'`     - A new location is navigated to, causing a new entry to be pushed onto the history list.
 * - `'replace'`  - The Navigation.currentEntry is replaced with a new history entry.
 * - `'reload'`   - The Navigation.currentEntry is reloaded.
 * - `'traverse'` - The browser navigates from one existing history entry to another existing history entry.
 * - `'unknown'`  - Fallback but highly unlikely. If the WeakMap lookup fails that means the navigate event wasn't captured.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/NavigateEvent/navigationType
 */

/**
 * @typedef {(navigationType: NavigationType) => void} URLChangeListener
 */

const urlChangeListeners = new Set();

/**
 * Register a listener to be called when the URL changes.
 * @param {URLChangeListener} listener - Callback function that receives the navigation type
 */
export function registerForURLChanges(listener) {
    if (urlChangeListeners.size === 0) {
        listenForURLChanges();
    }
    urlChangeListeners.add(listener);
}

/**
 * @param {NavigationType} navigationType - The type of navigation that occurred
 */
function handleURLChange(navigationType = 'unknown') {
    for (const listener of urlChangeListeners) {
        listener(navigationType);
    }
}

function listenForURLChanges() {
    const urlChangedInstance = new ContentFeature('urlChanged', {}, {}, /** @type {any} */ ({}));
    // if the browser supports the navigation API, use that to listen for URL changes
    /** @type {any} */
    const nav = /** @type {any} */ (globalThis).navigation;
    if (nav && 'addEventListener' in nav) {
        // We listen to `navigatesuccess` instead of `navigate` to ensure the navigation is committed.
        // But, `navigatesuccess` does not provide the navigationType, so we capture it at `navigate` time
        // then look it up later.  This allows consumers to filter on navigationType.
        // WeakMap ensures we don't hold onto the event.target longer than necessary and can be freed.
        const navigations = new WeakMap();
        nav.addEventListener('navigate', (/** @type {any} */ event) => {
            navigations.set(event.target, event.navigationType);
        });
        nav.addEventListener('navigatesuccess', (/** @type {any} */ event) => {
            const navigationType = navigations.get(event.target);
            handleURLChange(navigationType);
            navigations.delete(event.target);
        });
        // Exit early if the navigation API is supported, i.e. history proxy and popState listener aren't created.
        return;
    }
    if (isBeingFramed()) {
        // don't run if we're in an iframe
        return;
    }
    // single page applications don't have a DOMContentLoaded event on navigations, so
    // we use proxy/reflect on history.pushState to call applyRules on page navigations
    const historyMethodProxy = new DDGProxy(urlChangedInstance, History.prototype, 'pushState', {
        apply(target, thisArg, args) {
            const changeResult = DDGReflect.apply(target, thisArg, args);
            handleURLChange('push');
            return changeResult;
        },
    });
    historyMethodProxy.overload();
    const historyMethodProxyReplace = new DDGProxy(urlChangedInstance, History.prototype, 'replaceState', {
        apply(target, thisArg, args) {
            const changeResult = DDGReflect.apply(target, thisArg, args);
            handleURLChange('replace');
            return changeResult;
        },
    });
    historyMethodProxyReplace.overload();
    // listen for popstate events in order to run on back/forward navigations
    window.addEventListener('popstate', () => {
        handleURLChange('traverse');
    });
}
