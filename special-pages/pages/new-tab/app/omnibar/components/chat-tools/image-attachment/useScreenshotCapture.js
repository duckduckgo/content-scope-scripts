import { useContext, useRef, useState } from 'preact/hooks';
import { useMessaging, useTypedTranslationWith } from '../../../../types.js';
import { OmnibarContext } from '../../OmnibarProvider';
import { SCREENSHOT_MAX_DIMENSION } from './useImageAttachments';
import { uniqueFileName } from './uniqueFileName';

/**
 * @typedef {typeof import('../../../strings.json')} Strings
 * @typedef {import('../../../../../types/new-tab.js').ScreenshotMode} ScreenshotMode
 * @typedef {import('../../../../../types/new-tab.js').CapturedScreenshot} CapturedScreenshot
 * @typedef {import('./useImageAttachments.js').ImageAttachmentState} ImageAttachmentState
 */

/**
 * Chromium's name for a bitmap pasted from the clipboard (as opposed to a copied file, which keeps its own name).
 */
const CLIPBOARD_BITMAP_NAME = 'image.png';

/**
 * @param {CapturedScreenshot} image
 * @param {string} fileName
 * @returns {File}
 */
function screenshotToFile(image, fileName) {
    const binary = atob(image.data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new File([bytes], fileName, { type: `image/${image.format}` });
}

/** @param {CapturedScreenshot['format']} format */
const extensionFor = (format) => (format === 'jpeg' ? '.jpg' : '.png');

/**
 * Screenshot capture (native acquires, the page attaches) and clipboard paste intake for the
 * Duck.ai prompt. Both feed the regular image and file attachment pipelines.
 *
 * @param {object} params
 * @param {ImageAttachmentState} params.imageState
 * @param {boolean} params.canAttachImages
 * @param {((files: File[]) => Promise<void>) | null} params.processOtherFiles - the file channel (PDFs), or null when files can't be attached.
 * @param {boolean} params.pasteEnabled - `enablePastedAttachments` from native config.
 */
export function useScreenshotCapture({ imageState, canAttachImages, processOtherFiles, pasteEnabled }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const ntp = useMessaging();
    const { captureScreenshot } = useContext(OmnibarContext);
    const [captureError, setCaptureError] = useState(false);
    const [capturing, setCapturing] = useState(false);

    // A capture can stay pending for as long as the user is in the native picker; read the image
    // state as it is when the reply arrives, not as it was when the capture started.
    const imageStateRef = useRef(imageState);
    imageStateRef.current = imageState;

    const takenNames = () => new Set(imageStateRef.current.attachedImages.map((img) => img.fileName));

    /** @param {ScreenshotMode} mode */
    const capture = async (mode) => {
        if (capturing) return;
        setCaptureError(false);
        setCapturing(true);
        try {
            /** @type {import('../../../../../types/new-tab.js').CaptureScreenshotResponse} */
            let response;
            try {
                response = await captureScreenshot(mode);
            } catch (err) {
                console.warn('omnibar_captureScreenshot failed', err);
                setCaptureError(true);
                return;
            }
            // Native reports its own capture failures; the page only shows the message.
            if (response.error) {
                setCaptureError(true);
                return;
            }
            if (!response.image) return; // cancelled

            const { image } = response;
            /** @type {File} */
            let file;
            try {
                file = screenshotToFile(image, uniqueFileName(t('omnibar_screenshotFileName'), extensionFor(image.format), takenNames()));
            } catch (err) {
                console.warn('Screenshot rejected: invalid image data');
                ntp.telemetryEvent({ attributes: { name: 'omnibar_screenshot_failed', value: { reason: 'failed' } } });
                setCaptureError(true);
                return;
            }
            const result = await imageStateRef.current.processFiles([file], {
                maxDimension: SCREENSHOT_MAX_DIMENSION,
                source: 'screenshot',
            });
            if (result.added > 0) {
                ntp.telemetryEvent({ attributes: { name: 'omnibar_screenshot_taken', value: { kind: image.kind } } });
            } else if (result.rejected > 0) {
                ntp.telemetryEvent({ attributes: { name: 'omnibar_screenshot_failed', value: { reason: 'failed' } } });
            }
        } finally {
            setCapturing(false);
        }
    };

    /**
     * Attaches copied images and files on paste. Clipboard text wins: when there is any, the
     * default text paste runs and bitmaps are ignored (Office copies put a picture of the cells
     * next to the text). A pasted bitmap keeps screenshot resolution; copied image files are
     * resized like picked ones.
     *
     * @param {ClipboardEvent} event
     */
    const handlePaste = (event) => {
        if (!pasteEnabled) return;
        const data = event.clipboardData;
        if (!data || data.getData('text/plain')) return;

        /** @type {File[]} */
        let files = Array.from(data.files ?? []);
        if (files.length === 0) {
            files = Array.from(data.items ?? [])
                .filter((item) => item.kind === 'file')
                .map((item) => item.getAsFile())
                .filter((file) => file !== null);
        }

        const images = canAttachImages ? files.filter((file) => file.type.startsWith('image/')) : [];
        const others = processOtherFiles ? files.filter((file) => !file.type.startsWith('image/')) : [];
        if (images.length === 0 && others.length === 0) return;
        event.preventDefault();

        const bitmaps = images.filter((file) => file.name === CLIPBOARD_BITMAP_NAME);
        const copiedImages = images.filter((file) => file.name !== CLIPBOARD_BITMAP_NAME);
        const taken = takenNames();
        const namedBitmaps = bitmaps.map((file) => {
            const name = uniqueFileName(t('omnibar_pastedImageFileName'), '.png', taken);
            taken.add(name);
            return new File([file], name, { type: file.type });
        });

        attachPasted({ bitmaps: namedBitmaps, copiedImages, others });
    };

    /**
     * @param {{ bitmaps: File[], copiedImages: File[], others: File[] }} pasted
     */
    const attachPasted = async ({ bitmaps, copiedImages, others }) => {
        const { processFiles } = imageStateRef.current;
        /** @type {Promise<unknown>[]} */
        const tasks = [];
        if (bitmaps.length > 0) tasks.push(processFiles(bitmaps, { maxDimension: SCREENSHOT_MAX_DIMENSION, source: 'paste' }));
        if (copiedImages.length > 0) tasks.push(processFiles(copiedImages, { source: 'paste' }));
        if (others.length > 0 && processOtherFiles) tasks.push(processOtherFiles(others));
        try {
            await Promise.all(tasks);
        } catch (err) {
            console.warn('Pasted attachment failed', err);
        }
    };

    return {
        capture,
        capturing,
        captureError,
        clearCaptureError: () => setCaptureError(false),
        handlePaste,
    };
}
