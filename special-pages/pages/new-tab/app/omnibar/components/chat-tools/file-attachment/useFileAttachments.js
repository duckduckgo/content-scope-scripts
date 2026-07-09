import { useState } from 'preact/hooks';
import { FileAttachments } from '../../PersistentOmnibarValuesProvider';
import { resolveFileMimeType } from '../tab-attachment/fileChannels';
import { FILE_READ_TIMEOUT, readFileAsDataUrl } from '../attachments/readFileAsDataUrl';

const { useStateWithLocalPersistence } = FileAttachments;

/**
 * `addedAtRelative` is a `performance.now()` value used to sort attachments by attach order.
 * @typedef {{ data: string, fileName: string, mimeType: string, addedAtRelative: number }} AttachedFile
 * @typedef {'fileTooLarge'} FileErrorType
 * @typedef {{ type: FileErrorType, fileNames: string[] }} FileError
 */

export const MAX_FILES = 3;

const BYTES_PER_MB = 1024 * 1024;

/**
 * @param {object} params
 * @param {string[]} [params.supportedFileTypes] - MIME types the active model accepts.
 * @param {string|null|undefined} [params.tabId] - NTP tab the attachments are persisted under.
 * @param {number} [params.maxFiles] - Max file attachments, from backend `attachmentLimits`. Defaults to {@link MAX_FILES}.
 * @param {number} [params.maxFileSizeMB] - Max size of a single file in MB, from backend `attachmentLimits`. Omitted means no size cap.
 */
export function useFileAttachments({ supportedFileTypes, tabId, maxFiles = MAX_FILES, maxFileSizeMB } = {}) {
    const [attachedFiles, setAttachedFiles] = useStateWithLocalPersistence(tabId);
    const [fileError, setFileError] = useState(/** @type {FileError|null} */ (null));

    const allowList = supportedFileTypes ?? [];
    const allowListKey = allowList.join('|');

    const [prevAllowListKey, setPrevAllowListKey] = useState(allowListKey);
    if (prevAllowListKey !== allowListKey) {
        setPrevAllowListKey(allowListKey);
        setAttachedFiles((prev) => prev.filter((f) => allowList.includes(f.mimeType)));
    }

    // No hard cap on adding files; exceeding maxFiles warns and blocks submit until removed.
    const fileUploadDisabled = allowList.length === 0;
    const fileLimitExceeded = attachedFiles.length > maxFiles;

    const clearAttachedFiles = () => setAttachedFiles([]);
    const clearFileError = () => setFileError(null);

    /** @type {(files: File[]) => Promise<void>} */
    const processFiles = async (files) => {
        if (files.length === 0) return;
        setFileError(null);

        const existingNames = new Set(attachedFiles.map((file) => file.fileName));
        const candidates = files
            .map((file) => ({ file, mimeType: resolveFileMimeType(file, allowList) }))
            .filter(({ file, mimeType }) => mimeType !== null && !existingNames.has(file.name));
        if (candidates.length === 0) return;

        // Reject files larger than the backend-configured per-file size cap (when present).
        const maxBytes = maxFileSizeMB != null ? maxFileSizeMB * BYTES_PER_MB : null;
        /** @type {string[]} */
        const tooLargeNames = [];
        const validFiles = candidates.filter(({ file }) => {
            if (maxBytes != null && file.size > maxBytes) {
                tooLargeNames.push(file.name);
                return false;
            }
            return true;
        });
        if (tooLargeNames.length > 0) {
            setFileError({ type: 'fileTooLarge', fileNames: tooLargeNames });
        }
        if (validFiles.length === 0) return;

        const results = await Promise.allSettled(
            validFiles.map(({ file, mimeType }) => readFileAsBase64(file, /** @type {string} */ (mimeType))),
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
        fileLimitExceeded,
        getFilesForSubmission,
        fileError,
        clearFileError,
        maxFiles,
        maxFileSizeMB,
    };
}

/**
 * @param {File} file
 * @param {string} mimeType — normalized so an empty WebKit `File.type` doesn't leak through.
 * @returns {Promise<Omit<AttachedFile, 'addedAtRelative'>>}
 */
async function readFileAsBase64(file, mimeType) {
    const result = await readFileAsDataUrl(file, FILE_READ_TIMEOUT);
    const commaIndex = result.indexOf(',');
    if (commaIndex < 0) {
        throw new Error('FileReader returned unexpected output');
    }
    return { data: result.slice(commaIndex + 1), fileName: file.name, mimeType };
}
