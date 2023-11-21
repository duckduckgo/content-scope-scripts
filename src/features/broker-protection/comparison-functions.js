import parseAddress from 'parse-address'

/**
 * @param userAge
 * @param ageFound
 * @return {boolean}
 */
export function isSameAge (userAge, ageFound) {
    // variance allows for +/- 1 on the data broker and +/- 1 based on the only having a birth year
    const ageVariance = 2
    userAge = parseInt(userAge)
    ageFound = parseInt(ageFound)

    if (isNaN(ageFound)) {
        return false
    }

    if (Math.abs(userAge - ageFound) < ageVariance) {
        return true
    }

    return false
}

/**
 * @param {string} fullNameExtracted
 * @param {string | null} [userFirstName]
 * @param {string | null} [userMiddleName]
 * @param {string | null} [userLastName]
 * @param {string | null} [userSuffix]
 * @return {boolean}
 */
export function isSameName (fullNameExtracted, userFirstName, userMiddleName, userLastName, userSuffix) {
    // If there's no name on the website, then there's no way we can match it
    if (!fullNameExtracted) {
        return false
    }

    fullNameExtracted = fullNameExtracted.toLowerCase().trim().replace('.', '')
    userFirstName = userFirstName ? userFirstName.toLowerCase() : null
    userMiddleName = userMiddleName ? userMiddleName.toLowerCase() : null
    userLastName = userLastName ? userLastName.toLowerCase() : null
    userSuffix = userSuffix ? userSuffix.toLowerCase() : null

    // check their nicknames too
    const nicknames = getNicknames(userFirstName)

    for (const firstName of nicknames) {
        // Let's check if the name matches right off the bat
        const nameCombo1 = `${firstName} ${userLastName}`
        if (fullNameExtracted === nameCombo1) {
            return true
        }

        // If there's a suffix, check that too
        if (userSuffix) {
            const nameCombo1WithSuffix = `${firstName} ${userLastName} ${userSuffix}`
            if (fullNameExtracted === nameCombo1WithSuffix) {
                return true
            }
        }

        // If the user has a name with a hyphen, we should split it on the hyphen
        // Note: They may have a last name or first name with a hyphen
        if (userLastName && userLastName.includes('-')) {
            const userLastNameOption2 = userLastName.split('-').join(' ')
            const userLastNameOption3 = userLastName.split('-').join('')
            const userLastNameOption4 = userLastName.split('-')[0]

            const comparisons = [
                `${firstName} ${userLastNameOption2}`,
                `${firstName} ${userLastNameOption3}`,
                `${firstName} ${userLastNameOption4}`
            ]

            if (comparisons.includes(fullNameExtracted)) {
                return true
            }
        }

        // Treat first name with the same logic as the last name
        if (userFirstName && userFirstName.includes('-')) {
            const userFirstNameOption2 = userFirstName.split('-').join(' ')
            const userFirstNameOption3 = userFirstName.split('-').join('')
            const userFirstNameOption4 = userFirstName.split('-')[0]

            const comparisons = [
                `${userFirstNameOption2} ${userLastName}`,
                `${userFirstNameOption3} ${userLastName}`,
                `${userFirstNameOption4} ${userLastName}`
            ]

            if (comparisons.includes(fullNameExtracted)) {
                return true
            }
        }

        // Only run this if they have a middle name
        // Note: Only do the suffix comparison if it actually exists
        if (userMiddleName) {
            const comparisons = [
                `${firstName} ${userMiddleName} ${userLastName}`,
                `${firstName} ${userMiddleName} ${userLastName} ${userSuffix}`,
                `${firstName} ${userMiddleName[0]} ${userLastName}`,
                `${firstName} ${userMiddleName[0]} ${userLastName} ${userSuffix}`,
                `${firstName} ${userMiddleName}${userLastName}`,
                `${firstName} ${userMiddleName}${userLastName} ${userSuffix}`
            ]

            if (comparisons.includes(fullNameExtracted)) {
                return true
            }

            // If it's a hyphenated last name, we have more to try
            if (userLastName && userLastName.includes('-')) {
                const userLastNameOption2 = userLastName.split('-').join(' ')
                const userLastNameOption3 = userLastName.split('-').join('')
                const userLastNameOption4 = userLastName.split('-')[0]

                const comparisons = [
                    `${firstName} ${userMiddleName} ${userLastNameOption2}`,
                    `${firstName} ${userMiddleName} ${userLastNameOption4}`,
                    `${firstName} ${userMiddleName[0]} ${userLastNameOption2}`,
                    `${firstName} ${userMiddleName[0]} ${userLastNameOption3}`,
                    `${firstName} ${userMiddleName[0]} ${userLastNameOption4}`
                ]

                if (comparisons.includes(fullNameExtracted)) {
                    return true
                }
            }

            // If it's a hyphenated name, we have more to try
            if (userFirstName && userFirstName.includes('-')) {
                const userFirstNameOption2 = userFirstName.split('-').join(' ')
                const userFirstNameOption3 = userFirstName.split('-').join('')
                const userFirstNameOption4 = userFirstName.split('-')[0]

                const comparisons = [
                    `${userFirstNameOption2} ${userMiddleName} ${userLastName}`,
                    `${userFirstNameOption3} ${userMiddleName} ${userLastName}`,
                    `${userFirstNameOption4} ${userMiddleName} ${userLastName}`,
                    `${userFirstNameOption2} ${userMiddleName[0]} ${userLastName}`,
                    `${userFirstNameOption3} ${userMiddleName[0]} ${userLastName}`,
                    `${userFirstNameOption4} ${userMiddleName[0]} ${userLastName}`
                ]

                if (comparisons.includes(fullNameExtracted)) {
                    return true
                }
            }
        }
    }

    return false
}

/**
 * @param userAddresses
 * @param comparisonAddressFull
 * @param missingState
 * @return {boolean}
 */
export function matchAddressFull (userAddresses, comparisonAddressFull, missingState = false) {
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

        if (
            !missingState &&
      comparisonAddressFull.includes(userAddress.city) &&
      comparisonAddressFull.includes(userAddress.state)
        ) {
            return true
        }
    }

    return false
}

/**
 * @param userAddresses
 * @param foundAddresses
 * @return {{cityFound, stateFound}|boolean}
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
                return { cityFound, stateFound }
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

export function capitalize (s) {
    const words = s.split(' ')
    const capitalizedWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1))
    return capitalizedWords.join(' ')
}

export function getNicknames (name) {
    if (name == null || name.trim() === '') { return [] }

    name = name.toLowerCase()

    // This comes from Removaly's list of common nicknames
    const names = {
        abby: ['abby', 'abigail'],
        abigail: ['abigail', 'abby', 'abi'],
        abraham: ['abraham', 'abe'],
        alexander: ['alexander', 'alex'],
        alexandra: ['alexandra', 'alex'],
        alexis: ['alexis', 'lexi'],
        anthony: ['anthony', 'tony'],
        ben: ['ben', 'benjamin'],
        benjamin: ['benjamin', 'ben'],
        bev: ['bev', 'beverly'],
        beverly: ['beverly', 'bev'],
        catherine: ['catherine', 'cathy'],
        cathy: ['cathy', 'catherine'],
        charles: ['charles', 'charlie'],
        charlie: ['charlie', 'charles'],
        chris: ['chris', 'christopher'],
        christopher: ['christopher', 'chris'],
        clinton: ['clinton', 'clint'],
        dan: ['dan', 'daniel', 'danny'],
        daniel: ['daniel', 'dan', 'danny'],
        danny: ['danny', 'dan', 'daniel'],
        dave: ['dave', 'david'],
        david: ['david', 'dave'],
        don: ['don', 'donald'],
        donald: ['donald', 'don'],
        ed: ['ed', 'edward', 'eddie'],
        eddie: ['eddie', 'ed', 'edward'],
        edward: ['edward', 'eddie', 'ed'],
        fred: ['fred', 'frederick', 'freddie'],
        freddie: ['freddie', 'frederick', 'fred'],
        frederick: ['frederick', 'fred', 'freddie'],
        jacob: ['jacob', 'jake'],
        jake: ['jake', 'jacob'],
        james: ['james', 'jim'],
        jeff: ['jeff', 'jeffery'],
        jeffery: ['jeffery', 'jeff'],
        jim: ['jim', 'james'],
        jon: ['jon', 'jonathan'],
        jonathan: ['jonathan', 'jon'],
        josh: ['josh', 'joshua'],
        joshua: ['joshua', 'josh'],
        katherine: ['katherine', 'katie'],
        katheryn: ['katheryn', 'katie'],
        kim: ['kim', 'kimberly'],
        kimberly: ['kimberly', 'kim'],
        lexi: ['lexi', 'alexis'],
        lucas: ['lucas', 'luke'],
        luke: ['luke', 'lucas'],
        matt: ['matt', 'matthew'],
        matthew: ['matthew', 'matt'],
        michael: ['michael', 'mike'],
        mike: ['mike', 'michael'],
        nate: ['nate', 'nathan', 'nathaniel'],
        nathan: ['nathan', 'nathaniel', 'nate'],
        nathaniel: ['nathaniel', 'nathan', 'nate'],
        nicholas: ['nicholas', 'nick'],
        nick: ['nick', 'nicholas'],
        patricia: ['patricia', 'pat'],
        ray: ['ray', 'raymond'],
        raymond: ['raymond', 'ray'],
        richard: ['richard', 'rich', 'rick'],
        rob: ['rob', 'robert', 'bob'],
        robert: ['robert', 'rob', 'bob'],
        rus: ['rus', 'russell'],
        russell: ['russell', 'rus'],
        sam: ['sam', 'samuel', 'sammy'],
        samuel: ['samuel', 'sam', 'sammy'],
        stan: ['stan', 'stanley'],
        stanley: ['stanley', 'stan'],
        sue: ['sue', 'susan'],
        susan: ['susan', 'sue'],
        ted: ['ted', 'teddy'],
        teddy: ['teddy', 'ted'],
        thad: ['thad', 'thaddeus'],
        thaddeus: ['thaddeus', 'thad'],
        thomas: ['thomas', 'tom', 'tommy'],
        tim: ['tim', 'timothy'],
        timothy: ['timothy', 'tim'],
        tom: ['tom', 'thomas', 'tommy'],
        tommy: ['tommy', 'tom', 'thomas'],
        tony: ['tony', 'anthony'],
        will: ['will', 'william'],
        william: ['william', 'will'],
        zach: ['zach', 'zachary'],
        zachary: ['zachary', 'zach']
    }

    return names[name] || [name]
}

export function getStateFromAbbreviation (stateAbbreviation) {
    if (stateAbbreviation == null || stateAbbreviation.trim() === '') { return null }

    const state = stateAbbreviation.toUpperCase()

    const states = {
        AL: 'Alabama',
        AK: 'Alaska',
        AZ: 'Arizona',
        AR: 'Arkansas',
        CA: 'California',
        CO: 'Colorado',
        CT: 'Connecticut',
        DC: 'District of Columbia',
        DE: 'Delaware',
        FL: 'Florida',
        GA: 'Georgia',
        HI: 'Hawaii',
        ID: 'Idaho',
        IL: 'Illinois',
        IN: 'Indiana',
        IA: 'Iowa',
        KS: 'Kansas',
        KY: 'Kentucky',
        LA: 'Louisiana',
        ME: 'Maine',
        MD: 'Maryland',
        MA: 'Massachusetts',
        MI: 'Michigan',
        MN: 'Minnesota',
        MS: 'Mississippi',
        MO: 'Missouri',
        MT: 'Montana',
        NE: 'Nebraska',
        NV: 'Nevada',
        NH: 'New Hampshire',
        NJ: 'New Jersey',
        NM: 'New Mexico',
        NY: 'New York',
        NC: 'North Carolina',
        ND: 'North Dakota',
        OH: 'Ohio',
        OK: 'Oklahoma',
        OR: 'Oregon',
        PA: 'Pennsylvania',
        RI: 'Rhode Island',
        SC: 'South Carolina',
        SD: 'South Dakota',
        TN: 'Tennessee',
        TX: 'Texas',
        UT: 'Utah',
        VT: 'Vermont',
        VA: 'Virginia',
        WA: 'Washington',
        WV: 'West Virginia',
        WI: 'Wisconsin',
        WY: 'Wyoming'
    }

    return states[state] || null
}
