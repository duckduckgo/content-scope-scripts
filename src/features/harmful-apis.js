import ContentFeature from '../content-feature'
import { defineProperty, stripVersion } from '../utils'

/**
 * Blocks some privacy harmful APIs.
 */
export default class HarmfulApis extends ContentFeature {
    /* the set of available permissions is quickly changing over time. Up-to-date lists can be found here:
       - Chromium: https://chromium.googlesource.com/chromium/src/+/refs/heads/main/third_party/blink/renderer/modules/permissions/permission_descriptor.idl
       - Gecko: https://searchfox.org/mozilla-central/source/dom/webidl/Permissions.webidl#10
       - WebKit: https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/permissions/PermissionName.idl
    */
    static autoDenyPermissions = [
        'accelerometer',
        'ambient-light-sensor',
        'gyroscope',
        'magnetometer',
        'bluetooth',
        'midi',
        'idle-detection',
        'window-placement',
        'window-management'
    ]

    static removeEvents = [
        'deviceorientation',
        'devicemotion',
        'availabilitychanged' // for the Bluetooth API
    ]

    init (args) {
        console.log('INIT! from harmfulAPIs', args)
        /** @type Navigator | WorkerNavigator */
        this.navigatorPrototype = globalThis.Navigator?.prototype || globalThis.WorkerNavigator?.prototype
        this.initPermissionsFilter()
        this.initEventFilter()

        this.blockGenericSensorApi()
        this.filterUAClientHints()
        this.removeNetworkInformationApi()
        this.blockGetInstalledRelatedApps()
        this.removeFileSystemAccessApi()
        this.blockWindowPlacementApi()
        this.blockWebBluetoothApi()
        this.blockWebUsbApi()
        this.blockWebSerialApi()
        this.blockWebHidApi()
        this.blockWebMidiApi()
        this.removeIdleDetectionApi()
        this.removeWebNfcApi()
        this.filterStorageApi()
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

    initEventFilter () {
        for (const eventName of HarmfulApis.removeEvents) {
            const dom0HandlerName = `on${eventName}`
            if (dom0HandlerName in globalThis) {
                delete globalThis[dom0HandlerName]
            }
        }
        const nativeImpl = EventTarget.prototype.addEventListener
        defineProperty(EventTarget.prototype, 'addEventListener', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: function (type, ...restArgs) {
                if (HarmfulApis.removeEvents.includes(type)) {
                    return
                }
                return nativeImpl.call(this, type, ...restArgs)
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

    blockWebUsbApi () {
        if (!('USB' in globalThis)) {
            return
        }
        if ('requestDevice' in globalThis.USB.prototype) {
            defineProperty(globalThis.USB.prototype, 'requestDevice', {
                configurable: true,
                enumerable: true,
                writable: true,
                value: function () {
                    return Promise.reject(new DOMException('No device selected.', 'NotFoundError'))
                }
            })
        }
    }

    blockWebSerialApi () {
        if (!('Serial' in globalThis)) {
            return
        }
        if ('requestPort' in globalThis.Serial.prototype) {
            defineProperty(globalThis.Serial.prototype, 'requestPort', {
                configurable: true,
                enumerable: true,
                writable: true,
                value: function () {
                    return Promise.reject(new DOMException('No port selected.', 'NotFoundError'))
                }
            })
        }
    }

    blockWebHidApi () {
        if (!('HID' in globalThis)) {
            return
        }
        if ('requestDevice' in globalThis.HID.prototype) {
            defineProperty(globalThis.HID.prototype, 'requestDevice', {
                configurable: true,
                enumerable: true,
                writable: true,
                // Chrome 113 does not throw errors, and only returns an empty array here
                value: function () {
                    return []
                }
            })
        }
    }

    blockWebMidiApi () {
        if ('requestMIDIAccess' in this.navigatorPrototype) {
            defineProperty(this.navigatorPrototype, 'requestMIDIAccess', {
                configurable: true,
                enumerable: true,
                writable: true,
                value: function () {
                    return Promise.reject(new DOMException('Permission is denied.', 'SecurityError'))
                }
            })
        }
    }

    removeIdleDetectionApi () {
        if ('IdleDetector' in globalThis) {
            delete globalThis.IdleDetector
        }
    }

    removeWebNfcApi () {
        if ('NDEFReader' in globalThis) {
            delete globalThis.NDEFReader
        }
        if ('NDEFMessage' in globalThis) {
            delete globalThis.NDEFMessage
        }
        if ('NDEFRecord' in globalThis) {
            delete globalThis.NDEFRecord
        }
    }

    filterStorageApi () {
        if (!('StorageManager' in globalThis)) {
            return
        }
        const nativeImpl = globalThis.StorageManager.prototype.estimate
        defineProperty(globalThis.StorageManager.prototype, 'estimate', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: async function () {
                const result = await nativeImpl.call(this)
                const oneGb = 1_073_741_824
                const fourGb = 4_294_967_296
                const tenGb = 10_737_418_240
                result.quota = result.quota >= tenGb
                    ? tenGb
                    : result.quota >= fourGb
                        ? fourGb
                        : result.quota > 0
                            ? oneGb
                            : 0
                return result
            }
        })
    }
}
