import ContentFeature from '../content-feature.js';
import { isBeingFramed } from '../utils.js';

// Import from our minimal scriptlets module (contains only functions we actually use)
import {
    setCookie,
    trustedSetCookie,
    setCookieReload,
    removeCookie,
    setConstant,
    setLocalStorageItem,
    abortCurrentInlineScript,
    abortOnPropertyRead,
    abortOnPropertyWrite,
    preventAddEventListener,
    preventWindowOpen,
    preventSetTimeout,
    removeNodeText,
    preventFetch,
} from './scriptlets-minimal.js';

export class Scriptlets extends ContentFeature {
    init() {
        if (isBeingFramed()) {
            return;
        }
        /* @type {import('@adguard/scriptlets').Source} */
        const source = {
            verbose: true,
        };

        const scriptlets = this.getFeatureSetting('scriptlets');
        for (const scriptlet of scriptlets) {
            source.name = scriptlet.name;
            source.args = Object.values(scriptlet.attrs);
            this.runScriptlet(scriptlet, source);
        }
    }

    runScriptlet(scriptlet, source) {
        const attrs = scriptlet.attrs || {};

        // add debug flag to site breakage reports
        this.addDebugFlag();

        // The extracted scriptlets expect (source, args) where args is an array
        if (scriptlet.name === 'setCookie') {
            setCookie(source, [attrs.name, attrs.value, attrs.path, attrs.domain]);
        }
        if (scriptlet.name === 'trustedSetCookie') {
            trustedSetCookie(source, [attrs.name, attrs.value, attrs.path, attrs.domain]);
        }
        if (scriptlet.name === 'setCookieReload') {
            setCookieReload(source, [attrs.name, attrs.value, attrs.path, attrs.domain]);
        }
        if (scriptlet.name === 'removeCookie') {
            removeCookie(source, [attrs.match]);
        }
        if (scriptlet.name === 'setConstant') {
            setConstant(source, [attrs.property, attrs.value, attrs.stack, attrs.valueWrapper, attrs.setProxyTrap]);
        }
        if (scriptlet.name === 'setLocalStorageItem') {
            setLocalStorageItem(source, [attrs.key, attrs.value]);
        }
        if (scriptlet.name === 'abortCurrentInlineScript') {
            abortCurrentInlineScript(source, [attrs.property, attrs.search]);
        }
        if (scriptlet.name === 'abortOnPropertyRead') {
            abortOnPropertyRead(source, [attrs.property]);
        }
        if (scriptlet.name === 'abortOnPropertyWrite') {
            abortOnPropertyWrite(source, [attrs.property]);
        }
        if (scriptlet.name === 'preventAddEventListener') {
            preventAddEventListener(source, [attrs.typeSearch, attrs.listenerSearch, attrs.additionalArgName, attrs.additionalArgValue]);
        }
        if (scriptlet.name === 'preventWindowOpen') {
            preventWindowOpen(source, [attrs.match, attrs.delay, attrs.replacement]);
        }
        if (scriptlet.name === 'preventSetTimeout') {
            preventSetTimeout(source, [attrs.matchCallback, attrs.matchDelay]);
        }
        if (scriptlet.name === 'removeNodeText') {
            removeNodeText(source, [attrs.nodeName, attrs.textMatch, attrs.parentSelector]);
        }
        if (scriptlet.name === 'preventFetch') {
            preventFetch(source, [attrs.propsToMatch, attrs.responseBody, attrs.responseType]);
        }
    }
}

export default Scriptlets;
