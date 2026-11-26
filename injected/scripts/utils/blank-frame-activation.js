const prefixMessage = '/*! © DuckDuckGo ContentScopeScripts $NAME$ https://github.com/duckduckgo/content-scope-scripts/ */';

/**
 * Wraps a bundle in a function that only runs in frames whose URL protocol isn't `about:`. Until it runs, the bundle
 * allocates nothing, and native's placeholders inside it are never evaluated.
 * @param {object} params
 * @param {string} params.name
 * @param {string} params.main - the bundle, built with `format: 'esm'`
 * @return {string}
 */
export function wrapInActivation({ name, main }) {
    // the bundle is not indented: that would change multi-line template literals
    return `${prefixMessage.replace('$NAME$', name)}
'use strict';
{
    if (window.location.protocol !== 'about:') {
        ddgMain();
    }
    function ddgMain() {
${main.trimEnd()}
    }
}
`;
}
