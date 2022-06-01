import { matchHostname } from '../src/utils.js'

describe('Helpers checks', () => {
    describe('matchHostname', () => {
        it('Expect results on matchHostnames', () => {
            expect(matchHostname('b.domain.com', 'domain.com')).toBeTrue()
            expect(matchHostname('domain.com', 'b.domain.com')).toBeFalse()
            expect(matchHostname('domain.com', 'domain.com')).toBeTrue()
            expect(matchHostname('a.b.c.e.f.domain.com', 'domain.com')).toBeTrue()
            expect(matchHostname('otherdomain.com', 'domain.com')).toBeFalse()
            expect(matchHostname('domain.com', 'otherdomain.com')).toBeFalse()
        })
    })
})
