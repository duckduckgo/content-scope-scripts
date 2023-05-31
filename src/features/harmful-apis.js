import ContentFeature from '../content-feature'
import { stripVersion } from '../utils'
import { wrapMethod, wrapProperty } from '../wrapper-utils'

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
        'devicemotion'
    ]

    init (args) {
        console.log('INIT! from harmfulAPIs', args)
        // @ts-expect-error linting is not yet seet up for worker context
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
        wrapMethod(globalThis.Permissions.prototype, 'query', async function (nativeImpl, queryObject) {
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
        })
    }

    initEventFilter () {
        for (const eventName of HarmfulApis.removeEvents) {
            const dom0HandlerName = `on${eventName}`
            if (dom0HandlerName in globalThis) {
                delete globalThis[dom0HandlerName]
            }
        }
        wrapMethod(EventTarget.prototype, 'addEventListener', function (nativeImpl, type, ...restArgs) {
            if (HarmfulApis.removeEvents.includes(type)) {
                return
            }
            return nativeImpl.call(this, type, ...restArgs)
        })
    }

    blockGenericSensorApi () {
        wrapMethod(globalThis.Sensor.prototype, 'start', function () {
            // block all sensors
            const ErrorCls = 'SensorErrorEvent' in globalThis ? globalThis.SensorErrorEvent : Error
            const error = new ErrorCls('error', {
                error: new DOMException('Permissions to access sensor are not granted', 'NotAllowedError')
            })
            // isTrusted will be false, but not much we can do here
            this.dispatchEvent(error)
        })
    }

    filterUAClientHints () {
        wrapMethod(globalThis.NavigatorUAData.prototype, 'getHighEntropyValues', async function (nativeImpl, hints) {
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
        })
    }

    removeNetworkInformationApi () {
        if (!('connection' in this.navigatorPrototype)) {
            return
        }
        delete this.navigatorPrototype.connection
    }

    blockGetInstalledRelatedApps () {
        wrapMethod(this.navigatorPrototype, 'getInstalledRelatedApps', function () {
            return Promise.resolve([])
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
        wrapProperty(Screen.prototype, 'isExtended', { get: () => false })
    }

    blockWebBluetoothApi () {
        //TODO: remove 'availabilitychanged' event // for the Bluetooth API

        wrapMethod(globalThis.Bluetooth.prototype, 'requestDevice', function () {
            return Promise.reject(new DOMException('Bluetooth permission has been blocked.', 'NotFoundError'))
        })

        wrapMethod(globalThis.Bluetooth.prototype, 'getAvailability', () => Promise.resolve(false))
    }

    blockWebUsbApi () {
        // TODO: remove connect
        // TODO: remove disconnect

        wrapMethod(globalThis.USB.prototype, 'requestDevice', function () {
            return Promise.reject(new DOMException('No device selected.', 'NotFoundError'))
        })
    }

    blockWebSerialApi () {
        // TODO: remove connect
        // TODO: remove disconnect
        wrapMethod(globalThis.Serial.prototype, 'requestPort', function () {
            return Promise.reject(new DOMException('No port selected.', 'NotFoundError'))
        })
    }

    blockWebHidApi () {
        // TODO: remove connect
        // TODO: remove disconnect

        // Chrome 113 does not throw errors, and only returns an empty array here
        wrapMethod(globalThis.HID.prototype, 'requestDevice', () => [])
    }

    blockWebMidiApi () {
        wrapMethod(this.navigatorPrototype, 'requestMIDIAccess', function () {
            return Promise.reject(new DOMException('Permission is denied.', 'SecurityError'))
        })
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
        wrapMethod(globalThis.StorageManager.prototype, 'estimate', async function (nativeImpl) {
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
        })
    }
}
