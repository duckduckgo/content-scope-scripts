import { assert } from 'chai'
import ContentFeature from '../src/content-feature'
import { wrapToString } from '../src/wrapper-utils'

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
})

describe('ContentFeature.shimInterface()', () => {
    class MyMediaSession {
        metadata = null
        /** @type {MediaSession['playbackState']} */
        playbackState = 'none'

        setActionHandler () {}
        setCameraActive () {}
        setMicrophoneActive () {}
        setPositionState () {}
    }
    const cf = new MyTestFeature()
    const OrigMediaSession = globalThis.MediaSession
    /** @type {PropertyDescriptor} */
    // @ts-expect-error we know it's defined in Chrome
    const origPropertyDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'MediaSession')

    beforeEach(() => {
        assert.strictEqual(globalThis.MediaSession, OrigMediaSession, 'unexpected native class')
    })

    afterEach(() => {
        // restore the original interface
        Object.defineProperty(globalThis, 'MediaSession', origPropertyDescriptor)
    })

    it('should (re)define the global', () => {
        cf.shimInterface('MediaSession', MyMediaSession)
        const NewMediaSession = globalThis.MediaSession
        const newPropertyDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'MediaSession')
        assert.deepEqual({ ...newPropertyDescriptor, value: null }, { ...origPropertyDescriptor, value: null }, 'property descriptors do not match')
        assert.notStrictEqual(NewMediaSession, OrigMediaSession, 'class is not overridden')
        assert.strictEqual(NewMediaSession.toString(), OrigMediaSession.toString(), 'Shim\'s toString() value does not match the original')
        assert.strictEqual(NewMediaSession.toString.toString(), OrigMediaSession.toString.toString(), 'Shim\'s toString.toString() value does not match the original')
        // assert.strictEqual(NewMediaSession.prototype.setActionHandler.toString(), OrigMediaSession.prototype.setActionHandler.toString(), 'Shim\'s method\'s .toString() value does not match the original')
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

        cf.shimInterface('MediaSession', MyMediaSession, {
            allowConstructorCall: false
        })
        // @ts-expect-error real MediaSession is not callable
        assert.throws(() => globalThis.MediaSession(), TypeError)
    })
})
