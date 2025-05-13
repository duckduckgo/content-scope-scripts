import { platformSupport } from '../src/features.js';

describe('Features definition', () => {
    it('calls `webCompat` before `fingerPrintingScreenSize` https://app.asana.com/0/1177771139624306/1204944717262422/f', () => {
        // ensuring this order doesn't change, as it recently caused breakage
        expect(platformSupport.apple).toEqual([
            'webCompat',
            'duckPlayerNative',
            'fingerprintingAudio',
            'fingerprintingBattery',
            'fingerprintingCanvas',
            'googleRejected',
            'gpc',
            'fingerprintingHardware',
            'referrer',
            'fingerprintingScreenSize',
            'fingerprintingTemporaryStorage',
            'navigatorInterface',
            'elementHiding',
            'exceptionHandler',
            'apiManipulation',
        ]);
    });
});
