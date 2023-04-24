import ContentFeature from '../content-feature.js'
import { defineProperty } from '../utils.js'

/**
 * Overwrites the Battery API if present in the browser.
 * It will return the values defined in the getBattery function to the client,
 * as well as prevent any script from listening to events.
 */
export default class FingerprintingBattery extends ContentFeature {
    init () {
        // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
        if (globalThis.navigator.getBattery) {
            const BatteryManager = globalThis.BatteryManager

            const spoofedValues = {
                charging: true,
                chargingTime: 0,
                dischargingTime: Infinity,
                level: 1
            }
            const eventProperties = ['onchargingchange', 'onchargingtimechange', 'ondischargingtimechange', 'onlevelchange']

            for (const [prop, val] of Object.entries(spoofedValues)) {
                try {
                    defineProperty(BatteryManager.prototype, prop, { get: () => val })
                } catch (e) { }
            }
            for (const eventProp of eventProperties) {
                try {
                    defineProperty(BatteryManager.prototype, eventProp, { get: () => null })
                } catch (e) { }
            }
        }
    }
}
