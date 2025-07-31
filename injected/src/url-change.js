import { DDGProxy, DDGReflect, isBeingFramed } from './utils.js';
import ContentFeature from './content-feature.js';

const urlChangeListeners = new Set();
/**
 * Register a listener to be called when the URL changes.
 * @param {function} listener
 */
export function registerForURLChanges(listener) {
    if (urlChangeListeners.size === 0) {
        listenForURLChanges();
    }
    urlChangeListeners.add(listener);
}

function handleURLChange(navigationType = 'unknown') {
    for (const listener of urlChangeListeners) {
        listener(navigationType);
    }
}

function listenForURLChanges() {
    const urlChangedInstance = new ContentFeature('urlChanged', {}, {});
    // if the browser supports the navigation API, use that to listen for URL changes
    if ('navigation' in globalThis && 'addEventListener' in globalThis.navigation) {
        // We listen to `navigatesuccess` instead of `navigate` to ensure the navigation is committed.
        // But, `navigatesuccess` does not provide the navigationType, so we capture it at `navigate` time
        // then look it up later.  This allows consumers to filter on navigationType.
        // WeakMap ensures we don't hold onto the event.target longer than necessary and can be freed.
        const navigations = new WeakMap();
        globalThis.navigation.addEventListener('navigate', (event) => {
            navigations.set(event.target, event.navigationType);
        });
        globalThis.navigation.addEventListener('navigatesuccess', (event) => {
            const navigationType = navigations.get(event.target) || 'unknown';
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
            console.log('pushstate event');
            handleURLChange('push');
            return changeResult;
        },
    });
    historyMethodProxy.overload();
    // listen for popstate events in order to run on back/forward navigations
    window.addEventListener('popstate', () => {
        handleURLChange('popState');
    });
}
