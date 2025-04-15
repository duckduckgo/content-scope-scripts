import ContentFeature from '../content-feature.js';
import { isBeingFramed } from '../utils.js';
import { trustedSetAttr } from './Scriptlets/src/scriptlets/trusted-set-attr.js'
import { setCookie } from './Scriptlets/src/scriptlets/set-cookie.js';
import { removeCookie } from './Scriptlets/src/scriptlets/remove-cookie.js';
import { setConstant } from './Scriptlets/src/scriptlets/set-constant.js';
import { replaceNodeText } from './Scriptlets/src/helpers/node-text-utils.js';
import { abortCurrentInlineScript } from './Scriptlets/src/scriptlets/abort-current-inline-script.js';
import { abortOnPropertyRead } from './Scriptlets/src/scriptlets/abort-on-property-read.js';
import { abortOnPropertyWrite } from './Scriptlets/src/scriptlets/abort-on-property-write.js';

export class Scriptlets extends ContentFeature {
    init() {
        if (isBeingFramed()) {
            return;
        }
        /* @type {import('./Scriptlets/src/scriptlets/scriptlets.ts').Source} */
        const source = {};
        // TODO populate source

        const scriptlets = this.getFeatureSetting('scriptlets');
        for (const scriptlet of scriptlets) {
            this.runScriptlet(scriptlet, source);
        }
    }

    runScriptlet(scriptlet, source) {
        if (scriptlet.name === 'trustedSetAttr') {
            trustedSetAttr(source, scriptlet.selector, scriptlet.attr, scriptlet.value);
        }
        if (scriptlet.name === 'setCookie') {
            setCookie(source, scriptlet.name, scriptlet.value, scriptlet.path, scriptlet.domain);
        }
        if (scriptlet.name === 'removeCookie') {
            removeCookie(source, scriptlet.match);
        }
        if (scriptlet.name === 'setConstant') {
            setConstant(source, scriptlet.property, scriptlet.value, scriptlet.stack, scriptlet.valueWrapper, scriptlet.setProxyTrap);
        }
        if (scriptlet.name === 'replaceNodeText') {
            replaceNodeText(source, scriptlet.node, scriptlet.pattern, scriptlet.replacement);
        }
        if (scriptlet.name === 'abortCurrentInlineScript') {
            abortCurrentInlineScript(source, scriptlet.property, scriptlet.search);
        }
        if (scriptlet.name === 'abortOnPropertyRead') {
            abortOnPropertyRead(source, scriptlet.property)
        }
        if (scriptlet.name === 'abortOnPropertyWrite') {
            abortOnPropertyWrite(source, scriptlet.property)
        }
    }
}

export default Scriptlets;