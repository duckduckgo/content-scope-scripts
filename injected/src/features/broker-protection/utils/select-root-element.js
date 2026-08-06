import { extractProfiles } from '../actions/extract.js';
import { PirError } from '../types.js';

/**
 * Resolves the root element that an action's selectors should be scoped to.
 *
 * Some brokers render repeated per-record controls — e.g. one opt-out button or one captcha
 * per search result. A `parent.profileMatch` config scopes the action to the record container
 * that best matches the user's profile, so the action only touches the matching record.
 *
 * @param {{parent?: {profileMatch?: Record<string, any>}}} elementConfig
 * @param {Record<string, any>} userData
 * @param {Document | HTMLElement} root
 * @return {Document | HTMLElement | PirError}
 */
export function selectRootElement(elementConfig, userData, root = document) {
    // if there's no 'parent' field, just use the given root
    if (!elementConfig.parent) return root;

    // if the 'parent' field contains 'profileMatch', try to match it
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
