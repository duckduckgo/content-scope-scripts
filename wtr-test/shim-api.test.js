import { assert } from 'chai'
import ContentFeature from '../src/content-feature'
import { ddgShimMark, wrapToString } from '../src/wrapper-utils'

describe('wrapToString', () => {
    it('should mask toString() method', () => {
        function origFn () { return 1 }
        const fakeFn = () => 2
        const wrapped = wrapToString(fakeFn, origFn)
        assert.strictEqual(wrapped(), 2, 'wrapped function does not return expected value')

        assert.strictEqual(wrapped.toString(), origFn.toString(), '.toString() result does not match the original function')
        assert.strictEqual(Object.prototype.toString.apply(wrapped), Object.prototype.toString.apply(origFn), 'Object.prototype.toString() result does not match the original function')
        assert.strictEqual(`${wrapped}`, `${origFn}`, 'string coercion result does not match the original function')
        assert.strictEqual(wrapped.toString.toString(), origFn.toString.toString(), '.toString.toString() result does not match the original function')
        assert.notStrictEqual(wrapped.toString.toString.toString(), origFn.toString.toString.toString(), '.toString.toString.toString() works unexpectedly')
    })
})

class MyTestFeature extends ContentFeature {
    addDebugFlag () {}
}

describe('ContentFeature wrapper methods', () => {
    const OrigMediaSession = globalThis.MediaSession
    /** @type {import('../src/wrapper-utils').StrictGetDescriptor} */
    // @ts-expect-error we know it's defined in Chrome
    const origMediaSessionInstanceDescriptor = Object.getOwnPropertyDescriptor(Navigator.prototype, 'mediaSession')
    const origMediaSessionInstance = navigator.mediaSession
    /** @type {typeof MediaSession} */
    let MyMediaSession
    /** @type {MyTestFeature} */
    let cf
    /** @type {PropertyDescriptor} */
    // @ts-expect-error we know it's defined in Chrome
    const origInterfaceDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'MediaSession')

    beforeEach(() => {
        assert.strictEqual(globalThis.MediaSession, OrigMediaSession, 'unexpected native class')
        assert.strictEqual(navigator.mediaSession, origMediaSessionInstance, 'unexpected global property')
        MyMediaSession = class {
            metadata = null
            /** @type {MediaSession['playbackState']} */
            playbackState = 'none'

            setActionHandler () {
                return 123
            }

            setCameraActive () {}
            setMicrophoneActive () {}
            setPositionState () {}
        }
        cf = new MyTestFeature()
    })

    afterEach(() => {
        // restore the original interface
        Object.defineProperty(globalThis, 'MediaSession', origInterfaceDescriptor)
        // restore the original navigator.mediaSession
        Object.defineProperty(Navigator.prototype, 'mediaSession', origMediaSessionInstanceDescriptor)
    })

    describe('shimInterface()', () => {
        it('should (re)define the global', () => {
            cf.shimInterface('MediaSession', MyMediaSession)
            const NewMediaSession = globalThis.MediaSession
            const newPropertyDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'MediaSession')

            assert.deepEqual({ ...newPropertyDescriptor, value: null }, { ...origInterfaceDescriptor, value: null }, 'property descriptors do not match')
            assert.notStrictEqual(NewMediaSession, OrigMediaSession, 'class is not overridden')
            assert.strictEqual(NewMediaSession[ddgShimMark], true, 'class should be marked as shimmed')
            assert.strictEqual(MyMediaSession[ddgShimMark], true, 'class should be marked as shimmed')

            assert.instanceOf(new MyMediaSession(), NewMediaSession, 'instances should pass the instanceof check')
            assert.instanceOf(new NewMediaSession(), NewMediaSession, 'instances should pass the instanceof check')
        })

        it('should support disallowConstructor', () => {
            cf.shimInterface('MediaSession', MyMediaSession, {
                disallowConstructor: false
            })
            assert.doesNotThrow(() => new globalThis.MediaSession())

            cf.shimInterface('MediaSession', MyMediaSession, {
                disallowConstructor: true
            })
            assert.throws(() => new globalThis.MediaSession(), TypeError)

            cf.shimInterface('MediaSession', MyMediaSession, {
                disallowConstructor: true,
                constructorErrorMessage: 'friendly message'
            })
            assert.throws(() => new globalThis.MediaSession(), 'friendly message')
        })

        it('should support allowConstructorCall', () => {
            cf.shimInterface('MediaSession', MyMediaSession, {
                allowConstructorCall: true
            })
            // @ts-expect-error real MediaSession is not callable
            assert.doesNotThrow(() => globalThis.MediaSession())
            // @ts-expect-error real MediaSession is not callable
            assert.instanceOf(globalThis.MediaSession(), globalThis.MediaSession, 'instances should pass the instanceof check')

            cf.shimInterface('MediaSession', MyMediaSession, {
                allowConstructorCall: false
            })
            // @ts-expect-error real MediaSession is not callable
            assert.throws(() => globalThis.MediaSession(), TypeError)
        })

        it('should support wrapToString', () => {
            cf.shimInterface('MediaSession', MyMediaSession, {
                wrapToString: false
            })
            assert.notStrictEqual(globalThis.MediaSession.toString(), OrigMediaSession.toString(), 'Shim\'s toString() should not be masked')
            assert.strictEqual(globalThis.MediaSession.toString.toString(), MyMediaSession.toString.toString(), 'Shim\'s toString.toString() should not be masked')
            assert.strictEqual(globalThis.MediaSession.prototype.setActionHandler.toString(), MyMediaSession.prototype.setActionHandler.toString(), 'Shim\'s method\'s .toString() should not be masked')

            cf.shimInterface('MediaSession', MyMediaSession, {
                wrapToString: true
            })

            assert.strictEqual(globalThis.MediaSession.toString(), OrigMediaSession.toString(), 'Shim\'s toString() value does not match the original')
            assert.strictEqual(globalThis.MediaSession.toString.toString(), OrigMediaSession.toString.toString(), 'Shim\'s toString.toString() value does not match the original')
            assert.strictEqual(globalThis.MediaSession.prototype.setActionHandler.toString(), OrigMediaSession.prototype.setActionHandler.toString(), 'Shim\'s method\'s .toString() value does not match the original')
        })
    })

    describe('shimProperty()', () => {
        it('should correctly shim the property', () => {
            cf.shimInterface('MediaSession', MyMediaSession)
            const instance = new MyMediaSession()
            cf.shimProperty(Navigator.prototype, 'mediaSession', instance)

            const NewMediaSession = globalThis.MediaSession
            assert.instanceOf(navigator.mediaSession, NewMediaSession, 'instances should pass the instanceof check')
            // @ts-expect-error mock is intentionally different
            assert.strictEqual(navigator.mediaSession.setActionHandler(), 123, 'method does not return expected value')
            assert.strictEqual(navigator.mediaSession.toString(), origMediaSessionInstance.toString(), 'mocked instance should have the same toString() result')
            assert.strictEqual(navigator.mediaSession.toString.toString(), origMediaSessionInstance.toString.toString(), 'mocked instance should have the same toString.toString() result')
        })

        it('should throw when the class has not been prepared', () => {
            assert.throws(() => cf.shimProperty(Navigator.prototype, 'mediaSession', new MyMediaSession()), TypeError)
        })

        it('should support writable properties', () => {
            cf.shimInterface('MediaSession', MyMediaSession)
            const instance = new MyMediaSession()
            cf.shimProperty(Navigator.prototype, 'mediaSession', instance, false)

            const descriptor = Object.getOwnPropertyDescriptor(Navigator.prototype, 'mediaSession')
            assert.include(descriptor, {
                configurable: true,
                enumerable: true,
                writable: true
            }, 'property should be writable')
        })

        it('should support readonly properties', () => {
            cf.shimInterface('MediaSession', MyMediaSession)
            const instance = new MyMediaSession()
            cf.shimProperty(Navigator.prototype, 'mediaSession', instance, true)

            /** @type {import('../src/wrapper-utils').StrictAccessorDescriptor} */
            // @ts-expect-error we know it's defined
            const descriptor = Object.getOwnPropertyDescriptor(Navigator.prototype, 'mediaSession')
            assert.include(descriptor, {
                configurable: true,
                enumerable: true
            }, 'unexpected property descriptor')
            assert.isDefined(descriptor.get, 'property should have a getter and no setter')
            assert.isUndefined(descriptor.set, 'property should have a getter and no setter')

            const getter = descriptor.get
            assert.strictEqual(getter.toString(), origMediaSessionInstanceDescriptor.get?.toString(), 'getter\'s .toString() should match the original')
        })
    })
})
