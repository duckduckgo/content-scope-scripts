import { states } from './constants.js';
import { matchingPair } from '../utils/utils.js';

/**
 * Matching is city + state only; any `street`/`zip` on an {@link import('../extractors/address.js').Address}
 * is ignored here (extract-and-forward, not a match key).
 *
 * @param {import('../extractors/address.js').Address[]} userAddresses
 * @param {import('../extractors/address.js').Address[]} foundAddresses
 * @return {boolean}
 */
export function addressMatch(userAddresses, foundAddresses) {
    return userAddresses.some((user) => {
        return foundAddresses.some((found) => {
            return matchingPair(user.city, found.city) && matchingPair(user.state, found.state);
        });
    });
}

export function getStateFromAbbreviation(stateAbbreviation) {
    if (stateAbbreviation == null || stateAbbreviation.trim() === '') {
        return null;
    }

    const state = stateAbbreviation.toUpperCase();

    return states[state] || null;
}
