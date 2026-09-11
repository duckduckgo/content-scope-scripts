/**
 * @param {string | number} userAge
 * @param {string | number} ageFound
 * @returns {boolean}
 */
export function isSameAge(userAge, ageFound) {
    // variance allows for +/- 1 on the data broker and +/- 1 based on the only having a birth year
    const ageVariance = 2;
    userAge = parseInt(String(userAge), 10);
    ageFound = parseInt(String(ageFound), 10);

    if (isNaN(ageFound)) {
        return false;
    }

    if (Math.abs(userAge - ageFound) < ageVariance) {
        return true;
    }

    return false;
}
