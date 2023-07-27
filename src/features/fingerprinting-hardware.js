import ContentFeature from '../content-feature'
import { wrapProperty } from '../wrapper-utils'

export default class FingerprintingHardware extends ContentFeature {
    init () {
        wrapProperty(globalThis.Navigator.prototype, 'keyboard', {
            get: () => {
                this.addDebugFlag()
                // @ts-expect-error - error TS2554: Expected 2 arguments, but got 1.
                return this.getFeatureAttr('keyboard')
            }
        })

        wrapProperty(globalThis.Navigator.prototype, 'hardwareConcurrency', {
            get: () => {
                this.addDebugFlag()
                return this.getFeatureAttr('hardwareConcurrency', 2)
            }
        })

        wrapProperty(globalThis.Navigator.prototype, 'deviceMemory', {
            get: () => {
                this.addDebugFlag()
                return this.getFeatureAttr('deviceMemory', 8)
            }
        })
    }
}
