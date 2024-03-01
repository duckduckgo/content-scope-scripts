import { matchesFullAddress } from './matches-full-address.js'

/**
 * @param {object} userAddresses
 * @param {string[]} comparisonAddressFullList
 * @return {boolean}
 */
export function matchesFullAddressList (userAddresses, comparisonAddressFullList) {
    for (const address of comparisonAddressFullList) {
        if (matchesFullAddress(userAddresses, address)) {
            return true
        }
    }
    return false
}
