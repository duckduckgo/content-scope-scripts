import ContentFeature from '../content-feature.js';
import { isBeingFramed } from '../utils.js';
import { trustedSetAttr } from './Scriptlets/src/scriptlets/trusted-set-attr.js'
import { setCookie } from './Scriptlets/src/scriptlets/set-cookie.js';
import { removeCookie } from './Scriptlets/src/scriptlets/remove-cookie.js';
import { setConstant } from './Scriptlets/src/scriptlets/set-constant.js';
import { abortCurrentInlineScript } from './Scriptlets/src/scriptlets/abort-current-inline-script.js';
import { abortOnPropertyRead } from './Scriptlets/src/scriptlets/abort-on-property-read.js';
import { abortOnPropertyWrite } from './Scriptlets/src/scriptlets/abort-on-property-write.js';
import { trustedReplaceNodeText } from './Scriptlets/src/scriptlets/trusted-replace-node-text.js';

export class Scriptlets extends ContentFeature {
    init() {
        if (isBeingFramed()) {
            return;
        }
        /* @type {import('./Scriptlets/src/scriptlets/scriptlets.ts').Source} */
        const source = {
            verbose: true
        };
        // TODO populate source

        const scriptlets = this.getFeatureSetting('scriptlets');
        for (const scriptlet of scriptlets) {
            this.runScriptlet(scriptlet, source);
        }
    }

    runScriptlet(scriptlet, source) {
        const attrs = scriptlet.attrs;
        if (scriptlet.name === 'trustedSetAttr') {
            trustedSetAttr(source, attrs.selector, attrs.attr, attrs.value);
        }
        if (scriptlet.name === 'setCookie') {
            setCookie(source, attrs.name, attrs.value, attrs.path, attrs.domain);
        }
        if (scriptlet.name === 'removeCookie') {
            removeCookie(source, attrs.match);
        }
        if (scriptlet.name === 'setConstant') {
            setConstant(source, attrs.property, attrs.value, attrs.stack, attrs.valueWrapper, attrs.setProxyTrap);
        }
        if (scriptlet.name === 'trustedReplaceNodeText') {
            trustedReplaceNodeText(source, attrs.nodeName, attrs.textMatch, attrs.pattern, attrs.replacement, ...attrs.extraArgs);
        }
        if (scriptlet.name === 'abortCurrentInlineScript') {
            abortCurrentInlineScript(source, attrs.property, attrs.search);
        }
        if (scriptlet.name === 'abortOnPropertyRead') {
            abortOnPropertyRead(source, attrs.property)
        }
        if (scriptlet.name === 'abortOnPropertyWrite') {
            abortOnPropertyWrite(source, attrs.property)
        }
    }
}

export default Scriptlets;