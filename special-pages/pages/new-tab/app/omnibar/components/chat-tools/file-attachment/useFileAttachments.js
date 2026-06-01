import { useState } from 'preact/hooks';

/**
 * @typedef {{ data: string, fileName: string, mimeType: string }} AttachedFile
 */

export const MAX_FILES = 3;
const FILE_READ_TIMEOUT = 30000;

/**
 * @param {string[] | undefined} supportedFileTypes — MIME types the active model accepts.
 */
export function useFileAttachments(supportedFileTypes) {
    const [attachedFiles, setAttachedFiles] = useState(/** @type {AttachedFile[]} */ ([]));

    const allowList = supportedFileTypes ?? [];
    const allowListKey = allowList.join('|');

    // Drop attachments whose MIME isn't in the current model's allow-list.
    // In-render reset (React's sync-state-from-props pattern) so the
    // submitted set always matches the active model.
    const [prevAllowListKey, setPrevAllowListKey] = useState(allowListKey);
    if (prevAllowListKey !== allowListKey) {
        setPrevAllowListKey(allowListKey);
        setAttachedFiles((prev) => prev.filter((f) => allowList.includes(f.mimeType)));
    }

    const fileUploadDisabled = attachedFiles.length >= MAX_FILES || allowList.length === 0;

    const clearAttachedFiles = () => setAttachedFiles([]);

    /** @type {(files: File[]) => Promise<void>} */
    const processFiles = async (files) => {
        if (files.length === 0) return;

        const existingNames = new Set(attachedFiles.map((f) => f.fileName));
        const validFiles = files.filter((file) => allowList.includes(file.type) && !existingNames.has(file.name));
        if (validFiles.length === 0) return;

        const remaining = MAX_FILES - attachedFiles.length;
        const toRead = remaining > 0 ? validFiles.slice(0, remaining) : [];
        if (toRead.length === 0) return;

        const results = await Promise.allSettled(toRead.map(readFileAsBase64));
        const ok = /** @type {PromiseFulfilledResult<AttachedFile>[]} */ (results.filter((r) => r.status === 'fulfilled')).map(
            (r) => r.value,
        );

        if (ok.length > 0) {
            setAttachedFiles((prev) => [...prev, ...ok]);
        }
    };

    /** @param {number} index */
    const handleRemoveFile = (index) => {
        setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    /** @returns {AttachedFile[] | undefined} */
    const getFilesForSubmission = () => (attachedFiles.length > 0 ? attachedFiles : undefined);

    return {
        attachedFiles,
        processFiles,
        handleRemoveFile,
        clearAttachedFiles,
        fileUploadDisabled,
        getFilesForSubmission,
    };
}

/**
 * @param {File} file
 * @returns {Promise<AttachedFile>}
 */
function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        const timeoutId = setTimeout(() => {
            reader.abort();
            reject(new Error(`File reading timed out after ${FILE_READ_TIMEOUT / 1000} seconds`));
        }, FILE_READ_TIMEOUT);

        reader.onload = () => {
            clearTimeout(timeoutId);
            const result = /** @type {string} */ (reader.result);
            const commaIndex = result.indexOf(',');
            if (commaIndex < 0) {
                reject(new Error('FileReader returned unexpected output'));
                return;
            }
            resolve({ data: result.slice(commaIndex + 1), fileName: file.name, mimeType: file.type });
        };

        reader.onerror = () => {
            clearTimeout(timeoutId);
            reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(file);
    });
}
