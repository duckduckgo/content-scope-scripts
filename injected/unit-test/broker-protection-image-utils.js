import { imageToBase64 } from '../src/features/broker-protection/captcha-services/utils/image.js';

/**
 * The data-URL passthrough branch of imageToBase64 only reads `currentSrc`/`src` and does string
 * math, so it can be exercised with a plain stub — no DOM, fetch, or FileReader required.
 * @param {string} src
 */
function stubImageElement(src) {
    return /** @type {HTMLImageElement} */ (/** @type {unknown} */ ({ src, currentSrc: '' }));
}

const MAX_CAPTCHA_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Builds a base64 data URL whose decoded payload is approximately `byteLength` bytes.
 * @param {number} byteLength
 */
function dataUrlOfDecodedSize(byteLength) {
    // 4 base64 chars encode 3 bytes, so ceil(byteLength / 3) * 4 chars decode to >= byteLength bytes.
    const base64 = 'A'.repeat(Math.ceil(byteLength / 3) * 4);
    return `data:image/gif;base64,${base64}`;
}

describe('imageToBase64 (data URL passthrough)', () => {
    it('returns a within-limit base64 data URL unchanged', async () => {
        const src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

        const result = await imageToBase64(stubImageElement(src));

        expect(result).toBe(src);
    });

    it('rejects an inline data URL whose decoded payload exceeds the size cap', async () => {
        const oversized = dataUrlOfDecodedSize(MAX_CAPTCHA_IMAGE_BYTES + 1024);

        await expectAsync(imageToBase64(stubImageElement(oversized))).toBeRejectedWithError(/exceeds .* bytes/);
    });
});
