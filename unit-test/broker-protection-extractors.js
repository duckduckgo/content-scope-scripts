import fc from 'fast-check'
import { cleanArray } from '../src/features/broker-protection/utils.js'
import { PhoneExtractor } from '../src/features/broker-protection/extractors/phone.js'

describe('individual extractors', () => {
    describe('PhoneExtractor', () => {
        it('should extract digits only', () => {
            fc.assert(fc.property(fc.array(fc.string()), (s) => {
                const cleanInput = cleanArray(s)
                const numbers = new PhoneExtractor().extract(cleanInput, {})
                const cleanOutput = cleanArray(numbers)
                return cleanOutput.every(num => num.match(/^\d+$/))
            }))
        })
    })
})
