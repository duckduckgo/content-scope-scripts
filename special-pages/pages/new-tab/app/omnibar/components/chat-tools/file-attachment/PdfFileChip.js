import { h } from 'preact';
import { ChipRemoveButton } from '../attachments/ChipRemoveButton';
import { Tooltip } from '../../Tooltip.js';
import styles from './PdfFileChip.module.css';

/**
 * @typedef {import('./useFileAttachments').AttachedFile} AttachedFile
 */

/**
 * @param {object} props
 * @param {AttachedFile} props.file
 * @param {() => void} props.onRemove
 * @param {string} props.removeLabel
 */
export function PdfFileChip({ file, onRemove, removeLabel }) {
    return (
        <Tooltip content={file.fileName} position="above">
            <div class={styles.chipWrapper} data-attachment-kind="file">
                <span class={styles.card} aria-hidden="true">
                    <span class={styles.lines}>
                        <span class={styles.line} />
                        <span class={styles.line} />
                    </span>
                    <span class={styles.format}>PDF</span>
                </span>
                <ChipRemoveButton onRemove={onRemove} label={removeLabel} />
            </div>
        </Tooltip>
    );
}
