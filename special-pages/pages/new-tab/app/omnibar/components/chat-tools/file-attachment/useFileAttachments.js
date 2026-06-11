import { useState } from 'preact/hooks';
import { FileAttachments } from '../../PersistentOmnibarValuesProvider';
import { resolveFileMimeType } from '../tab-attachment/fileChannels';

const { useStateWithLocalPersistence } = FileAttachments;

/**
 * `addedAtRelative` is a `performance.now()` value used only to sort attachments into the
 * order the user attached them; it's relative and monotonic, not a wall-clock timestamp.
 * @typedef {{ data: string, fileName: string, mimeType: string, addedAtRelative: number }} AttachedFile
 */

export const MAX_FILES = 3;
const FILE_READ_TIMEOUT = 30000;

/**
 * @param {string[] | undefined} supportedFileTypes — MIME types the active model accepts.
 * @param {string|null|undefined} [tabId] - The NTP tab these attachments belong to. Used to persist
 * them per-tab so they survive switching between browser tabs (see `PersistentAttachmentsProvider`).
 */
export function useFileAttachments(supportedFileTypes, tabId) {
    const [attachedFiles, setAttachedFiles] = useStateWithLocalPersistence(tabId);

    const allowList = supportedFileTypes ?? [];
    const allowListKey = allowList.join('|');

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

        const existingNames = new Set(attachedFiles.map((file) => file.fileName));
        const validFiles = files
            .map((file) => ({ file, mimeType: resolveFileMimeType(file, allowList) }))
            .filter(({ file, mimeType }) => mimeType !== null && !existingNames.has(file.name));
        if (validFiles.length === 0) return;

        const remaining = MAX_FILES - attachedFiles.length;
        const toRead = remaining > 0 ? validFiles.slice(0, remaining) : [];
        if (toRead.length === 0) return;

        const results = await Promise.allSettled(
            toRead.map(({ file, mimeType }) => readFileAsBase64(file, /** @type {string} */ (mimeType))),
        );
        const ok = /** @type {PromiseFulfilledResult<Omit<AttachedFile, 'addedAtRelative'>>[]} */ (
            results.filter((r) => r.status === 'fulfilled')
        ).map((r) => r.value);

        if (ok.length > 0) {
            const addedAtRelative = performance.now();
            setAttachedFiles((prev) => [...prev, ...ok.map((file) => ({ ...file, addedAtRelative }))]);
        }
    };

    /** @param {number} index */
    const handleRemoveFile = (index) => {
        setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    /** @returns {Omit<AttachedFile, 'addedAtRelative'>[] | undefined} */
    const getFilesForSubmission = () => {
        if (attachedFiles.length === 0) return undefined;
        return attachedFiles.map(({ data, fileName, mimeType }) => ({ data, fileName, mimeType }));
    };

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
 * @param {string} mimeType — Resolved MIME type for the outgoing payload, normalized so an empty
 * `File.type` from WebKit pickers doesn't leak through.
 * @returns {Promise<Omit<AttachedFile, 'addedAtRelative'>>}
 */
function readFileAsBase64(file, mimeType) {
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
            resolve({ data: result.slice(commaIndex + 1), fileName: file.name, mimeType });
        };

        reader.onerror = () => {
            clearTimeout(timeoutId);
            reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(file);
    });
}
