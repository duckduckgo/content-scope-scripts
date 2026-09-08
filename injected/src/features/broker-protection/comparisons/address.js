import { states } from './constants.js';
import { matchingPair } from '../utils/utils.js';

/**
 * @param {{city: string; state: string | null}[]} userAddresses
 * @param {{city: string; state: string | null}[]} foundAddresses
 * @return {boolean}
 */
export function addressMatch(userAddresses, foundAddresses) {
    return userAddresses.some((user) => foundAddresses.some((found) => sameCityState(user, found)));
}

/**
 * @param {{city: string; state: string | null}} a
 * @param {{city: string; state: string | null}} b
 * @return {boolean}
 */
export function sameCityState(a, b) {
    return matchingPair(a.city, b.city) && matchingPair(a.state, b.state);
}

export function getStateFromAbbreviation(stateAbbreviation) {
    if (stateAbbreviation == null || stateAbbreviation.trim() === '') {
        return null;
    }

    const state = stateAbbreviation.toUpperCase();

    return states[state] || null;
}
