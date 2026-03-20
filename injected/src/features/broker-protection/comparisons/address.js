import { states } from './constants.js';
import { matchingPair } from '../utils/utils.js';

/**
 * @param {{city: string; state: string | null}[]} userAddresses
 * @param {{city: string; state: string | null}[]} foundAddresses
 * @return {boolean}
 */
export function addressMatch(userAddresses, foundAddresses) {
    return userAddresses.some((user) => {
        return foundAddresses.some((found) => {
            return matchingPair(user.city, found.city) && matchingPair(user.state, found.state);
        });
    });
}

/**
 * @param {string} stateAbbreviation
 * @returns {string | null}
 */
export function getStateFromAbbreviation(stateAbbreviation) {
    if (stateAbbreviation == null || stateAbbreviation.trim() === '') {
        return null;
    }

    const stateKey = stateAbbreviation.toUpperCase();
    if (stateKey in states) {
        return states[/** @type {keyof typeof states} */ (stateKey)];
    }
    return null;
}
