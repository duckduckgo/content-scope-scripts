import { matchHostname, processConfig } from '../src/utils.js'
import polyfillProcessGlobals from './helpers/pollyfil-for-process-globals.js'

polyfillProcessGlobals()

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

    it('processes config in expected manner', () => {
        const processedConfig = processConfig({
            features: {
                testFeature: {
                    state: 'enabled',
                    settings: {
                        beep: 'boop'
                    },
                    exceptions: []
                },
                testFeatureTooBig: {
                    state: 'enabled',
                    minSupportedVersion: 100,
                    settings: {},
                    exceptions: []
                },
                testFeatureSmall: {
                    state: 'enabled',
                    minSupportedVersion: 99,
                    settings: {},
                    exceptions: []
                },
                testFeatureSmaller: {
                    state: 'enabled',
                    minSupportedVersion: 98,
                    settings: {
                        barp: true
                    },
                    exceptions: []
                },
                testFeatureOutlier: {
                    state: 'enabled',
                    minSupportedVersion: 97000,
                    settings: {},
                    exceptions: []
                }
            },
            unprotectedTemporary: []
        },
        [],
        {
            platform: {
                name: 'android'
            },
            versionNumber: 99,
            sessionKey: 'testSessionKey'
        },
        [])
        expect(processedConfig).toEqual({
            site: {
                domain: 'localhost',
                isBroken: false,
                allowlisted: false,
                // testFeatureTooBig is not enabled because it's minSupportedVersion is 100
                enabledFeatures: ['testFeature', 'testFeatureSmall', 'testFeatureSmaller']
            },
            featureSettings: {
                testFeature: {
                    beep: 'boop'
                },
                testFeatureSmall: {},
                testFeatureSmaller: {
                    barp: true
                }
            },
            cookie: {},
            platform: {
                name: 'android',
                version: 99
            },
            versionNumber: 99,
            sessionKey: 'testSessionKey'
        })
    })
})
