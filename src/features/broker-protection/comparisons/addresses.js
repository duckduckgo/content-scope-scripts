import { states } from './constants.js'
import { matchingPair } from '../utils.js'

/**
 * @param {{city: string; state: string | null}[]} userAddresses
 * @param {{city: string; state: string | null}[]} foundAddresses
 * @return {{exactMatch: boolean, partialMatch: boolean, multipleMatches: number}}
 */

export function getAddressMatches(userAddresses, foundAddresses) {
    const result ={
        exactMatch: false,
        partialMatch: false,
        multipleMatches: 0,
    };

    userAddresses.forEach((user) => {
        foundAddresses.forEach((found) => {
            if (matchingPair(user.city, found.city) && matchingPair(user.state, found.state)) {
                if (result.exactMatch) {
                    result.multipleMatches++;
                } else {
                    result.exactMatch = true;
                }
            }
        });
    });

    return result;
}

export function getStateFromAbbreviation (stateAbbreviation) {
    if (stateAbbreviation == null || stateAbbreviation.trim() === '') { return null }

    const state = stateAbbreviation.toUpperCase()

    return states[state] || null
}