import { h } from 'preact';
import { PdfFileChip } from './PdfFileChip';

/**
 * @typedef {import('./useFileAttachments').AttachedFile} AttachedFile
 */

/**
 * Picks the chip representation for an attached file based on its MIME type.
 * Today only PDFs have a chip; any other type renders nothing. Add a case here
 * as each new file type gains its own chip.
 *
 * @param {object} props
 * @param {AttachedFile} props.file
 * @param {() => void} props.onRemove
 * @param {string} props.removeLabel
 */
export function FileChip({ file, onRemove, removeLabel }) {
    switch (file.mimeType) {
        case 'application/pdf':
            return <PdfFileChip file={file} onRemove={onRemove} removeLabel={removeLabel} />;
        default:
            return null;
    }
}
