import { useTypedTranslationWith } from '../../../../types.js';
import { SCREENSHOT_MAX_DIMENSION } from './useImageAttachments';
import { uniqueFileName } from './uniqueFileName';

/**
 * @typedef {typeof import('../../../strings.json')} Strings
 * @typedef {import('./useImageAttachments.js').ImageAttachmentState} ImageAttachmentState
 */

/**
 * Chromium's name for a bitmap pasted from the clipboard (as opposed to a copied file, which keeps its own name).
 */
const CLIPBOARD_BITMAP_NAME = 'image.png';

/**
 * Clipboard paste intake for the Duck.ai prompt: copied images and files go through the regular
 * image and file attachment pipelines.
 *
 * @param {object} params
 * @param {ImageAttachmentState} params.imageState
 * @param {boolean} params.canAttachImages
 * @param {((files: File[]) => Promise<void>) | null} params.processOtherFiles - the file channel (PDFs), or null when files can't be attached.
 * @param {boolean} params.enabled - `enablePastedAttachments` from native config.
 */
export function usePastedAttachments({ imageState, canAttachImages, processOtherFiles, enabled }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));

    /**
     * @param {{ bitmaps: File[], copiedImages: File[], others: File[] }} pasted
     */
    const attachPasted = async ({ bitmaps, copiedImages, others }) => {
        /** @type {Promise<unknown>[]} */
        const tasks = [];
        if (bitmaps.length > 0) tasks.push(imageState.processFiles(bitmaps, { maxDimension: SCREENSHOT_MAX_DIMENSION, source: 'paste' }));
        if (copiedImages.length > 0) tasks.push(imageState.processFiles(copiedImages, { source: 'paste' }));
        if (others.length > 0 && processOtherFiles) tasks.push(processOtherFiles(others));
        try {
            await Promise.all(tasks);
        } catch (err) {
            console.warn('Pasted attachment failed', err);
        }
    };

    /**
     * Attaches copied images and files on paste. Clipboard text wins: when there is any, the
     * default text paste runs and bitmaps are ignored (Office copies put a picture of the cells
     * next to the text). A pasted bitmap keeps up to {@link SCREENSHOT_MAX_DIMENSION}; copied
     * image files are resized like picked ones.
     *
     * @param {ClipboardEvent} event
     */
    const handlePaste = (event) => {
        if (!enabled) return;
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

        // The image list drops duplicate names, so repeated bitmap pastes get numbered names.
        const taken = new Set(imageState.attachedImages.map((img) => img.fileName));
        const bitmaps = images
            .filter((file) => file.name === CLIPBOARD_BITMAP_NAME)
            .map((file) => {
                const name = uniqueFileName(t('omnibar_pastedImageFileName'), '.png', taken);
                taken.add(name);
                return new File([file], name, { type: file.type });
            });
        const copiedImages = images.filter((file) => file.name !== CLIPBOARD_BITMAP_NAME);

        attachPasted({ bitmaps, copiedImages, others });
    };

    return { handlePaste };
}
