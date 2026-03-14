import { names } from './constants.js';

/**
 * @param {string} fullNameExtracted
 * @param {string} userFirstName
 * @param {string | null | undefined} userMiddleName
 * @param {string} userLastName
 * @param {string | null} [userSuffix]
 * @return {boolean}
 */
export function isSameName(fullNameExtracted, userFirstName, userMiddleName, userLastName, userSuffix) {
    // If there's no name on the website, then there's no way we can match it
    if (!fullNameExtracted) {
        return false;
    }

    // these fields should never be absent. If they are we cannot continue
    if (!userFirstName || !userLastName) return false;

    fullNameExtracted = fullNameExtracted.toLowerCase().trim().replace('.', '');
    userFirstName = userFirstName.toLowerCase();
    userMiddleName = userMiddleName ? userMiddleName.toLowerCase() : null;
    userLastName = userLastName.toLowerCase();
    userSuffix = userSuffix ? userSuffix.toLowerCase() : null;

    const nameVariants = getNames(userFirstName);

    for (const firstName of nameVariants) {
        const nameCombo1 = `${firstName} ${userLastName}`;
        if (fullNameExtracted === nameCombo1) {
            return true;
        }

        // If the user didn't supply a middle name, then try to match names extracted names that
        // might include a middle name.
        if (!userMiddleName) {
            const combinedLength = firstName.length + userLastName.length;
            const matchesFirstAndLast =
                fullNameExtracted.startsWith(firstName) &&
                fullNameExtracted.endsWith(userLastName) &&
                fullNameExtracted.length > combinedLength;
            if (matchesFirstAndLast) {
                return true;
            }
        }

        if (userSuffix) {
            const nameCombo1WithSuffix = `${firstName} ${userLastName} ${userSuffix}`;
            if (fullNameExtracted === nameCombo1WithSuffix) {
                return true;
            }
        }

        // If the user has a name with a hyphen, we should split it on the hyphen
        // Note: They may have a last name or first name with a hyphen
        if (userLastName.includes('-')) {
            if (matchHyphenatedLastName(fullNameExtracted, firstName, userLastName)) {
                return true;
            }
        }

        if (userFirstName.includes('-')) {
            if (matchHyphenatedFirstName(fullNameExtracted, userFirstName, userLastName)) {
                return true;
            }
        }

        // Only run this if they have a middle name
        // Note: Only do the suffix comparison if it actually exists
        if (userMiddleName) {
            if (matchWithMiddleName(fullNameExtracted, firstName, userFirstName, userMiddleName, userLastName, userSuffix)) {
                return true;
            }
        }
    }

    return false;
}

/**
 * @param {string} str
 * @param {string} separator
 * @returns {[first: string, ...rest: string[]]}
 */
function splitAtLeastOne(str, separator) {
    const parts = str.split(separator);
    const first = parts[0] ?? '';
    return [first, ...parts.slice(1)];
}

/**
 * Match against hyphenated last name variants (space-separated, joined, first part only).
 *
 * @param {string} extracted
 * @param {string} firstName
 * @param {string} lastName
 * @returns {boolean}
 */
function matchHyphenatedLastName(extracted, firstName, lastName) {
    const [firstPart, ...rest] = splitAtLeastOne(lastName, '-');
    const spaced = [firstPart, ...rest].join(' ');
    const joined = [firstPart, ...rest].join('');

    return [`${firstName} ${spaced}`, `${firstName} ${joined}`, `${firstName} ${firstPart}`].includes(extracted);
}

/**
 * Match against hyphenated first name variants (space-separated, joined, first part only).
 *
 * @param {string} extracted
 * @param {string} firstName
 * @param {string} lastName
 * @returns {boolean}
 */
function matchHyphenatedFirstName(extracted, firstName, lastName) {
    const [firstPart, ...rest] = splitAtLeastOne(firstName, '-');
    const spaced = [firstPart, ...rest].join(' ');
    const joined = [firstPart, ...rest].join('');

    return [`${spaced} ${lastName}`, `${joined} ${lastName}`, `${firstPart} ${lastName}`].includes(extracted);
}

/**
 * @param {string} extracted
 * @param {string} firstName
 * @param {string} userFirstName
 * @param {string} middleName
 * @param {string} lastName
 * @param {string | null | undefined} suffix
 * @returns {boolean}
 */
function matchWithMiddleName(extracted, firstName, userFirstName, middleName, lastName, suffix) {
    const middleInitial = middleName[0] ?? '';
    const comparisons = [
        `${firstName} ${middleName} ${lastName}`,
        `${firstName} ${middleName} ${lastName} ${suffix}`,
        `${firstName} ${middleInitial} ${lastName}`,
        `${firstName} ${middleInitial} ${lastName} ${suffix}`,
        `${firstName} ${middleName}${lastName}`,
        `${firstName} ${middleName}${lastName} ${suffix}`,
    ];

    if (comparisons.includes(extracted)) {
        return true;
    }

    if (lastName.includes('-')) {
        const [firstPart, ...rest] = splitAtLeastOne(lastName, '-');
        const spaced = [firstPart, ...rest].join(' ');
        const joined = [firstPart, ...rest].join('');

        const hyphenComparisons = [
            `${firstName} ${middleName} ${spaced}`,
            `${firstName} ${middleName} ${firstPart}`,
            `${firstName} ${middleInitial} ${spaced}`,
            `${firstName} ${middleInitial} ${joined}`,
            `${firstName} ${middleInitial} ${firstPart}`,
        ];

        if (hyphenComparisons.includes(extracted)) {
            return true;
        }
    }

    if (userFirstName.includes('-')) {
        const [firstPart, ...rest] = splitAtLeastOne(userFirstName, '-');
        const spaced = [firstPart, ...rest].join(' ');
        const joined = [firstPart, ...rest].join('');

        const hyphenComparisons = [
            `${spaced} ${middleName} ${lastName}`,
            `${joined} ${middleName} ${lastName}`,
            `${firstPart} ${middleName} ${lastName}`,
            `${spaced} ${middleInitial} ${lastName}`,
            `${joined} ${middleInitial} ${lastName}`,
            `${firstPart} ${middleInitial} ${lastName}`,
        ];

        if (hyphenComparisons.includes(extracted)) {
            return true;
        }
    }

    return false;
}

/**
 * Given the user's provided name, look for nicknames or full names and return a list
 *
 * @param {string | null} name
 * @return {Set<string>}
 */
export function getNames(name) {
    if (!nonEmptyString(name)) {
        return new Set();
    }

    name = name.toLowerCase();
    const nicknames = names.nicknames;

    return new Set([name, ...getNicknames(name, nicknames), ...getFullNames(name, nicknames)]);
}

/**
 * Given a full name, get a list of nicknames, e.g. Gregory -> Greg
 *
 * @param {string | null} name
 * @param {Record<string, string[]>} nicknames
 * @return {Set<string>}
 */
export function getNicknames(name, nicknames) {
    if (!nonEmptyString(name)) {
        return new Set();
    }

    name = name.toLowerCase();

    if (Object.prototype.hasOwnProperty.call(nicknames, name)) {
        const values = nicknames[name];
        if (values) {
            return new Set(values);
        }
    }

    return new Set();
}

/**
 * Given a nickname, get a list of full names - e.g. Greg -> Gregory
 *
 * @param {string | null} name
 * @param {Record<string, string[]>} nicknames
 * @return {Set<string>}
 */
export function getFullNames(name, nicknames) {
    /** @type {Set<string>} */
    const fullNames = new Set();

    if (!nonEmptyString(name)) {
        return fullNames;
    }

    name = name.toLowerCase();

    for (const fullName of Object.keys(nicknames)) {
        const nicknameList = nicknames[fullName];
        if (nicknameList?.includes(name)) {
            fullNames.add(fullName);
        }
    }

    return fullNames;
}

/**
 * @param {unknown} [input]
 * @return {input is string}
 */
function nonEmptyString(input) {
    if (typeof input !== 'string') return false;
    return input.trim().length > 0;
}
