import { states } from './constants.js'

/**
 * @param userAddresses
 * @param foundAddresses
 * @return {boolean}
 */
export function matchAddressFromAddressListCityState (userAddresses, foundAddresses) {
    if (!userAddresses || userAddresses.length < 1 || !foundAddresses || foundAddresses.length < 1) {
        return false
    }

    let cityFound, stateFound

    for (const userAddress of userAddresses) {
        const userCity = userAddress.city
        const userState = userAddress.state

        // for some reason when there is one line of addresses split by commas, it messes this up
        // i.e. Chicago IL, Something Else IL, Asdf...
        for (const possibleLocation of foundAddresses) {
            cityFound = possibleLocation.city
            stateFound = possibleLocation.state

            if (isSameAddressCityState(userCity, userState, cityFound, stateFound)) {
                return true
            }
        }
    }

    return false
}

/**
 * @param addressList
 * @param cityStateFound
 * @return {boolean}
 */
export function matchAddressCityState (addressList, cityStateFound) {
    if (!cityStateFound) { return false }

    const cityFound = cityStateFound.split(',')[0]
    const stateFound = cityStateFound.split(',')[1]

    for (const userAddress of addressList) {
        if (isSameAddressCityState(userAddress.city, userAddress.state, cityFound, stateFound)) {
            return true
        }
    }

    return false
}

/**
 * @param city
 * @param state
 * @param comparisonCity
 * @param comparisonState
 * @return {boolean}
 */
export function isSameAddressCityState (city, state, comparisonCity, comparisonState) {
    if (!city || !state || !comparisonCity || !comparisonState) { return false }

    city = city.toLowerCase()?.trim()
    comparisonCity = comparisonCity.toLowerCase()?.trim()
    state = state.toLowerCase()?.trim()
    comparisonState = comparisonState.toLowerCase()?.trim()

    if ((city === comparisonCity) && (state === comparisonState)) { return true }

    return false
}

export function getStateFromAbbreviation (stateAbbreviation) {
    if (stateAbbreviation == null || stateAbbreviation.trim() === '') { return null }

    const state = stateAbbreviation.toUpperCase()

    return states[state] || null
}
