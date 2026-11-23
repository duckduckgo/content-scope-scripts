import { h } from 'preact';
import { DocumentPdfColorIcon } from '../../../../components/Icons';
import { AttachmentChip } from '../attachments/AttachmentChip';
import { base64ByteLength, formatFileSize, splitFileName } from '../attachments/attachmentText';

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
export function PdfFileChip({ file, onRemove, removeLabel, enteringAnimationDelay }) {
    return (
        <AttachmentChip
            attachmentKind="file"
            icon={<DocumentPdfColorIcon width={16} height={16} aria-hidden="true" />}
            title={splitFileName(file.fileName).stem}
            typeLabel="PDF"
            metadata={formatFileSize(base64ByteLength(file.data))}
            tooltipLabel={file.fileName}
            onRemove={onRemove}
            removeLabel={removeLabel}
            enteringAnimationDelay={enteringAnimationDelay}
        />
    );
}
