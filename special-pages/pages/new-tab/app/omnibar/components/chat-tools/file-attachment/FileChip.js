import { h } from 'preact';
import { PdfFileChip } from './PdfFileChip';

/**
 * @typedef {import('./useFileAttachments').AttachedFile} AttachedFile
 */

/**
 * Picks the chip representation for an attached file
 *
 * @param {object} props
 * @param {AttachedFile} props.file
 * @param {() => void} props.onRemove
 * @param {string} props.removeLabel
 */
export function FileChip({ file, onRemove, removeLabel }) {
    console.log('[attach-debug] FileChip render', { fileName: file.fileName, mimeType: file.mimeType }); // [DEBUG_LOG]
    switch (file.mimeType) {
        case 'application/pdf':
            return <PdfFileChip file={file} onRemove={onRemove} removeLabel={removeLabel} />;
        default:
            console.log('[attach-debug] FileChip no chip for mimeType', file.mimeType); // [DEBUG_LOG]
            return null;
    }
}
