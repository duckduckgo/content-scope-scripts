/**
 * @param userAge
 * @param ageFound
 * @return {{exactMatch: boolean, partialMatch: boolean}}
 */
export function getAgeMatches(userAge, ageFound) {
    const result ={
        exactMatch: false,
        partialMatch: false
    };

    const exactAgeVariance = 2;
    const partialAgeVariance = 6;

    userAge = parseInt(userAge);
    ageFound = parseInt(ageFound);

    if (isNaN(ageFound)) {
        return result;
    }

    if (Math.abs(userAge - ageFound) < exactAgeVariance) {
        result.exactMatch = true;
    } else if (Math.abs(userAge - ageFound) < partialAgeVariance) {
        result.partialMatch = true;
    }

    return result;
}