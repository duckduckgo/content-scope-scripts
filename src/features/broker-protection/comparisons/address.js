import { states } from './constants.js'
import { matchingPair } from '../utils.js'

/**
 * @param {{city: string; state: string | null}[]} userAddresses
 * @param {{city: string; state: string | null}[]} foundAddresses
 * @param {boolean} exact - if 'true', must match city + state
 * @return {boolean}
 */
export function addressMatch (userAddresses, foundAddresses, exact = true) {
    return userAddresses.some((user) => {
        return foundAddresses.some(found => {
            if (exact) {
                return matchingPair(user.city, found.city) && matchingPair(user.state, found.state)
            }
            return matchingPair(user.state, found.state)
        })
    })
}

export function getStateFromAbbreviation (stateAbbreviation) {
    if (stateAbbreviation == null || stateAbbreviation.trim() === '') { return null }

    const state = stateAbbreviation.toUpperCase()

    return states[state] || null
}
