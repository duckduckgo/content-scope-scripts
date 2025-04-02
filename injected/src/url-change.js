import { DDGProxy, DDGReflect, computeLimitedSiteObject } from './utils.js';

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

function handleURLChange() {
    const site = computeLimitedSiteObject();
    for (const listener of urlChangeListeners) {
        listener.urlChanged(site);
    }
}

function listenForURLChanges() {
    // single page applications don't have a DOMContentLoaded event on navigations, so
    // we use proxy/reflect on history.pushState to call applyRules on page navigations
    const historyMethodProxy = new DDGProxy(this, History.prototype, 'pushState', {
        apply(target, thisArg, args) {
            handleURLChange();
            return DDGReflect.apply(target, thisArg, args);
        },
    });
    historyMethodProxy.overload();
    // listen for popstate events in order to run on back/forward navigations
    window.addEventListener('popstate', () => {
        handleURLChange();
    });
}