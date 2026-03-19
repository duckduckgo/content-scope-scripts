import { useRef, useState } from 'preact/hooks';

/**
 * @typedef {{ dataUrl: string, fileName: string, mimeType: string }} AttachedImage
 */

const MAX_IMAGES = 3;
const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
const FILE_READ_TIMEOUT = 30000;
// Match apple-browsers AIChatImageAttachment.swift maxDimension
const MAX_DIMENSION = 512;
const MAX_ENCODED_BYTES = 10 * 1024 * 1024; // safety cap on base64 output

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
                reject(new Error(`Encoded image too large (${(result.length / 1024 / 1024).toFixed(1)}MB)`));
                return;
            }

            resolve(result);
        };
        img.onerror = () => reject(new Error('Failed to load image for conversion'));
        img.src = srcDataUrl;
    });
}

export function useImageAttachments() {
    const fileInputRef = useRef(/** @type {HTMLInputElement|null} */ (null));
    const [attachedImages, setAttachedImages] = useState(/** @type {AttachedImage[]} */ ([]));

    const imageUploadDisabled = attachedImages.length >= MAX_IMAGES;

    const clearAttachedImages = () => setAttachedImages([]);

    /** @type {(event: Event) => Promise<void>} */
    const handleFileChange = async (event) => {
        const input = /** @type {HTMLInputElement} */ (event.currentTarget);
        const files = input.files;
        if (!files || files.length === 0) return;

        const validFiles = Array.from(files).filter((file) => {
            if (!ALLOWED_FORMATS.includes(file.type)) {
                console.warn(`Unsupported file type: ${file.type}. Allowed types: ${ALLOWED_FORMATS.join(', ')}`);
                return false;
            }
            return true;
        });

        // Cap before the expensive read+normalise pipeline; the state updater
        // below still enforces the limit as a race-safe final check.
        const remaining = MAX_IMAGES - attachedImages.length;
        const filesToProcess = validFiles.slice(0, remaining);

        if (filesToProcess.length === 0) {
            input.value = '';
            return;
        }

        const newImages = filesToProcess.map(
            (file) =>
                new Promise((resolve, reject) => {
                    const reader = new FileReader();

                    reader.onload = async () => {
                        clearTimeout(timeoutId);
                        try {
                            const rawDataUrl = /** @type {string} */ (reader.result);
                            const targetMime = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
                            const dataUrl = await normaliseImage(rawDataUrl, targetMime);
                            resolve({ dataUrl, fileName: file.name, mimeType: targetMime });
                        } catch (err) {
                            console.warn(`Rejecting "${file.name}": ${/** @type {Error} */ (err).message}`);
                            reject(err);
                        }
                    };

                    reader.onerror = () => {
                        clearTimeout(timeoutId);
                        console.error(`Failed to read file "${file.name}":`, reader.error);
                        reject(new Error(`Failed to read file: ${reader.error?.message || 'Unknown error'}`));
                    };

                    const timeoutId = setTimeout(() => {
                        reader.abort();
                        reject(new Error(`File reading timed out after ${FILE_READ_TIMEOUT / 1000} seconds`));
                    }, FILE_READ_TIMEOUT);

                    reader.readAsDataURL(file);
                }),
        );

        const results = await Promise.allSettled(newImages);
        const images = /** @type {PromiseFulfilledResult<AttachedImage>[]} */ (results.filter((r) => r.status === 'fulfilled')).map(
            (r) => r.value,
        );

        if (images.length > 0) {
            setAttachedImages((prev) => {
                const cap = MAX_IMAGES - prev.length;
                if (cap <= 0) return prev;
                return [...prev, ...images.slice(0, cap)];
            });
        }

        input.value = '';
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
                console.error(`Dropping image "${img.fileName}": data URL does not match expected format`);
                continue;
            }
            /** @type {"jpeg" | "png"} */
            const format = img.mimeType === 'image/jpeg' ? 'jpeg' : 'png';
            result.push({ data: match[2], format });
        }
        return result.length > 0 ? result : undefined;
    };

    return {
        attachedImages,
        fileInputRef,
        handleFileChange,
        handleRemoveImage,
        clearAttachedImages,
        imageUploadDisabled,
        getImagesForSubmission,
    };
}
