import ContentFeature from '../content-feature'
import { defineProperty } from '../utils'

/**
 * Blocks some privacy harmful APIs.
 */
export default class HarmfulApis extends ContentFeature {
    static autoDenyPermissions = [
        'accelerometer',
        'ambient-light-sensor',
        'gyroscope',
        'magnetometer'
    ]

    init (args) {
        console.log('INIT! from harmfulAPIs', args)
        this.initPermissionsFilter()
        this.initSensorBlock()
    }

    initPermissionsFilter () {
        if (!('Permissions' in globalThis) || !('query' in globalThis.Permissions.prototype)) {
            return
        }
        const nativeImpl = globalThis.Permissions.prototype.query
        defineProperty(globalThis.Permissions.prototype, 'query', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: async function (queryObject) {
                // call the original function first in case it throws an error
                const origResult = await nativeImpl.call(this, queryObject)

                if (HarmfulApis.autoDenyPermissions.includes(queryObject.name)) {
                    return {
                        name: queryObject.name,
                        state: 'denied',
                        status: 'denied'
                    }
                }
                return origResult
            }
        })
    }

    initSensorBlock () {
        if (!('Sensor' in globalThis) || !('start' in globalThis.Sensor.prototype)) {
            return
        }

        defineProperty(globalThis.Sensor.prototype, 'start', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: function () {
                // block all sensors
                const ErrorCls = 'SensorErrorEvent' in globalThis ? globalThis.SensorErrorEvent : Error
                const error = new ErrorCls('error', {
                    error: new DOMException('Permissions to access sensor are not granted', 'NotAllowedError')
                })
                // isTrusted will be false, but not much we can do here
                this.dispatchEvent(error)
            }
        })
    }
}
