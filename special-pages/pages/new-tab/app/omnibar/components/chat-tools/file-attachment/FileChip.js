import { h } from 'preact';
import { PdfFileChip } from './PdfFileChip';

/**
 * @typedef {import('./useFileAttachments').AttachedFile} AttachedFile
 * @typedef {import('../attachments/AttachmentChips').ChipItem} ChipItem
 */

/**
 * @param {AttachedFile[]} files
 * @param {(index: number) => void} onRemove
 * @param {(key: string, params?: Record<string, string>) => string} t
 * @returns {ChipItem[]}
 */
export function fileChipItems(files, onRemove, t) {
    return files.map((file, index) => ({
        key: `file-${file.fileName}-${index}`,
        addedAtRelative: file.addedAtRelative,
        render: (enteringAnimationDelay) => (
            <FileChip
                file={file}
                onRemove={() => onRemove(index)}
                removeLabel={t('omnibar_removeAttachedFileLabel', { fileName: file.fileName })}
                enteringAnimationDelay={enteringAnimationDelay}
            />
        ),
    }));
}

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
