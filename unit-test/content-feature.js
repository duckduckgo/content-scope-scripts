import ContentFeature from '../src/content-feature.js'

describe('Helpers checks', () => {
    it('Should trigger getFeatureSettingEnabled for the correct domain', () => {
        let didRun = false
        class MyTestFeature extends ContentFeature {
            init () {
                expect(this.getFeatureSetting('test')).toBe('enabled3')
                expect(this.getFeatureSetting('otherTest')).toBe('enabled')
                expect(this.getFeatureSetting('otherOtherTest')).toBe('ding')
                didRun = true
            }
        }
        const me = new MyTestFeature('test')
        me.callInit({
            site: {
                domain: 'beep.example.com'
            },
            featureSettings: {
                test: {
                    test: 'enabled',
                    otherTest: 'disabled',
                    otherOtherTest: 'ding',
                    domains: [
                        {
                            domain: 'example.com',
                            patchSettings: [
                                { op: 'replace', path: '/test', value: 'enabled2' },
                                { op: 'replace', path: '/otherTest', value: 'enabled' }
                            ]
                        },
                        {
                            domain: 'beep.example.com',
                            patchSettings: [
                                { op: 'replace', path: '/test', value: 'enabled3' }
                            ]
                        }
                    ]
                }
            }
        })
        expect(didRun).withContext('Should run').toBeTrue()
    })
})
