/**
 * @typedef {typeof import('../../../strings.json')} Strings
 * @typedef {{ processFiles: (files: File[]) => Promise<void>, disabled: boolean }} ImageChannel
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
 * Resolve a picked file's effective MIME type against the allowed list, falling back to its
 * extension.
 *
 * @param {File} file
 * @param {string[]} allowList — MIME types the active model accepts.
 * @returns {string | null} the resolved MIME type, or null if the file is unsupported.
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
 * Collapses the optional image / file (PDF) channels into the config for the
 * single hidden `<input type="file">` rendered by {@link AttachMenu}:
 *   - `label` / `accept` reflect which of `image`/`file` are non-null.
 *   - `disabled` is true only when every enabled channel is disabled.
 *   - `onChange` partitions the picked files back to the right channel
 *     (anything `image/*` → image, everything else → file).
 *
 * @param {object} params
 * @param {(key: keyof Strings) => string} params.t
 * @param {ImageChannel | null} params.image - Pass null to omit the image route.
 * @param {FileChannel | null} params.file - Pass null to omit the file (PDF) route.
 * @returns {ResolvedFileInput}
 */
export function resolveFileInput({ t, image, file }) {
    const label =
        image && file ? t('omnibar_attachImageOrFileLabel') : image ? t('omnibar_attachImageLabel') : t('omnibar_attachFileLabel');
    const accept = [...(image ? [IMAGE_ACCEPT] : []), ...(file ? [buildFileAccept(file.mimeTypes)] : [])].filter(Boolean).join(',');
    const disabled = (image?.disabled ?? true) && (file?.disabled ?? true);

    /** @param {Event} event */
    const onChange = async (event) => {
        const input = /** @type {HTMLInputElement} */ (event.currentTarget);
        if (!input.files || input.files.length === 0) return;
        const all = Array.from(input.files);
        /** @type {Promise<void>[]} */
        const tasks = [];
        if (image) {
            const images = all.filter((file) => file.type.startsWith('image/'));
            if (images.length > 0) tasks.push(image.processFiles(images));
        }
        if (file) {
            const others = all.filter((file) => !file.type.startsWith('image/'));
            if (others.length > 0) tasks.push(file.processFiles(others));
        }
        await Promise.all(tasks);
        input.value = '';
    };

    return { label, accept, disabled, onChange };
}
