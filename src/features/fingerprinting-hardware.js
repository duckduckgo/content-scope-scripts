import ContentFeature from '../content-feature'
import { wrapProperty } from '../wrapper-utils'

export default class FingerprintingHardware extends ContentFeature {
    init () {
        wrapProperty(globalThis.Navigator.prototype, 'keyboard', {
            // @ts-expect-error - error TS2554: Expected 2 arguments, but got 1.
            get: () => this.getFeatureAttr('keyboard')
        })

        wrapProperty(globalThis.Navigator.prototype, 'hardwareConcurrency', {
            get: () => this.getFeatureAttr('hardwareConcurrency', 2)
        })

        wrapProperty(globalThis.Navigator.prototype, 'deviceMemory', {
            get: () => this.getFeatureAttr('deviceMemory', 8)
        })
    }
}
