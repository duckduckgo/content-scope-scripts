/**
 *
 * This protection changes or disables some web APIs that are known to be harmful to privacy.
 * When an API is not removed from the globals, its behaviour is changed to reduce the amount of information it can leak.
 *
 * ## Remote Config
 * The behaviour can be controlled with a remote config. [Example](../../integration-test/test-pages/harmful-apis/config/apis.json)
 *
 * @module Harmful APIs protection
 *
 */
import ContentFeature from '../content-feature';
import { DDGReflect, stripVersion } from '../utils';

/**
 * @typedef {Object} ExtendedGlobal
 * @property {{ prototype: object }} [Permissions]
 * @property {typeof EventTarget} [EventTarget]
 * @property {{ prototype: object }} [Sensor]
 * @property {typeof Event} [SensorErrorEvent]
 * @property {{ prototype: object }} [NavigatorUAData]
 * @property {{ prototype: object }} [DataTransferItem]
 * @property {{ prototype: object }} [Screen]
 * @property {{ prototype: object; new (...args: unknown[]): object }} [Bluetooth]
 * @property {{ prototype: object }} [USB]
 * @property {{ prototype: object }} [Serial]
 * @property {{ prototype: object }} [HID]
 * @property {{ prototype: object }} [StorageManager]
 * @property {{ prototype: Navigator }} [Navigator]
 * @property {{ prototype: Navigator }} [WorkerNavigator]
 */

/** @returns {ExtendedGlobal & Window & WorkerGlobalScope} */
function getGlobal() {
    return /** @type {ExtendedGlobal & Window & WorkerGlobalScope} */ (/** @type {unknown} */ (globalThis));
}

/**
 * Blocks some privacy harmful APIs.
 * @internal
 */
export default class HarmfulApis extends ContentFeature {
    init() {
        const g = getGlobal();
        // @ts-expect-error linting is not yet seet up for worker context
        /** @type {Navigator | WorkerNavigator} */
        this.navigatorPrototype = g.Navigator?.prototype || g.WorkerNavigator?.prototype;

        this.removeDeviceOrientationEvents(this.getFeatureSetting('deviceOrientation'));
        this.blockGenericSensorApi(this.getFeatureSetting('GenericSensor'));
        this.filterUAClientHints(this.getFeatureSetting('UaClientHints'));
        this.removeNetworkInformationApi(this.getFeatureSetting('NetworkInformation'));
        this.blockGetInstalledRelatedApps(this.getFeatureSetting('getInstalledRelatedApps'));
        this.removeFileSystemAccessApi(this.getFeatureSetting('FileSystemAccess'));
        this.blockWindowPlacementApi(this.getFeatureSetting('WindowPlacement'));
        this.blockWebBluetoothApi(this.getFeatureSetting('WebBluetooth'));
        this.blockWebUsbApi(this.getFeatureSetting('WebUsb'));
        this.blockWebSerialApi(this.getFeatureSetting('WebSerial'));
        this.blockWebHidApi(this.getFeatureSetting('WebHid'));
        this.blockWebMidiApi(this.getFeatureSetting('WebMidi'));
        this.removeIdleDetectionApi(this.getFeatureSetting('IdleDetection'));
        this.removeWebNfcApi(this.getFeatureSetting('WebNfc'));
        this.filterStorageManagerApi(this.getFeatureSetting('StorageManager'));
    }

    /**
     * block some Permission API queries. The set of available permissions is quickly changing over time. Up-to-date lists can be found here:
     * - Chromium: https://chromium.googlesource.com/chromium/src/+/refs/heads/main/third_party/blink/renderer/modules/permissions/permission_descriptor.idl
     * - Gecko: https://searchfox.org/mozilla-central/source/dom/webidl/Permissions.webidl#10
     * - WebKit: https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/permissions/PermissionName.idl
     * @param {string[]} permissions permission names to auto-deny
     */
    filterPermissionQuery(permissions) {
        if (!permissions || permissions.length === 0) {
            return;
        }
        const permsProto = getGlobal().Permissions?.prototype;
        if (!permsProto) return;
        this.wrapMethod(
            permsProto,
            'query',
            /** @this {Permissions} */ async function (nativeImpl, queryObject) {
                // call the original function first in case it throws an error
                const origResult = await DDGReflect.apply(nativeImpl, this, [queryObject]);

                if (permissions.includes(queryObject.name)) {
                    return {
                        name: queryObject.name,
                        state: 'denied',
                        status: 'denied',
                    };
                }
                return origResult;
            },
        );
    }

    /**
     * @param {DeviceOrientationConfig} settings
     */
    removeDeviceOrientationEvents(settings) {
        if (settings?.state !== 'enabled') {
            return;
        }
        const eventsToBlock = settings.filterEvents || [];
        if (eventsToBlock.length > 0) {
            for (const eventName of eventsToBlock) {
                const dom0HandlerName = `on${eventName}`;
                if (dom0HandlerName in getGlobal()) {
                    this.wrapProperty(getGlobal(), dom0HandlerName, {
                        set: () => {
                            /* noop */
                        },
                    });
                }
            }
            const eventTargetProto = getGlobal().EventTarget?.prototype;
            if (!eventTargetProto) return;
            this.wrapMethod(
                eventTargetProto,
                'addEventListener',
                /** @this {EventTarget} */ function (nativeImpl, type, ...restArgs) {
                    if (eventsToBlock.includes(type) && this === getGlobal()) {
                        console.log('blocked event', type);
                        return;
                    }
                    return DDGReflect.apply(nativeImpl, this, [type, ...restArgs]);
                },
            );
        }
    }

    /**
     * @param {GenericSensorConfig} settings
     */
    blockGenericSensorApi(settings) {
        if (settings?.state !== 'enabled') {
            return;
        }
        const permissionsToFilter = settings.filterPermissions ?? ['accelerometer', 'ambient-light-sensor', 'gyroscope', 'magnetometer'];
        this.filterPermissionQuery(permissionsToFilter);
        if (settings.blockSensorStart) {
            const sensorProto = getGlobal().Sensor?.prototype;
            if (!sensorProto) return;
            this.wrapMethod(
                sensorProto,
                'start',
                /** @this {EventTarget} */ function () {
                    // block all sensors
                    const g = getGlobal();
                    const EventCls = 'SensorErrorEvent' in g && g.SensorErrorEvent ? g.SensorErrorEvent : Event;
                    /** @type {EventInit & { error?: unknown }} */
                    const eventInit = { error: new DOMException('Permissions to access sensor are not granted', 'NotAllowedError') };
                    const error = new EventCls('error', eventInit);
                    // isTrusted will be false, but not much we can do here
                    this.dispatchEvent(error);
                },
            );
        }
    }

    /**
     * @param {UaClientHintsConfig} settings
     */
    filterUAClientHints(settings) {
        if (settings?.state !== 'enabled') {
            return;
        }
        const navUADataProto = getGlobal().NavigatorUAData?.prototype;
        if (!navUADataProto) return;
        this.wrapMethod(
            navUADataProto,
            'getHighEntropyValues',
            /** @this {object} */ async function (nativeImpl, hints) {
                const nativeResult = await DDGReflect.apply(nativeImpl, this, [hints]); // this may throw an error, and that is fine
                /** @type {Record<string, unknown>} */
                const filteredResult = {};
                const highEntropyValues = settings.highEntropyValues || {};
                for (const [key, value] of Object.entries(nativeResult)) {
                    let result = value;

                    switch (key) {
                        case 'brands':
                            if (highEntropyValues.trimBrands) {
                                result = value.map(
                                    /** @param {{brand: string, version: string}} brand */ (brand) => {
                                        return {
                                            brand: brand.brand,
                                            version: stripVersion(brand.version),
                                        };
                                    },
                                );
                            }
                            break;
                        case 'model':
                            if (typeof highEntropyValues.model !== 'undefined') {
                                result = highEntropyValues.model;
                            }
                            break;
                        case 'platformVersion':
                            if (highEntropyValues.trimPlatformVersion) {
                                result = stripVersion(value, highEntropyValues.trimPlatformVersion);
                            }
                            break;
                        case 'uaFullVersion':
                            if (highEntropyValues.trimUaFullVersion) {
                                result = stripVersion(value, highEntropyValues.trimUaFullVersion);
                            }
                            break;
                        case 'fullVersionList':
                            if (highEntropyValues.trimFullVersionList) {
                                result = value.map(
                                    /** @param {{brand: string, version: string}} brand */ (brand) => {
                                        return {
                                            brand: brand.brand,
                                            version: stripVersion(brand.version, highEntropyValues.trimFullVersionList),
                                        };
                                    },
                                );
                            }
                            break;
                        case 'architecture':
                            if (typeof highEntropyValues.architecture !== 'undefined') {
                                result = highEntropyValues.architecture;
                            }
                            break;
                        case 'bitness':
                            if (typeof highEntropyValues.bitness !== 'undefined') {
                                result = highEntropyValues.bitness;
                            }
                            break;
                        case 'platform':
                            if (typeof highEntropyValues.platform !== 'undefined') {
                                result = highEntropyValues.platform;
                            }
                            break;
                        case 'mobile':
                            if (typeof highEntropyValues.mobile !== 'undefined') {
                                result = highEntropyValues.mobile;
                            }
                            break;
                    }

                    filteredResult[key] = result;
                }
                return filteredResult;
            },
        );
    }

    /**
     * @param {NetworkInformationConfig} settings
     */
    removeNetworkInformationApi(settings) {
        if (settings?.state !== 'enabled') {
            return;
        }
        if (!('connection' in this.navigatorPrototype)) {
            return;
        }
        delete this.navigatorPrototype.connection;
    }

    /**
     * @param {GetInstalledRelatedAppsConfig} settings
     */
    blockGetInstalledRelatedApps(settings) {
        if (settings?.state !== 'enabled') {
            return;
        }
        this.wrapMethod(this.navigatorPrototype, 'getInstalledRelatedApps', function () {
            return Promise.resolve(settings.returnValue ?? []);
        });
    }

    /**
     * @param {FileSystemAccessConfig} settings
     */
    removeFileSystemAccessApi(settings) {
        if (settings?.state !== 'enabled') {
            return;
        }
        const g = getGlobal();
        if ('showOpenFilePicker' in g && settings.disableOpenFilePicker) {
            delete g.showOpenFilePicker;
        }
        if ('showSaveFilePicker' in g && settings.disableSaveFilePicker) {
            delete g.showSaveFilePicker;
        }
        if ('showDirectoryPicker' in g && settings.disableDirectoryPicker) {
            delete g.showDirectoryPicker;
        }
        const dataTransferItem = g.DataTransferItem;
        if (dataTransferItem && 'getAsFileSystemHandle' in dataTransferItem.prototype && settings.disableGetAsFileSystemHandle) {
            delete dataTransferItem.prototype.getAsFileSystemHandle;
        }
    }

    /**
     * @param {WindowPlacementConfig} settings
     */
    blockWindowPlacementApi(settings) {
        if (settings?.state !== 'enabled') {
            return;
        }
        if ('screenIsExtended' in settings) {
            const screenProto = getGlobal().Screen?.prototype;
            if (screenProto) {
                this.wrapProperty(screenProto, 'isExtended', { get: () => settings.screenIsExtended });
            }
        }
        this.filterPermissionQuery(settings.filterPermissions ?? ['window-placement', 'window-management']);
    }

    /**
     * @param {WebBluetoothConfig} settings
     */
    blockWebBluetoothApi(settings) {
        if (settings?.state !== 'enabled') {
            return;
        }
        const g = getGlobal();
        if (!('Bluetooth' in g)) {
            return;
        }
        if (settings.filterEvents && settings.filterEvents.length > 0) {
            const BluetoothConstructor = g.Bluetooth;
            this.wrapMethod(
                EventTarget.prototype,
                'addEventListener',
                /** @this {EventTarget} */ function (nativeImpl, type, ...restArgs) {
                    if (settings.filterEvents?.includes(type) && BluetoothConstructor && this instanceof BluetoothConstructor) {
                        return;
                    }
                    return DDGReflect.apply(nativeImpl, this, [type, ...restArgs]);
                },
            );
        }

        this.filterPermissionQuery(settings.filterPermissions ?? ['bluetooth']);

        const bluetoothProto = g.Bluetooth?.prototype;
        if (settings.blockRequestDevice && bluetoothProto) {
            this.wrapMethod(bluetoothProto, 'requestDevice', function () {
                return Promise.reject(new DOMException('Bluetooth permission has been blocked.', 'NotFoundError'));
            });
        }

        if (settings.blockGetAvailability && bluetoothProto) {
            this.wrapMethod(bluetoothProto, 'getAvailability', () => Promise.resolve(false));
        }
    }

    /**
     * @param {WebUsbConfig} settings
     */
    blockWebUsbApi(settings) {
        if (settings?.state !== 'enabled') {
            return;
        }
        const usbProto = getGlobal().USB?.prototype;
        if (usbProto) {
            this.wrapMethod(usbProto, 'requestDevice', function () {
                return Promise.reject(new DOMException('No device selected.', 'NotFoundError'));
            });
        }
    }

    /**
     * @param {WebSerialConfig} settings
     */
    blockWebSerialApi(settings) {
        if (settings?.state !== 'enabled') {
            return;
        }
        const serialProto = getGlobal().Serial?.prototype;
        if (serialProto) {
            this.wrapMethod(serialProto, 'requestPort', function () {
                return Promise.reject(new DOMException('No port selected.', 'NotFoundError'));
            });
        }
    }

    /**
     * @param {WebHidConfig} settings
     */
    blockWebHidApi(settings) {
        if (settings?.state !== 'enabled') {
            return;
        }
        // Chrome 113 does not throw errors, and only returns an empty array here
        const hidProto = getGlobal().HID?.prototype;
        if (hidProto) {
            this.wrapMethod(hidProto, 'requestDevice', () => Promise.resolve([]));
        }
    }

    /**
     * @param {WebMidiConfig} settings
     */
    blockWebMidiApi(settings) {
        if (settings?.state !== 'enabled') {
            return;
        }
        this.wrapMethod(this.navigatorPrototype, 'requestMIDIAccess', function () {
            return Promise.reject(new DOMException('Permission is denied.', 'SecurityError'));
        });
        this.filterPermissionQuery(settings.filterPermissions ?? ['midi']);
    }

    /**
     * @param {IdleDetectionConfig} settings
     */
    removeIdleDetectionApi(settings) {
        if (settings?.state !== 'enabled') {
            return;
        }
        const g = getGlobal();
        if ('IdleDetector' in g) {
            delete g.IdleDetector;
            this.filterPermissionQuery(settings.filterPermissions ?? ['idle-detection']);
        }
    }

    /**
     * @param {WebNfcConfig} settings
     */
    removeWebNfcApi(settings) {
        if (settings?.state !== 'enabled') {
            return;
        }
        const g = getGlobal();
        if ('NDEFReader' in g && settings.disableNdefReader) {
            delete g.NDEFReader;
        }
        if ('NDEFMessage' in g && settings.disableNdefMessage) {
            delete g.NDEFMessage;
        }
        if ('NDEFRecord' in g && settings.disableNdefRecord) {
            delete g.NDEFRecord;
        }
    }

    /**
     * @param {StorageManagerConfig} settings
     */
    filterStorageManagerApi(settings) {
        if (settings?.state !== 'enabled') {
            return;
        }
        if (settings.allowedQuotaValues) {
            const values = settings.allowedQuotaValues.slice();
            values.sort().filter((v) => v > 0);
            values.unshift(0);
            // now, values is a sorted array of positive numbers, with 0 as the first element
            if (values.length > 0) {
                const storageManagerProto = getGlobal().StorageManager?.prototype;
                if (!storageManagerProto) return;
                this.wrapMethod(
                    storageManagerProto,
                    'estimate',
                    /** @this {StorageManager} */ async function (nativeImpl, ...args) {
                        const result = await DDGReflect.apply(nativeImpl, this, args);
                        // find the first allowed value from the right that is smaller than the result
                        let i = values.length - 1;
                        while (i > 0) {
                            const vi = values[i];
                            if (vi !== undefined && vi > result.quota) {
                                i--;
                            } else {
                                break;
                            }
                        }
                        const finalVal = values[i];
                        result.quota = finalVal ?? 0;
                        return result;
                    },
                );
            }
        }
    }
}

/**
@typedef {
    {
        state: 'enabled'|'disabled';
        filterPermissions?: string[];
        filterEvents?: string[];
    }
} ApiConfig

@typedef {ApiConfig} DeviceOrientationConfig

// mixins are necessary because jsdoc doesn't support `extends`
@typedef {{ blockSensorStart: boolean }} GenericSensorConfigMixin
@typedef {{ highEntropyValues: { trimBrands: boolean, model: string, trimPlatformVersion: number, trimUaFullVersion: number, trimFullVersionList: number, architecture: string, bitness: string, mobile: boolean, platform: string } }} UaClientHintsConfigMixin
@typedef {{ }} NetworkInformationConfigMixin
@typedef {{ returnValue: string[] }} GetInstalledRelatedAppsConfigMixin
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
