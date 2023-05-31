import ContentFeature from '../content-feature'
import { defineProperty, stripVersion } from '../utils'

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
        this.initUAClientHintsBlock()
        this.removeNetworkInformation()
        this.blockGetInstalledRelatedApps()
        this.removeFileSystemAccess()
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

    initUAClientHintsBlock () {
        if (!('NavigatorUAData' in globalThis)) {
            return
        }

        const nativeImpl = globalThis.NavigatorUAData.prototype.getHighEntropyValues
        defineProperty(globalThis.NavigatorUAData.prototype, 'getHighEntropyValues', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: async function (hints) {
                const nativeResult = await nativeImpl.call(this, hints) // this may throw an error, and that is fine
                const filteredResult = {}
                for (const [key, value] of Object.entries(nativeResult)) {
                    let result = value

                    switch (key) {
                    case 'brands':
                        result = value.map((brand) => {
                            return {
                                brand: brand.brand,
                                version: stripVersion(brand.version)
                            }
                        })
                        break
                    case 'model':
                        result = ''
                        break
                    case 'platformVersion':
                        result = stripVersion(value, 2)
                        break
                    case 'uaFullVersion':
                        result = stripVersion(value)
                        break
                    case 'fullVersionList':
                        result = value.map((brand) => {
                            return {
                                brand: brand.brand,
                                version: stripVersion(brand.version)
                            }
                        })
                        break
                    case 'architecture':
                    case 'bitness':
                    case 'platform':
                    case 'mobile':
                    default:
                    }

                    filteredResult[key] = result
                }
                return filteredResult
            }
        })
    }

    removeNetworkInformation () {
        if (!('connection' in Navigator.prototype)) {
            return
        }
        delete Navigator.prototype.connection
    }

    blockGetInstalledRelatedApps () {
        if (!('getInstalledRelatedApps' in Navigator.prototype)) {
            return
        }
        defineProperty(Navigator.prototype, 'getInstalledRelatedApps', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: function () {
                return Promise.resolve([])
            }
        })
    }

    removeFileSystemAccess () {
        if ('showOpenFilePicker' in globalThis) {
            delete globalThis.showOpenFilePicker
        }
        if ('showSaveFilePicker' in globalThis) {
            delete globalThis.showSaveFilePicker
        }
        if ('showDirectoryPicker' in globalThis) {
            delete globalThis.showDirectoryPicker
        }
        if ('DataTransferItem' in globalThis && 'getAsFileSystemHandle' in globalThis.DataTransferItem.prototype) {
            delete globalThis.DataTransferItem.prototype.getAsFileSystemHandle
        }
    }
}
