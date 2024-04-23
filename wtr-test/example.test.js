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

describe('ContentFeature wrapper methods', () => {
})

describe('ContentFeature shim methods', () => {
    it.skip('just something', () => {
        const f = new ContentFeature()
        class MyMediaSession {
            metadata = null
            /** @type {MediaSession['playbackState']} */
            playbackState = 'none'

            setActionHandler () {}
            setCameraActive () {}
            setMicrophoneActive () {}
            setPositionState () {}
        }
        console.log(MediaSession, MediaSession.name, MediaSession.toString(), MediaSession.toString.toString())

        f.shimInterface('MediaSession', MyMediaSession, {
            disallowConstructor: true
        })

        console.log(MediaSession, MediaSession.name, MediaSession.toString(), MediaSession.toString.toString())
        assert.strictEqual(MediaSession, MyMediaSession, 'MediaSession does not match the shim')
    })
})
