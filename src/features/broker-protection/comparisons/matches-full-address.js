import parseAddress from 'parse-address'

/**
 * @param userAddresses
 * @param comparisonAddressFull
 * @param missingState
 * @return {boolean}
 */
export function matchesFullAddress (userAddresses, comparisonAddressFull, missingState = false) {
    if (!comparisonAddressFull) {
        return false
    }

    comparisonAddressFull = comparisonAddressFull.replace(/\n/g, ', ')

    for (const userAddress of userAddresses) {
        let address = userAddress.addressLine1
        if (userAddress.city) {
            address += `, ${userAddress.city}`
        }

        if (userAddress.state) {
            address += `, ${userAddress.state}`
        }

        if (userAddress.zip) {
            address += ` ${userAddress.zip}`
        }

        const userFullAddress = address?.toLowerCase().trim()
        const userParsedAddress = parseAddress.parseLocation(userFullAddress)

        comparisonAddressFull = comparisonAddressFull.toLowerCase().trim()
        const comparisonParsedAddress = parseAddress.parseLocation(comparisonAddressFull)

        const comparisons = [
            userParsedAddress.number === comparisonParsedAddress.number,
            userParsedAddress.street === comparisonParsedAddress.street,
            userParsedAddress.type === comparisonParsedAddress.type,
            userParsedAddress.city === comparisonParsedAddress.city,
            userParsedAddress.state === comparisonParsedAddress.state
        ]

        if (comparisons.every(Boolean)) {
            return true
        }

        if (!missingState &&
          comparisonAddressFull.includes(userAddress.city) &&
          comparisonAddressFull.includes(userAddress.state)
        ) {
            return true
        }

        // if the user did not enter `addressLine1` AND `zip`, then perform a looser comparison
        // against just the `city` and `state` of the parsed address.
        // NOTE: this is technically similar to the comparison above, but we're avoiding
        // changing too much until we have a larger test suite.
        if (!userAddress.addressLine1 && !userAddress.zip) {
            const looseComparisons = [
                userParsedAddress.city === comparisonParsedAddress.city,
                userParsedAddress.state === comparisonParsedAddress.state
            ]

            if (looseComparisons.every(Boolean)) {
                return true
            }
        }
    }

    return false
}
