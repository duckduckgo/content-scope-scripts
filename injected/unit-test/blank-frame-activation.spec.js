import { wrapInActivation } from '../scripts/utils/blank-frame-activation.js';

describe('blank-frame activation', () => {
    it('wraps the bundle in a function that only runs outside about: frames', () => {
        const output = wrapInActivation({ name: 'test', main: 'console.log("main");\n' });

        expect(output).toBe(`/*! © DuckDuckGo ContentScopeScripts test https://github.com/duckduckgo/content-scope-scripts/ */
'use strict';
{
    if (window.location.protocol !== 'about:') {
        ddgMain();
    }
    function ddgMain() {
console.log("main");
    }
}
`);
    });
});
