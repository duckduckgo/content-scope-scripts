/**
 * @typedef {typeof import('../../../strings.json')} Strings
 * @typedef {{ processFiles: (files: File[]) => Promise<unknown>, disabled: boolean, maxImages: number }} ImageChannel
 * @typedef {{ processFiles: (files: File[]) => Promise<void>, disabled: boolean, mimeTypes: string[] }} FileChannel
 * @typedef {{ label: string, accept: string, disabled: boolean, onChange: (event: Event) => Promise<void> }} ResolvedFileInput
 */

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';

/**
 * @type {Record<string, string[]>}
 */
const FILE_EXTENSIONS = {
    'application/pdf': ['.pdf'],
};

/**
 * @param {string[]} mimeTypes
 * @returns {string}
 */
function buildFileAccept(mimeTypes) {
    return mimeTypes.flatMap((mime) => [mime, ...(FILE_EXTENSIONS[mime] ?? [])]).join(',');
}

/**
 * Resolves a file's MIME type against the allow-list, falling back to its extension.
 *
 * @param {File} file
 * @param {string[]} allowList
 * @returns {string | null} resolved MIME type, or null if unsupported.
 */
export function resolveFileMimeType(file, allowList) {
    if (allowList.includes(file.type)) return file.type;

    const lowerName = file.name.toLowerCase();
    for (const mime of allowList) {
        if ((FILE_EXTENSIONS[mime] ?? []).some((ext) => lowerName.endsWith(ext))) return mime;
    }
    return null;
}

/**
 * @param {(key: keyof Strings) => string} t
 * @param {ImageChannel | null} image
 * @param {FileChannel | null} file
 * @returns {string}
 */
function resolveFileInputLabel(t, image, file) {
    if (image && file) return t('omnibar_attachImageOrFileLabel');
    if (image) return t('omnibar_attachImageLabel');
    return t('omnibar_attachFileLabel');
}

/**
 * Collapses the optional image / file channels into config for one hidden file input;
 * `onChange` routes `image/*` files to the image channel and the rest to the file channel.
 *
 * @param {object} params
 * @param {(key: keyof Strings) => string} params.t
 * @param {ImageChannel | null} params.image
 * @param {FileChannel | null} params.file
 * @returns {ResolvedFileInput}
 */
export function resolveFileInput({ t, image, file }) {
    const label = resolveFileInputLabel(t, image, file);

    const accept = [...(image ? [IMAGE_ACCEPT] : []), ...(file ? [buildFileAccept(file.mimeTypes)] : [])].filter(Boolean).join(',');

    const disabled = (image?.disabled ?? true) && (file?.disabled ?? true);

    /** @param {Event} event */
    const onChange = async (event) => {
        const input = /** @type {HTMLInputElement} */ (event.currentTarget);
        if (!input.files || input.files.length === 0) return;
        await routeFiles(Array.from(input.files), image?.processFiles ?? null, file?.processFiles ?? null);
        input.value = '';
    };

    return { label, accept, disabled, onChange };
}

/**
 * Sends `image/*` files to `processImages` and the rest to `processOtherFiles`. Files whose channel is null are ignored.
 *
 * @param {File[]} files
 * @param {((files: File[]) => Promise<unknown>) | null} processImages
 * @param {((files: File[]) => Promise<unknown>) | null} processOtherFiles
 */
export async function routeFiles(files, processImages, processOtherFiles) {
    const images = files.filter((file) => file.type.startsWith('image/'));
    const others = files.filter((file) => !file.type.startsWith('image/'));
    /** @type {Promise<unknown>[]} */
    const tasks = [];
    if (processImages && images.length > 0) tasks.push(processImages(images));
    if (processOtherFiles && others.length > 0) tasks.push(processOtherFiles(others));
    await Promise.all(tasks);
}
