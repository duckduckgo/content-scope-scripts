import { useState } from 'preact/hooks';
import { useMessaging } from '../../../../types.js';
import { ImageAttachments } from '../../PersistentOmnibarValuesProvider';
import { FILE_READ_TIMEOUT, readFileAsDataUrl } from '../attachments/readFileAsDataUrl';

const { useStateWithLocalPersistence } = ImageAttachments;

/**
 * `addedAtRelative` is a `performance.now()` value used to sort attachments by attach order.
 * `source` records how the image was added, for telemetry when it is removed.
 * @typedef {import('../../../../../types/new-tab.js').ImageAttachmentSource} ImageAttachmentSource
 * @typedef {{ dataUrl: string, fileName: string, mimeType: string, addedAtRelative: number, source: ImageAttachmentSource }} AttachedImage
 * @typedef {'imageTooLarge' | 'processingFailed'} ImageErrorType
 * @typedef {{ type: ImageErrorType, fileNames: string[] }} ImageError
 * @typedef {ReturnType<typeof useImageAttachments>} ImageAttachmentState
 * @typedef {{ maxDimension?: number, source?: ImageAttachmentSource }} ProcessImageOptions
 * @typedef {{ added: number, rejected: number }} ProcessImageResult - `rejected` counts files that failed reading or normalisation.
 */

class ImageTooLargeError extends Error {
    constructor(/** @type {string} */ message) {
        super(message);
        this.name = 'ImageTooLargeError';
    }
}

export const MAX_IMAGES = 3;
const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_DIMENSION = 512;
/**
 * Pasted bitmaps (usually screenshots) keep up to this size, so text in them stays legible.
 * Regular picked images use {@link MAX_DIMENSION}.
 */
export const SCREENSHOT_MAX_DIMENSION = 1024;
const MAX_ENCODED_BYTES = 10 * 1024 * 1024;
// Reject decoded images whose pixel count exceeds this threshold before
// allocating the canvas, limiting decompression-bomb memory pressure.
const MAX_DECODED_PIXELS = 10000 * 10000;

/**
 * Normalises an image via the Canvas API: converts to the target MIME type and
 * caps dimensions to MAX_DIMENSION (preserving aspect ratio).
 * Matches apple-browsers' resize (AIChatImageAttachment.swift) + format
 * conversion (AIChatOmnibarController.swift) pipeline.
 *
 * @param {string} srcDataUrl
 * @param {'image/png' | 'image/jpeg'} targetMime
 * @param {number} [maxDimension] - longest side after resizing; defaults to {@link MAX_DIMENSION}.
 * @returns {Promise<string>} data-URL in the target format
 */
function normaliseImage(srcDataUrl, targetMime, maxDimension = MAX_DIMENSION) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            let { naturalWidth: w, naturalHeight: h } = img;

            if (w * h > MAX_DECODED_PIXELS) {
                reject(new ImageTooLargeError('Decoded image dimensions exceed safety threshold'));
                return;
            }

            if (w > maxDimension || h > maxDimension) {
                const scale = maxDimension / Math.max(w, h);
                w = Math.round(w * scale);
                h = Math.round(h * scale);
            }

            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas 2d context'));
                return;
            }
            ctx.drawImage(img, 0, 0, w, h);
            const result = canvas.toDataURL(targetMime);

            if (!result.startsWith('data:image/')) {
                reject(new Error('Canvas produced invalid output'));
                return;
            }

            if (result.length > MAX_ENCODED_BYTES) {
                reject(new ImageTooLargeError('Encoded image exceeds size limit'));
                return;
            }

            resolve(result);
        };
        img.onerror = () => reject(new Error('Failed to load image for conversion'));
        img.src = srcDataUrl;
    });
}

/**
 * @param {object} params
 * @param {string|null|undefined} [params.tabId] - NTP tab the attachments are persisted under.
 * @param {number} [params.maxImages] - Max images per submission, from backend `attachmentLimits`. Defaults to {@link MAX_IMAGES}.
 */
export function useImageAttachments({ tabId, maxImages = MAX_IMAGES } = {}) {
    const ntp = useMessaging();
    const [attachedImages, setAttachedImages] = useStateWithLocalPersistence(tabId);
    const [imageError, setImageError] = useState(/** @type {ImageError|null} */ (null));

    const imageLimitExceeded = attachedImages.length > maxImages;
    const imageUploadDisabled = attachedImages.length >= maxImages;

    const clearAttachedImages = () => setAttachedImages([]);
    const clearImageError = () => setImageError(null);

    /**
     * Validates, resizes and attaches images. Sends `omnibar_image_attached` for each chip added.
     * @type {(files: File[], options?: ProcessImageOptions) => Promise<ProcessImageResult>}
     */
    const processFiles = async (files, { maxDimension, source = 'file' } = {}) => {
        const nothing = { added: 0, rejected: 0 };
        if (files.length === 0) return nothing;
        setImageError(null);

        const existingNames = new Set(attachedImages.map((img) => img.fileName));
        // Reported like a processing failure, so an unsupported pasted format (e.g. BMP) isn't silently dropped.
        /** @type {string[]} */
        const unsupportedNames = [];
        const validFiles = files.filter((file) => {
            if (!ALLOWED_FORMATS.includes(file.type)) {
                console.warn('Attachment rejected: unsupported file type');
                unsupportedNames.push(file.name);
                return false;
            }
            if (existingNames.has(file.name)) {
                return false;
            }
            return true;
        });

        // Only process enough to reach maxImages + 1 (to trigger the limit warning).
        const processLimit = maxImages + 1 - attachedImages.length;
        const filesToProcess = processLimit > 0 ? validFiles.slice(0, processLimit) : [];

        if (filesToProcess.length === 0) {
            if (unsupportedNames.length > 0) setImageError({ type: 'processingFailed', fileNames: unsupportedNames });
            return { ...nothing, rejected: unsupportedNames.length };
        }

        const newImages = filesToProcess.map(async (file) => {
            /** @type {string} */
            let rawDataUrl;
            try {
                rawDataUrl = await readFileAsDataUrl(file, FILE_READ_TIMEOUT);
            } catch (err) {
                console.warn('Attachment rejected: failed to read file');
                throw err;
            }
            try {
                const targetMime = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
                const dataUrl = await normaliseImage(rawDataUrl, targetMime, maxDimension);
                return { dataUrl, fileName: file.name, mimeType: targetMime };
            } catch (err) {
                console.warn('Attachment rejected: image normalisation failed');
                throw err;
            }
        });

        const results = await Promise.allSettled(newImages);
        const images = /** @type {PromiseFulfilledResult<Omit<AttachedImage, 'addedAtRelative'>>[]} */ (
            results.filter((r) => r.status === 'fulfilled')
        ).map((r) => r.value);
        const tooLargeNames = [];
        const failedNames = [...unsupportedNames];
        for (let i = 0; i < results.length; i++) {
            const r = results[i];
            if (r.status === 'rejected') {
                const name = filesToProcess[i].name;
                if (r.reason instanceof ImageTooLargeError) {
                    tooLargeNames.push(name);
                } else {
                    failedNames.push(name);
                }
            }
        }
        if (tooLargeNames.length > 0) {
            setImageError({ type: 'imageTooLarge', fileNames: tooLargeNames });
        } else if (failedNames.length > 0) {
            setImageError({ type: 'processingFailed', fileNames: failedNames });
        }

        if (images.length > 0) {
            const addedAtRelative = performance.now();
            setAttachedImages((prev) => [...prev, ...images.map((img) => ({ ...img, addedAtRelative, source }))]);
            for (let i = 0; i < images.length; i++) {
                ntp.telemetryEvent({ attributes: { name: 'omnibar_image_attached', value: { source } } });
            }
        }

        return { added: images.length, rejected: tooLargeNames.length + failedNames.length };
    };

    /**
     * Removes an image chip at the user's request (its x button); sends the removal telemetry.
     * @param {number} index
     */
    const handleRemoveImage = (index) => {
        const removed = attachedImages[index];
        setAttachedImages((prev) => prev.filter((_, i) => i !== index));
        if (!removed) return;
        ntp.telemetryEvent({ attributes: { name: 'omnibar_image_removed', value: { source: removed.source } } });
    };

    /**
     * Extracts submission payloads from attached images.
     * All images are normalised to JPEG or PNG at read time; any that fail
     * data-URL parsing are dropped (fail-closed).
     * @returns {{ data: string, format: "jpeg" | "png" }[] | undefined}
     */
    const getImagesForSubmission = () => {
        if (attachedImages.length === 0) return undefined;
        /** @type {{ data: string, format: "jpeg" | "png" }[]} */
        const result = [];
        for (const img of attachedImages) {
            const match = img.dataUrl.match(/^data:image\/(jpeg|png);base64,(.+)$/);
            if (!match) {
                console.warn('Dropping image at submission: data URL does not match expected format');
                continue;
            }
            /** @type {"jpeg" | "png"} */
            const format = /** @type {"jpeg" | "png"} */ (match[1]);
            result.push({ data: match[2], format });
        }
        return result.length > 0 ? result : undefined;
    };

    return {
        attachedImages,
        processFiles,
        handleRemoveImage,
        clearAttachedImages,
        imageUploadDisabled,
        imageLimitExceeded,
        imageError,
        clearImageError,
        getImagesForSubmission,
        maxImages,
    };
}

/**
 * @param {ImageError|null} imageError
 * @param {{imageTooLarge: string, processingFailed: string}} messages
 * @returns {string|null}
 */
export function getImageErrorMessage(imageError, messages) {
    if (!imageError) return null;
    const names = imageError.fileNames.join(', ');
    const base = imageError.type === 'imageTooLarge' ? messages.imageTooLarge : messages.processingFailed;
    return `${names}: ${base}`;
}
