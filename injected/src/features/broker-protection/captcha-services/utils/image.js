/**
 * Converts an SVG element to a base64-encoded JPEG string.
 *
 * @param {SVGElement} svgElement - The SVG element to convert
 * @param {string} [backgroundColor='white'] - The background color for the JPEG image
 * @return {Promise<string>} - A promise that resolves to the base64-encoded JPEG image
 */
export function svgToBase64Jpg(svgElement, backgroundColor = 'white') {
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(svgString);

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                reject(new Error('Could not get 2D context from canvas'));
                return;
            }

            canvas.width = img.width;
            canvas.height = img.height;

            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);

            const jpgBase64 = canvas.toDataURL('image/jpeg');

            resolve(jpgBase64);
        };
        img.onerror = (error) => {
            reject(error);
        };

        img.src = svgDataUrl;
    });
}

/**
 * Converts an image element to a base64-encoded data URL.
 *
 * Reads the original image bytes (rather than re-encoding through a canvas) so that the
 * source format is preserved along with its correct data URL header — e.g. an animated GIF
 * stays a `data:image/gif;base64,...` rather than being flattened to a single-frame JPEG.
 *
 * @param {HTMLImageElement} imageElement - The image element to convert.
 * @return {Promise<string>} - A promise that resolves to the base64-encoded data URL.
 */
export async function imageToBase64(imageElement) {
    const src = imageElement.currentSrc || imageElement.src;

    // Captcha images are commonly embedded directly in the DOM as base64 data URLs. In that case the
    // src already is the value we want (correct format and header), so return it without re-encoding.
    if (src.startsWith('data:') && src.includes(';base64,')) {
        return src;
    }

    // Otherwise the image is hosted at a URL — fetch the bytes and encode, preserving the original
    // format/header (e.g. a gif stays 'image/gif' rather than being flattened to a single-frame jpeg).
    const response = await fetch(src);
    const blob = await response.blob();

    return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(/** @type {string} */ (reader.result)); // data:<original-mime>;base64,...
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}
