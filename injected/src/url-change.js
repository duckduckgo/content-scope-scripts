import { DDGProxy, DDGReflect, computeLimitedSiteObject } from './utils.js';
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

function handleURLChange() {
    const site = computeLimitedSiteObject();
    for (const listener of urlChangeListeners) {
        listener(site);
    }
}

function listenForURLChanges() {
    const urlChangedInstance = new ContentFeature('urlChanged', {}, {});
    // single page applications don't have a DOMContentLoaded event on navigations, so
    // we use proxy/reflect on history.pushState to call applyRules on page navigations
    const historyMethodProxy = new DDGProxy(urlChangedInstance, History.prototype, 'pushState', {
        apply(target, thisArg, args) {
            const changeResult = DDGReflect.apply(target, thisArg, args);
            handleURLChange();
            return changeResult;
        },
    });
    historyMethodProxy.overload();
    // listen for popstate events in order to run on back/forward navigations
    window.addEventListener('popstate', () => {
        handleURLChange();
    });
}
