import { h } from 'preact';
import { PdfFileChip } from './PdfFileChip';

/**
 * @typedef {import('./useFileAttachments').AttachedFile} AttachedFile
 */

/**
 * @param {object} props
 * @param {AttachedFile} props.file
 * @param {() => void} props.onRemove
 * @param {string} props.removeLabel
 * @param {number} [props.enteringAnimationDelay]
 */
export function FileChip({ file, onRemove, removeLabel, enteringAnimationDelay }) {
    switch (file.mimeType) {
        case 'application/pdf':
            return (
                <PdfFileChip file={file} onRemove={onRemove} removeLabel={removeLabel} enteringAnimationDelay={enteringAnimationDelay} />
            );
        default:
            return null;
    }
}
