import { extractProfiles } from '../actions/extract.js';
import { PirError } from '../types.js';

/**
 * @import { ActionParent, ProfileData } from '../types.js'
 */

/**
 * @param {{parent?: ActionParent}} elementConfig
 * @param {ProfileData} userData
 * @param {Document | HTMLElement} root
 * @return {Document | HTMLElement | PirError}
 */
export function selectRootElement(elementConfig, userData, root = document) {
    if (!elementConfig.parent) return root;

    if (elementConfig.parent.profileMatch) {
        const extraction = extractProfiles(elementConfig.parent.profileMatch, userData, root);
        if ('results' in extraction) {
            const sorted = extraction.results.filter((x) => x.result === true).sort((a, b) => b.score - a.score);
            const first = sorted[0];
            if (first && first.element) {
                return first.element;
            }
        }
    }

    return PirError.create('`parent` was present on the element, but the configuration is not supported');
}
