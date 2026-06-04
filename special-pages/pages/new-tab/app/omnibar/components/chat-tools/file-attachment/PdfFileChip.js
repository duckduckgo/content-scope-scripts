import { h } from 'preact';
import { CloseSmallIcon } from '../../../../components/Icons';
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
                <button type="button" tabIndex={0} class={styles.remove} aria-label={removeLabel} onClick={onRemove}>
                    <CloseSmallIcon width="10" height="10" style="stroke: currentColor; stroke-width: 1px;" />
                </button>
            </div>
        </Tooltip>
    );
}
