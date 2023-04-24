import { overrideProperty } from '../utils.js'
import ContentFeature from '../content-feature.js'

export default class FingerprintingHardware extends ContentFeature {
    init () {
        const Navigator = globalThis.Navigator
        const navigator = globalThis.navigator

        overrideProperty('keyboard', {
            object: Navigator.prototype,
            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
            origValue: navigator.keyboard,
            // @ts-expect-error - error TS2554: Expected 2 arguments, but got 1.
            targetValue: this.getFeatureAttr('keyboard')
        })
        overrideProperty('hardwareConcurrency', {
            object: Navigator.prototype,
            origValue: navigator.hardwareConcurrency,
            targetValue: this.getFeatureAttr('hardwareConcurrency', 2)
        })
        overrideProperty('deviceMemory', {
            object: Navigator.prototype,
            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
            origValue: navigator.deviceMemory,
            targetValue: this.getFeatureAttr('deviceMemory', 8)
        })
    }
}
