import { useState } from 'preact/hooks';
import { ImageAttachments } from '../../PersistentOmnibarValuesProvider';
import { FILE_READ_TIMEOUT, readFileAsDataUrl } from '../attachments/readFileAsDataUrl';

const { useStateWithLocalPersistence } = ImageAttachments;

/**
 * `addedAtRelative` is a `performance.now()` value used to sort attachments by attach order.
 * @typedef {{ dataUrl: string, fileName: string, mimeType: string, addedAtRelative: number }} AttachedImage
 * @typedef {'imageTooLarge' | 'processingFailed'} ImageErrorType
 * @typedef {{ type: ImageErrorType, fileNames: string[] }} ImageError
 * @typedef {ReturnType<typeof useImageAttachments>} ImageAttachmentState
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
 * @returns {Promise<string>} data-URL in the target format
 */
function normaliseImage(srcDataUrl, targetMime) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            let { naturalWidth: w, naturalHeight: h } = img;

            if (w * h > MAX_DECODED_PIXELS) {
                reject(new ImageTooLargeError('Decoded image dimensions exceed safety threshold'));
                return;
            }

            if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
                const scale = MAX_DIMENSION / Math.max(w, h);
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

/** @param {string|null|undefined} [tabId] - NTP tab the attachments are persisted under. */
export function useImageAttachments(tabId) {
    const [attachedImages, setAttachedImages] = useStateWithLocalPersistence(tabId);
    const [imageError, setImageError] = useState(/** @type {ImageError|null} */ (null));

    const imageLimitExceeded = attachedImages.length > MAX_IMAGES;
    const imageUploadDisabled = attachedImages.length >= MAX_IMAGES;

    const clearAttachedImages = () => setAttachedImages([]);
    const clearImageError = () => setImageError(null);

    /** @type {(files: File[]) => Promise<void>} */
    const processFiles = async (files) => {
        if (files.length === 0) return;
        setImageError(null);

        const existingNames = new Set(attachedImages.map((img) => img.fileName));
        const validFiles = files.filter((file) => {
            if (!ALLOWED_FORMATS.includes(file.type)) {
                console.warn('Attachment rejected: unsupported file type');
                return false;
            }
            if (existingNames.has(file.name)) {
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        // Only process enough to reach MAX_IMAGES + 1 (to trigger the limit warning).
        const processLimit = MAX_IMAGES + 1 - attachedImages.length;
        const filesToProcess = processLimit > 0 ? validFiles.slice(0, processLimit) : [];

        if (filesToProcess.length === 0) return;

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
                const dataUrl = await normaliseImage(rawDataUrl, targetMime);
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
        const failedNames = [];
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
            setAttachedImages((prev) => [...prev, ...images.map((img) => ({ ...img, addedAtRelative }))]);
        }
    };

    /** @param {number} index */
    const handleRemoveImage = (index) => {
        setAttachedImages((prev) => prev.filter((_, i) => i !== index));
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
