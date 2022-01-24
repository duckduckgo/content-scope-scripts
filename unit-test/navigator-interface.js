import { init } from '../src/features/navigator-interface.js'

describe('navigator interface', () => {
    it('should add when platform present in config', () => {
        init({ platform: { name: 'ios' } })
        expect(globalThis.navigator.duckduckgo?.platform).toBe('ios')
    })
    it('should not add when platform.name is absent', () => {
        init({ platform: {} })
        expect(globalThis.navigator.duckduckgo).toBeUndefined()
    })
})
