import { nicknames } from './constants.js'

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

    // Get a list of the user's name and nicknames / full names
    const names = getNames(userFirstName)

    for (const firstName of names) {
    // Let's check if the name matches right off the bat
        const nameCombo1 = `${firstName} ${userLastName}`
        if (fullNameExtracted === nameCombo1) {
            return true
        }

        // If the user didn't supply a middle name, then try to match names extracted names that
        // might include a middle name.
        if (!userMiddleName) {
            const matchesFirstAndLast = new RegExp(`^${firstName}\\s?.*\\s${userLastName}$`)

            if (matchesFirstAndLast.test(fullNameExtracted)) {
                return true
            }
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
 * Given the user's provided name, look for nicknames or full names and return a list
 *
 * @param {string | null} name
 * @return {Set.<string>|Set<*>}
 */
export function getNames (name) {
    if (name == null || name.trim() === '') { return new Set() }

    name = name.toLowerCase()

    return new Set([name, ...getNicknames(name), ...getFullNames(name)])
}

/**
 * Given a full name, get a list of nicknames, e.g. Gregory -> Greg
 *
 * @param {string | null} name
 * @return {Set.<string>|Set<*>}
 */
export function getNicknames (name) {
    const emptySet = new Set()

    if (name == null || name.trim() === '') { return emptySet }

    name = name.toLowerCase()

    if (nicknames[name]) {
        return new Set(nicknames[name])
    }

    return emptySet
}

/**
 * Given a nickname, get a list of full names - e.g. Greg -> Gregory
 *
 * @param {string | null} name
 * @return {Set.<string>|Set<*>}
 */
export function getFullNames (name) {
    const fullNames = new Set()

    if (name == null || name.trim() === '') { return fullNames }

    name = name.toLowerCase()

    for (const fullName in nicknames) {
        if (nicknames[fullName].includes(name)) {
            fullNames.add(fullName)
        }
    }

    return fullNames
}
