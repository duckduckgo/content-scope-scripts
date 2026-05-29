import { h } from 'preact';
import { useTypedTranslationWith } from '../../../../types';
import { CloseSmallIcon } from '../../../../components/Icons';
import { Tooltip } from '../../Tooltip.js';
import styles from './FileChips.module.css';

/**
 * @typedef {typeof import('../../../strings.json')} Strings
 * @typedef {import('./useFileAttachments').AttachedFile} AttachedFile
 */

/**
 * Renders the row of chips for attached files above the AI chat toolbar.
 * Empty arrays render nothing — the caller should still mount the component
 * so the area can fade in/out without layout jumps.
 *
 * @param {object} props
 * @param {AttachedFile[]} props.attachedFiles
 * @param {(index: number) => void} props.onRemove
 */
export function FileChips({ attachedFiles, onRemove }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    if (attachedFiles.length === 0) return null;

    return (
        <div class={styles.chipsArea} data-testid="omnibar-file-chips">
            {attachedFiles.map((file, index) => (
                <FileChip
                    key={`${file.fileName}-${index}`}
                    file={file}
                    onRemove={() => onRemove(index)}
                    removeLabel={t('omnibar_removeAttachedFileLabel', { fileName: file.fileName })}
                />
            ))}
        </div>
    );
}

/**
 * Card-style chip matching the Figma file-attachment design — two grey
 * "document lines" stacked above an orange format label (e.g. "PDF").
 * Hover/focus surfaces the filename via tooltip.
 *
 * @param {object} props
 * @param {AttachedFile} props.file
 * @param {() => void} props.onRemove
 * @param {string} props.removeLabel
 */
function FileChip({ file, onRemove, removeLabel }) {
    const formatLabel = formatLabelFor(file.mimeType);

    return (
        <Tooltip content={file.fileName} position="above">
            <div class={styles.chipWrapper}>
                <span class={styles.card} aria-hidden="true">
                    <span class={styles.lines}>
                        <span class={styles.line} />
                        <span class={styles.line} />
                    </span>
                    <span class={styles.format}>{formatLabel}</span>
                </span>
                <button type="button" tabIndex={0} class={styles.remove} aria-label={removeLabel} onClick={onRemove}>
                    <CloseSmallIcon width="10" height="10" style="stroke: currentColor; stroke-width: 1px;" />
                </button>
            </div>
        </Tooltip>
    );
}

/**
 * Maps a file MIME type to the badge label rendered on the chip. v1 only ships
 * `application/pdf`; anything else falls back to the subtype (uppercased) so
 * future types (e.g. `text/plain` → `PLAIN`) render sensibly without a code
 * change.
 *
 * @param {string} mimeType
 */
function formatLabelFor(mimeType) {
    if (mimeType === 'application/pdf') return 'PDF';
    const subtype = mimeType.split('/')[1] ?? mimeType;
    return subtype.toUpperCase();
}
