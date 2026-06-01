import { h } from 'preact';
import { CloseSmallIcon } from '../../../../components/Icons';
import { Tooltip } from '../../Tooltip.js';
import styles from './PdfFileChip.module.css';

/**
 * @typedef {import('./useFileAttachments').AttachedFile} AttachedFile
 */

/**
 * Card-style chip matching the Figma file-attachment design — two grey
 * "document lines" stacked above an orange "PDF" label. v1 only supports PDF
 * attachments, so the label is hardcoded and the component is named for it;
 * rename/generalise once other file types are supported.
 * Hover/focus surfaces the filename via tooltip. Rendered by the shared
 * `AttachmentChips` container, which owns the row layout.
 *
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
