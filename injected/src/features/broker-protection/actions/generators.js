import { generateRandomInt } from '../utils/utils.js';

export function generatePhoneNumber() {
    /**
     * 3 digits, 2-8, last two digits technically can't end in two 1s, but we'll ignore that requirement
     * Source: https://math.stackexchange.com/questions/920972/how-many-different-phone-numbers-are-possible-within-an-area-code/1115411#1115411
     */
    const areaCode = generateRandomInt(200, 899).toString();

    // 555-0100 through 555-0199 are for fictional use (https://en.wikipedia.org/wiki/555_(telephone_number)#Fictional_usage)
    const exchangeCode = '555';
    const lineNumber = generateRandomInt(100, 199).toString().padStart(4, '0');

    return `${areaCode}${exchangeCode}${lineNumber}`;
}

export function generateZipCode() {
    const zipCode = generateRandomInt(10000, 99999).toString();
    return zipCode;
}

/**
 * A random date of birth for someone who is `age` years old, in the `YYYY-MM-DD` format.
 *
 * @param {number} age
 * @param {Date} [today]
 * @return {string}
 */
export function generateDateOfBirth(age, today = new Date()) {
    const dob = new Date(today.getFullYear() - age, today.getMonth(), today.getDate());
    // If `today` is a leap day (Feb 29) then `dob` at this point is March 1. Go back to last day of prev month (Feb 28).
    if (dob.getMonth() !== today.getMonth()) dob.setDate(0);
    dob.setDate(dob.getDate() - generateRandomInt(0, 364));

    const month = (dob.getMonth() + 1).toString().padStart(2, '0');
    const day = dob.getDate().toString().padStart(2, '0');
    return `${dob.getFullYear()}-${month}-${day}`;
}

const DEFAULT_DATE_OF_BIRTH_FORMAT = 'YYYY-MM-DD';

/**
 * @type {Record<string, Intl.DateTimeFormatOptions>}
 */
const DATE_OF_BIRTH_TOKENS = {
    YYYY: { year: 'numeric' },
    YY: { year: '2-digit' },
    MMMM: { month: 'long' },
    MMM: { month: 'short' },
    MM: { month: '2-digit' },
    M: { month: 'numeric' },
    DD: { day: '2-digit' },
    D: { day: 'numeric' },
};

const DATE_OF_BIRTH_TOKEN = new RegExp(
    Object.keys(DATE_OF_BIRTH_TOKENS)
        // Longest token first, so `YYYY` isn't read as two `YY` and `MMMM` isn't read as `MMM` then `M`.
        .sort((a, b) => b.length - a.length)
        .join('|'),
    'g',
);

/**
 * Rewrite a `YYYY-MM-DD` date of birth into `format`, so forms that split it across separate
 * year/month/day fields can be filled a part at a time. Anything in `format` that isn't a token is
 * kept as a literal, which is how separators like `MM/DD/YYYY` work.
 *
 * @param {string} dateOfBirth - as returned by {@link generateDateOfBirth}
 * @param {string} [format] - e.g. `YYYY`, `MMMM`, `MM/DD/YYYY`. Defaults to what a date input expects.
 * @return {string}
 */
export function formatDateOfBirth(dateOfBirth, format = DEFAULT_DATE_OF_BIRTH_FORMAT) {
    const [year, month, day] = dateOfBirth.split('-');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return format.replace(DATE_OF_BIRTH_TOKEN, (token) => new Intl.DateTimeFormat('en-US', DATE_OF_BIRTH_TOKENS[token]).format(date));
}

export function generateStreetAddress() {
    const streetDigits = generateRandomInt(1, 5);
    const streetNumber = generateRandomInt(2, streetDigits * 1000);
    const streetNames = [
        'Main',
        'Elm',
        'Maple',
        'Oak',
        'Pine',
        'Cedar',
        'Hill',
        'Lake',
        'Sunset',
        'Washington',
        'Lincoln',
        'Marshall',
        'Spring',
        'Ridge',
        'Valley',
        'Meadow',
        'Forest',
    ];
    const streetName = streetNames[generateRandomInt(0, streetNames.length - 1)];
    const suffixes = ['', 'St', 'Ave', 'Blvd', 'Rd', 'Ct', 'Dr', 'Ln', 'Pkwy', 'Pl', 'Ter', 'Way'];
    const suffix = suffixes[generateRandomInt(0, suffixes.length - 1)];

    return `${streetNumber} ${streetName}${suffix ? ' ' + suffix : ''}`;
}
