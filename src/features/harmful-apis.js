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
        /** @type Navigator | WorkerNavigator */
        this.navigatorPrototype = globalThis.Navigator?.prototype || globalThis.WorkerNavigator?.prototype
        this.initPermissionsFilter()
        this.blockGenericSensorApi()
        this.filterUAClientHints()
        this.removeNetworkInformationApi()
        this.blockGetInstalledRelatedApps()
        this.removeFileSystemAccessApi()
        this.blockWindowPlacementApi()
        this.blockWebBluetoothApi()
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

    blockGenericSensorApi () {
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

    filterUAClientHints () {
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

    removeNetworkInformationApi () {
        if (!('connection' in this.navigatorPrototype)) {
            return
        }
        delete this.navigatorPrototype.connection
    }

    blockGetInstalledRelatedApps () {
        if (!('getInstalledRelatedApps' in this.navigatorPrototype)) {
            return
        }
        defineProperty(this.navigatorPrototype, 'getInstalledRelatedApps', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: function () {
                return Promise.resolve([])
            }
        })
    }

    removeFileSystemAccessApi () {
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

    blockWindowPlacementApi () {
        if ('Screen' in globalThis && 'isExtended' in globalThis.Screen.prototype) {
            defineProperty(globalThis.Screen.prototype, 'isExtended', {
                configurable: true,
                enumerable: true,
                get: () => false
            })
        }
    }

    blockWebBluetoothApi () {
        if (!('Bluetooth' in globalThis)) {
            return
        }
        if ('requestDevice' in globalThis.Bluetooth.prototype) {
            defineProperty(globalThis.Bluetooth.prototype, 'requestDevice', {
                configurable: true,
                enumerable: true,
                writable: true,
                value: function () {
                    return Promise.reject(new DOMException('Bluetooth permission has been blocked.', 'NotFoundError'))
                }
            })
        }
        if ('getAvailability' in globalThis.Bluetooth.prototype) {
            defineProperty(globalThis.Bluetooth.prototype, 'getAvailability', {
                configurable: true,
                enumerable: true,
                writable: true,
                value: () => Promise.resolve(false)
            })
        }
    }
}
