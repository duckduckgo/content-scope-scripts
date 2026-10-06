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
 * Screenshot capture for the Duck.ai prompt: requests a capture with `omnibar_captureScreenshot`
 * and attaches the returned image through the regular image pipeline.
 *
 * @param {object} params
 * @param {ImageAttachmentState} params.imageState
 */
export function useScreenshotCapture({ imageState }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const ntp = useMessaging();
    const { captureScreenshot } = useContext(OmnibarContext);
    const [captureError, setCaptureError] = useState(false);
    const [capturing, setCapturing] = useState(false);

    // A capture request can stay pending for as long as the user takes; read the image state as
    // it is when the reply arrives, not as it was when the capture started.
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
            // The page only shows the message; it sends no telemetry for `error` replies.
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

    return {
        capture,
        capturing,
        captureError,
        clearCaptureError: () => setCaptureError(false),
    };
}
