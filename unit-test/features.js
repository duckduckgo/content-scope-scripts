import { platformSupport } from '../src/features.js'

describe('Features definition', () => {
    fit('calls `webCompat` before `fingerPrintingScreenSize` https://app.asana.com/0/1177771139624306/1204944717262422/f', () => {
        // ensuring this order doesn't change, as it recently caused breakage
        expect(platformSupport.apple).toEqual([
            'webCompat',
            'runtimeChecks',
            'fingerprintingAudio',
            'fingerprintingBattery',
            'fingerprintingCanvas',
            'cookie',
            'googleRejected',
            'gpc',
            'fingerprintingHardware',
            'referrer',
            'fingerprintingScreenSize',
            'fingerprintingTemporaryStorage',
            'navigatorInterface',
            'elementHiding',
            'exceptionHandler'
        ])
    })
})
