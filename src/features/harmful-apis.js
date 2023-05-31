import ContentFeature from '../content-feature'
import { stripVersion } from '../utils'
import { hasMozProxies, wrapMethod, wrapProperty } from '../wrapper-utils'

/**
 * block some Permission API queries. The set of available permissions is quickly changing over time. Up-to-date lists can be found here:
 * - Chromium: https://chromium.googlesource.com/chromium/src/+/refs/heads/main/third_party/blink/renderer/modules/permissions/permission_descriptor.idl
 * - Gecko: https://searchfox.org/mozilla-central/source/dom/webidl/Permissions.webidl#10
 * - WebKit: https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/permissions/PermissionName.idl
 * @param {string[]} permissions permission names to auto-deny
 */
function filterPermissionQuery (permissions) {
    if (!permissions || permissions.length === 0) {
        return
    }
    wrapMethod(globalThis.Permissions.prototype, 'query', async function (nativeImpl, queryObject) {
        // call the original function first in case it throws an error
        const origResult = await nativeImpl.call(this, queryObject)

        if (permissions.includes(queryObject.name)) {
            return {
                name: queryObject.name,
                state: 'denied',
                status: 'denied'
            }
        }
        return origResult
    })
}

/**
 * Blocks some privacy harmful APIs.
 */
export default class HarmfulApis extends ContentFeature {
    init (args) {
        console.log('INIT! from harmfulAPIs', args)
        // @ts-expect-error linting is not yet seet up for worker context
        /** @type Navigator | WorkerNavigator */
        this.navigatorPrototype = globalThis.Navigator?.prototype || globalThis.WorkerNavigator?.prototype

        this.removeDeviceOrientationEvents(this.getFeatureSetting('deviceOrientation'))
        this.blockGenericSensorApi(this.getFeatureSetting('GenericSensor'))
        this.filterUAClientHints(this.getFeatureSetting('UaClientHints'))
        this.removeNetworkInformationApi(this.getFeatureSetting('NetworkInformation'))
        this.blockGetInstalledRelatedApps(this.getFeatureSetting('getInstalledRelatedApps'))
        this.removeFileSystemAccessApi(this.getFeatureSetting('FileSystemAccess'))
        this.blockWindowPlacementApi(this.getFeatureSetting('WindowPlacement'))
        this.blockWebBluetoothApi(this.getFeatureSetting('WebBluetooth'))
        this.blockWebUsbApi(this.getFeatureSetting('WebUsb'))
        this.blockWebSerialApi(this.getFeatureSetting('WebSerial'))
        this.blockWebHidApi(this.getFeatureSetting('WebHid'))
        this.blockWebMidiApi(this.getFeatureSetting('WebMidi'))
        this.removeIdleDetectionApi(this.getFeatureSetting('IdleDetection'))
        this.removeWebNfcApi(this.getFeatureSetting('WebNfc'))
        this.filterStorageManagerApi(this.getFeatureSetting('StorageManager'))
    }

    /**
     * @param {DeviceOrientationConfig} settings
     */
    removeDeviceOrientationEvents (settings) {
        if (!settings.protected) {
            return
        }
        const eventsToBlock = settings.filterEvents || []
        if (eventsToBlock.length > 0) {
            for (const eventName of eventsToBlock) {
                const dom0HandlerName = `on${eventName}`
                if (dom0HandlerName in globalThis) {
                    wrapProperty(globalThis, dom0HandlerName, {
                        set: () => { /* noop */ }
                    })
                }
            }
            // FIXME: in Firefox, EventTarget.prototype.wrappedJSObject is undefined which breaks defineProperty
            if (!hasMozProxies) {
                wrapMethod(globalThis.EventTarget.prototype, 'addEventListener', function (nativeImpl, type, ...restArgs) {
                    if (eventsToBlock.includes(type) && this === globalThis) {
                        console.log('blocked event', type)
                        return
                    }
                    return nativeImpl.call(this, type, ...restArgs)
                })
            }
        }
    }

    /**
     * @param {GenericSensorConfig} settings
     */
    blockGenericSensorApi (settings) {
        if (!settings.protected) {
            return
        }
        const permissionsToFilter = settings.filterPermissions ?? [
            'accelerometer',
            'ambient-light-sensor',
            'gyroscope',
            'magnetometer'
        ]
        filterPermissionQuery(permissionsToFilter)
        if (settings.blockSensorStart) {
            wrapMethod(globalThis.Sensor?.prototype, 'start', function () {
                // block all sensors
                const ErrorCls = 'SensorErrorEvent' in globalThis ? globalThis.SensorErrorEvent : Error
                const error = new ErrorCls('error', {
                    error: new DOMException('Permissions to access sensor are not granted', 'NotAllowedError')
                })
                // isTrusted will be false, but not much we can do here
                this.dispatchEvent(error)
            })
        }
    }

    /**
     * @param {UaClientHintsConfig} settings
     */
    filterUAClientHints (settings) {
        if (!settings.protected) {
            return
        }
        wrapMethod(globalThis.NavigatorUAData?.prototype, 'getHighEntropyValues', async function (nativeImpl, hints) {
            const nativeResult = await nativeImpl.call(this, hints) // this may throw an error, and that is fine
            const filteredResult = {}
            for (const [key, value] of Object.entries(nativeResult)) {
                let result = value

                switch (key) {
                case 'brands':
                    if (settings.trimBrands) {
                        result = value.map((brand) => {
                            return {
                                brand: brand.brand,
                                version: stripVersion(brand.version)
                            }
                        })
                    }
                    break
                case 'model':
                    if (typeof settings.model !== 'undefined') {
                        result = settings.model
                    }
                    break
                case 'platformVersion':
                    if (settings.trimPlatformVersion) {
                        result = stripVersion(value, settings.trimPlatformVersion)
                    }
                    break
                case 'uaFullVersion':
                    if (settings.trimUaFullVersion) {
                        result = stripVersion(value, settings.trimUaFullVersion)
                    }
                    break
                case 'fullVersionList':
                    if (settings.trimFullVersionList) {
                        result = value.map((brand) => {
                            return {
                                brand: brand.brand,
                                version: stripVersion(brand.version, settings.trimFullVersionList)
                            }
                        })
                    }
                    break
                case 'architecture':
                    if (typeof settings.architecture !== 'undefined') {
                        result = settings.architecture
                    }
                    break
                case 'bitness':
                    if (typeof settings.bitness !== 'undefined') {
                        result = settings.bitness
                    }
                    break
                case 'platform':
                    if (typeof settings.platform !== 'undefined') {
                        result = settings.platform
                    }
                    break
                case 'mobile':
                    if (typeof settings.mobile !== 'undefined') {
                        result = settings.mobile
                    }
                    break
                }

                filteredResult[key] = result
            }
            return filteredResult
        })
    }

    /**
     * @param {NetworkInformationConfig} settings
     */
    removeNetworkInformationApi (settings) {
        if (!settings.protected) {
            return
        }
        if (!('connection' in this.navigatorPrototype)) {
            return
        }
        delete this.navigatorPrototype.connection
    }

    /**
     * @param {GetInstalledRelatedAppsConfig} settings
     */
    blockGetInstalledRelatedApps (settings) {
        if (!settings.protected) {
            return
        }
        wrapMethod(this.navigatorPrototype, 'getInstalledRelatedApps', function () {
            return Promise.resolve(settings.returnValue ?? [])
        })
    }

    /**
     * @param {FileSystemAccessConfig} settings
     */
    removeFileSystemAccessApi (settings) {
        if (!settings.protected) {
            return
        }
        if ('showOpenFilePicker' in globalThis && settings.disableOpenFilePicker) {
            delete globalThis.showOpenFilePicker
        }
        if ('showSaveFilePicker' in globalThis && settings.disableSaveFilePicker) {
            delete globalThis.showSaveFilePicker
        }
        if ('showDirectoryPicker' in globalThis && settings.disableDirectoryPicker) {
            delete globalThis.showDirectoryPicker
        }
        if ('DataTransferItem' in globalThis && 'getAsFileSystemHandle' in globalThis.DataTransferItem.prototype && settings.disableGetAsFileSystemHandle) {
            delete globalThis.DataTransferItem.prototype.getAsFileSystemHandle
        }
    }

    /**
     * @param {WindowPlacementConfig} settings
     */
    blockWindowPlacementApi (settings) {
        if (!settings.protected) {
            return
        }
        if ('screenIsExtended' in settings) {
            wrapProperty(globalThis.Screen?.prototype, 'isExtended', { get: () => settings.screenIsExtended })
        }
        filterPermissionQuery(settings.filterPermissions ?? [
            'window-placement',
            'window-management'
        ])
    }

    /**
     * @param {WebBluetoothConfig} settings
     */
    blockWebBluetoothApi (settings) {
        if (!settings.protected) {
            return
        }
        if (!('Bluetooth' in globalThis)) {
            return
        }
        // FIXME: in Firefox, EventTarget.prototype.wrappedJSObject is undefined which breaks defineProperty
        if (settings.filterEvents && settings.filterEvents.length > 0 && !hasMozProxies) {
            wrapMethod(EventTarget.prototype, 'addEventListener', function (nativeImpl, type, ...restArgs) {
                if (settings.filterEvents?.includes(type) && this === globalThis.Bluetooth) {
                    return
                }
                return nativeImpl.call(this, type, ...restArgs)
            })
        }

        filterPermissionQuery(settings.filterPermissions ?? ['bluetooth'])

        if (settings.blockRequestDevice) {
            wrapMethod(globalThis.Bluetooth?.prototype, 'requestDevice', function () {
                return Promise.reject(new DOMException('Bluetooth permission has been blocked.', 'NotFoundError'))
            })
        }

        if (settings.blockGetAvailability) {
            wrapMethod(globalThis.Bluetooth?.prototype, 'getAvailability', () => Promise.resolve(false))
        }
    }

    /**
     * @param {WebUsbConfig} settings
     */
    blockWebUsbApi (settings) {
        if (!settings.protected) {
            return
        }
        wrapMethod(globalThis.USB?.prototype, 'requestDevice', function () {
            return Promise.reject(new DOMException('No device selected.', 'NotFoundError'))
        })
    }

    /**
     * @param {WebSerialConfig} settings
     */
    blockWebSerialApi (settings) {
        if (!settings.protected) {
            return
        }
        wrapMethod(globalThis.Serial?.prototype, 'requestPort', function () {
            return Promise.reject(new DOMException('No port selected.', 'NotFoundError'))
        })
    }

    /**
     * @param {WebHidConfig} settings
     */
    blockWebHidApi (settings) {
        if (!settings.protected) {
            return
        }
        // Chrome 113 does not throw errors, and only returns an empty array here
        wrapMethod(globalThis.HID?.prototype, 'requestDevice', () => [])
    }

    /**
     * @param {WebMidiConfig} settings
     */
    blockWebMidiApi (settings) {
        if (!settings.protected) {
            return
        }
        wrapMethod(this.navigatorPrototype, 'requestMIDIAccess', function () {
            return Promise.reject(new DOMException('Permission is denied.', 'SecurityError'))
        })
        filterPermissionQuery(settings.filterPermissions ?? ['midi'])
    }

    /**
     * @param {IdleDetectionConfig} settings
     */
    removeIdleDetectionApi (settings) {
        if (!settings.protected) {
            return
        }
        if ('IdleDetector' in globalThis) {
            delete globalThis.IdleDetector
            filterPermissionQuery(settings.filterPermissions ?? ['idle-detection'])
        }
    }

    /**
     * @param {WebNfcConfig} settings
     */
    removeWebNfcApi (settings) {
        if (!settings.protected) {
            return
        }
        if ('NDEFReader' in globalThis && settings.disableNdefReader) {
            delete globalThis.NDEFReader
        }
        if ('NDEFMessage' in globalThis && settings.disableNdefMessage) {
            delete globalThis.NDEFMessage
        }
        if ('NDEFRecord' in globalThis && settings.disableNdefRecord) {
            delete globalThis.NDEFRecord
        }
    }

    /**
     * @param {StorageManagerConfig} settings
     */
    filterStorageManagerApi (settings) {
        if (!settings.protected) {
            return
        }
        if (settings.allowedQuotaValues) {
            const values = settings.allowedQuotaValues.slice()
            values.sort().filter(v => v > 0)
            values.unshift(0)
            // now, values is a sorted array of positive numbers, with 0 as the first element
            if (values.length > 0) {
                wrapMethod(globalThis.StorageManager?.prototype, 'estimate', async function (nativeImpl) {
                    const result = await nativeImpl.call(this)
                    // find the first allowed value from the right that is smaller than the result
                    let i = values.length - 1
                    while (i > 0 && values[i] > result.quota) {
                        i--
                    }
                    result.quota = values[i]
                    return result
                })
            }
        }
    }
}

/**
@typedef {
    {
        protected: boolean;
        filterPermissions?: string[];
        filterEvents?: string[];
    }
} ApiConfig

@typedef {ApiConfig} DeviceOrientationConfig

// mixins are necessary because jsdoc doesn't support `extends`
@typedef {{ blockSensorStart: boolean }} GenericSensorConfigMixin
@typedef {{ trimBrands: boolean, model: string, trimPlatformVersion: number, trimUaFullVersion: number, trimFullVersionList: number, architecture: string, bitness: string, mobile: boolean, platform: string }} UaClientHintsConfigMixin
@typedef {{ }} NetworkInformationConfigMixin
@typedef {{ returnValue: any }} GetInstalledRelatedAppsConfigMixin
@typedef {{ disableOpenFilePicker: boolean, disableSaveFilePicker: boolean, disableDirectoryPicker: boolean, disableGetAsFileSystemHandle: boolean }} FileSystemAccessConfigMixin
@typedef {{ screenIsExtended?: boolean }} WindowPlacementConfigMixin
@typedef {{ blockGetAvailability: boolean, blockRequestDevice: boolean }} WebBluetoothConfigMixin
@typedef {{ disableNdefReader: boolean, disableNdefMessage: boolean, disableNdefRecord: boolean }} WebNfcConfigMixin
@typedef {{ allowedQuotaValues: number[] }} StorageManagerConfigMixin

@typedef {ApiConfig & UaClientHintsConfigMixin} UaClientHintsConfig
@typedef {ApiConfig & GenericSensorConfigMixin} GenericSensorConfig
@typedef {ApiConfig & NetworkInformationConfigMixin} NetworkInformationConfig
@typedef {ApiConfig & GetInstalledRelatedAppsConfigMixin} GetInstalledRelatedAppsConfig
@typedef {ApiConfig & FileSystemAccessConfigMixin} FileSystemAccessConfig
@typedef {ApiConfig & WindowPlacementConfigMixin} WindowPlacementConfig
@typedef {ApiConfig & WebBluetoothConfigMixin} WebBluetoothConfig
@typedef {ApiConfig} WebUsbConfig
@typedef {ApiConfig} WebSerialConfig
@typedef {ApiConfig} WebHidConfig
@typedef {ApiConfig} WebMidiConfig
@typedef {ApiConfig} IdleDetectionConfig
@typedef {ApiConfig & WebNfcConfigMixin} WebNfcConfig
@typedef {ApiConfig & StorageManagerConfigMixin} StorageManagerConfig

@typedef {
    {
        deviceOrientation: DeviceOrientationConfig;
        UaClientHints: UaClientHintsConfig;
        GenericSensor: GenericSensorConfig;
        NetworkInformation: NetworkInformationConfig;
        getInstalledRelatedApps: GetInstalledRelatedAppsConfig;
        FileSystemAccess: FileSystemAccessConfig;
        WindowPlacement: WindowPlacementConfig;
        WebBluetooth: WebBluetoothConfig;
        WebUsb: WebUsbConfig;
        WebSerial: WebSerialConfig;
        WebHid: WebHidConfig;
        WebMidi: WebMidiConfig;
        IdleDetection: IdleDetectionConfig;
        WebNfc: WebNfcConfig;
        StorageManager: StorageManagerConfig;
    }
} ApiProtections
 */
