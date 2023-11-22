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
    }

    return false
}
