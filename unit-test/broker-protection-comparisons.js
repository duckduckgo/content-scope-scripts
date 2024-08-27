import { getAgeMatches } from '../src/features/broker-protection/comparisons/age.js';
import { getAddressMatches } from '../src/features/broker-protection/comparisons/addresses.js';

describe('age comparison', () => {
    it('should return an exact match for ages that match', () => {
        const userAge = 30;
        const ageFound = 30;
        const result = getAgeMatches(userAge, ageFound);

        expect(result).toEqual({
            exactMatch: true,
            partialMatch: false
        });
    });

    it('should return an exact match for ages within 1 year', () => {
        const userAge = 29;
        const ageFound = 30;
        const result = getAgeMatches(userAge, ageFound);

        expect(result).toEqual({
            exactMatch: true,
            partialMatch: false
        });
    });

    it('should return a partial match for ages within 5 years', () => {
        const userAge = 25;
        const ageFound = 30;
        const result = getAgeMatches(userAge, ageFound);

        expect(result).toEqual({
            exactMatch: false,
            partialMatch: true
        });
    });

    it('should return no match for ages greater than 5 years apart', () => {
        const userAge = 24;
        const ageFound = 30;
        const result = getAgeMatches(userAge, ageFound);

        expect(result).toEqual({
            exactMatch: false,
            partialMatch: false
        });
    });
});

describe('address comparison', () => {
    it('should return no matches if none of the addresses match', () => {
        const userAddresses = [
            { city: 'New York', state: 'NY' },
            { city: 'Brooklyn', state: 'NY' },
        ];
        const foundAddresses = [
            { city: 'Commack', state: 'NY' },
        ];

        const result = getAddressMatches(userAddresses, foundAddresses);

        expect(result).toEqual({
            exactMatch: false,
            partialMatch: false,
            multipleMatches: 0
        });
    });

    it('should return an exact match when one address matches', () => {
        const userAddresses = [
            { city: 'New York', state: 'NY' },
            { city: 'Brooklyn', state: 'NY' },
        ];
        const foundAddresses = [
            { city: 'New York', state: 'NY' },
            { city: 'Commack', state: 'NY' },
        ];

        const result = getAddressMatches(userAddresses, foundAddresses);

        expect(result).toEqual({
            exactMatch: true,
            partialMatch: false,
            multipleMatches: 0
        });
    });

    it('should return the number of multiple matches if multiple addresses match', () => {
        const userAddresses = [
            { city: 'New York', state: 'NY' },
            { city: 'Brooklyn', state: 'NY' },
        ];
        const foundAddresses = [
            { city: 'New York', state: 'NY' },
            { city: 'Brooklyn', state: 'NY' },
            { city: 'Elwood', state: 'NY' },
        ];

        const result = getAddressMatches(userAddresses, foundAddresses);

        expect(result).toEqual({
            exactMatch: true,
            partialMatch: false,
            multipleMatches: 1
        });
    });
});


describe('name comparison', () => {
   it('should return an exact match for names that match', () => {
   });
});