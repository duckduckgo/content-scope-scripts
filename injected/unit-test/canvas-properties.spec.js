import { modifyPixelData } from '../src/canvas.js';
// eslint-disable-next-line no-redeclare
import ImageData from '@canvas/image-data';

describe('canvas modifyPixelData', () => {
    it('modifies pixel data deterministically', () => {
        // Create a simple 2x2 image with distinct non-transparent pixels
        const data = new Uint8ClampedArray([
            255,
            0,
            0,
            255, // red pixel
            0,
            255,
            0,
            255, // green pixel
            0,
            0,
            255,
            255, // blue pixel
            255,
            255,
            0,
            255, // yellow pixel
        ]);
        const imageData = new ImageData(data, 2, 2);

        const result = modifyPixelData(imageData, 'testDomain', 'testSession', 2);
        expect(result.data.length).toBe(16);
    });

    it('produces same result for same inputs (deterministic)', () => {
        const makeData = () =>
            new Uint8ClampedArray([
                100, 50, 25, 255, 200, 150, 75, 255, 50, 100, 200, 255, 10, 20, 30, 255, 30, 60, 90, 255, 70, 140, 210, 255, 15, 25, 35,
                255, 45, 55, 65, 255, 80, 160, 240, 255,
            ]);
        const imageData1 = new ImageData(makeData(), 3, 3);
        const imageData2 = new ImageData(makeData(), 3, 3);

        const result1 = modifyPixelData(imageData1, 'domain', 'session', 3);
        const result2 = modifyPixelData(imageData2, 'domain', 'session', 3);

        expect(Array.from(result1.data)).toEqual(Array.from(result2.data));
    });

    it('ignores transparent pixels', () => {
        // All transparent pixels should not be modified
        const data = new Uint8ClampedArray([
            100,
            50,
            25,
            0, // transparent
            200,
            150,
            75,
            0, // transparent
            50,
            100,
            200,
            0, // transparent
            10,
            20,
            30,
            0, // transparent
        ]);
        const original = new Uint8ClampedArray(data);
        const imageData = new ImageData(data, 2, 2);

        modifyPixelData(imageData, 'domain', 'session', 2);

        // Transparent pixels should remain unchanged
        expect(Array.from(imageData.data)).toEqual(Array.from(original));
    });

    it('does not modify pixels that are adjacent and identical', () => {
        // All same pixels - adjacentSame returns true, so they're skipped
        const data = new Uint8ClampedArray([100, 100, 100, 255, 100, 100, 100, 255, 100, 100, 100, 255, 100, 100, 100, 255]);
        const original = new Uint8ClampedArray(data);
        const imageData = new ImageData(data, 2, 2);

        modifyPixelData(imageData, 'domain', 'session', 2);

        // Uniform pixels should remain unchanged (all adjacent same)
        expect(Array.from(imageData.data)).toEqual(Array.from(original));
    });

    it('produces different results for different domain keys', () => {
        const makeData = () =>
            new Uint8ClampedArray([
                100, 50, 25, 255, 200, 150, 75, 255, 50, 100, 200, 255, 10, 20, 30, 255, 30, 60, 90, 255, 70, 140, 210, 255, 15, 25, 35,
                255, 45, 55, 65, 255, 80, 160, 240, 255,
            ]);

        const result1 = modifyPixelData(new ImageData(makeData(), 3, 3), 'domain1', 'session', 3);
        const result2 = modifyPixelData(new ImageData(makeData(), 3, 3), 'domain2', 'session', 3);

        // Different domain keys should produce different modifications
        expect(Array.from(result1.data)).not.toEqual(Array.from(result2.data));
    });
});
