import ContentFeature from '../src/content-feature.js'

describe('ContentFeature class', () => {
    it('Should trigger getFeatureSettingEnabled for the correct domain', () => {
        let didRun = false
        class MyTestFeature extends ContentFeature {
            init () {
                expect(this.getFeatureSetting('test')).toBe('enabled3')
                expect(this.getFeatureSetting('otherTest')).toBe('enabled')
                expect(this.getFeatureSetting('otherOtherTest')).toBe('ding')
                expect(this.getFeatureSetting('arrayTest')).toBe('enabledArray')
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
                    arrayTest: 'enabled',
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
                        },
                        {
                            domain: ['meep.com', 'example.com'],
                            patchSettings: [
                                { op: 'replace', path: '/arrayTest', value: 'enabledArray' }
                            ]
                        }
                    ]
                }
            }
        })
        expect(didRun).withContext('Should run').toBeTrue()
    })

    describe('addDebugFlag', () => {
        class MyTestFeature extends ContentFeature {
            // eslint-disable-next-line
            // @ts-ignore partial mock
            messaging = {
                 
                notify (name, data) {}
            }
        }
        let feature
        beforeEach(() => {
            feature = new MyTestFeature('someFeatureName')
        })

        it('should not send duplicate flags', () => {
            // send some flag
            feature.addDebugFlag('someflag')
            // send it again
            const spyNotify = spyOn(feature.messaging, 'notify')
            feature.addDebugFlag('someflag')
            expect(spyNotify).not.toHaveBeenCalled()
        })

        it('should send an empty suffix by default', () => {
            const spyNotify = spyOn(feature.messaging, 'notify')
            feature.addDebugFlag()
            expect(spyNotify).toHaveBeenCalledWith(
                'addDebugFlag',
                {
                    flag: 'someFeatureName'
                }
            )
        })
    })

    describe('defineProperty', () => {
        class MyTestFeature extends ContentFeature {
            addDebugFlag () {
                this.debugFlagAdded = true
            }
        }
        let feature
        beforeEach(() => {
            feature = new MyTestFeature('someFeatureName')
        })

        it('should add debug flag to value descriptors', () => {
            const object = {}
            feature.defineProperty(object, 'someProp', {
                value: () => 'someValue',
                writable: true,
                enumerable: true,
                configurable: true
            })
            expect(feature.debugFlagAdded).toBeUndefined()
            expect(object.someProp()).toBe('someValue')
            const newDesc = Object.getOwnPropertyDescriptor(object, 'someProp')
            expect(newDesc).toBeDefined()
            // @ts-expect-error - this must be defined
            newDesc.value = null
            expect(newDesc).toEqual({
                value: null,
                writable: true,
                enumerable: true,
                configurable: true
            })
            expect(feature.debugFlagAdded).toBeTrue()
        })

        it('should add debug flag to get descriptors', () => {
            const object = {}
            feature.defineProperty(object, 'someProp', {
                get: () => 'someValue',
                enumerable: true,
                configurable: true
            })
            expect(feature.debugFlagAdded).toBeUndefined()
            expect(object.someProp).toBe('someValue')
            const newDesc = Object.getOwnPropertyDescriptor(object, 'someProp')
            expect(newDesc).toBeDefined()
            // @ts-expect-error - this must be defined
            newDesc.get = null
            expect(newDesc).toEqual({
                // @ts-expect-error get is overridden
                get: null,
                set: undefined,
                enumerable: true,
                configurable: true
            })
            expect(feature.debugFlagAdded).toBeTrue()
        })

        it('should add debug flag to set descriptors', () => {
            const object = {}
            feature.defineProperty(object, 'someProp', {
                set: () => {},
                enumerable: true,
                configurable: true
            })
            expect(feature.debugFlagAdded).toBeUndefined()
            expect(object.someProp = 'someValue').toBe('someValue')
            const newDesc = Object.getOwnPropertyDescriptor(object, 'someProp')
            expect(newDesc).toBeDefined()
            // @ts-expect-error - this must be defined
            newDesc.set = null
            expect(newDesc).toEqual({
                get: undefined,
                // @ts-expect-error set is overridden
                set: null,
                enumerable: true,
                configurable: true
            })
            expect(feature.debugFlagAdded).toBeTrue()
        })

        it('should not change toString()', () => {
            const object = {}
            const fn = () => 'someValue'
            feature.defineProperty(object, 'someProp', {
                value: fn,
                writable: true,
                enumerable: true,
                configurable: true
            })
            expect(object.someProp()).toBe('someValue')
            expect(object.someProp.toString()).toBe(fn.toString())
            expect(Object.prototype.toString.apply(object.someProp)).toBe(Object.prototype.toString.apply(fn))
            expect(`${object.someProp}`).toBe(`${fn}`)
            expect(object.someProp.toString.toString()).toBe(fn.toString.toString())
            // we don't expect it to wrap toString() more than 2 levels deep
            expect(object.someProp.toString.toString.toString()).not.toBe(fn.toString.toString.toString())
        })
    })
})
