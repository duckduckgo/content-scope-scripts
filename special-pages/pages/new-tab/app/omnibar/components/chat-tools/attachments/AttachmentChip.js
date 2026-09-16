import { h } from 'preact';
import { Tooltip } from '../../Tooltip.js';
import { ChipRemoveButton } from './ChipRemoveButton';
import styles from './AttachmentChip.module.css';

/**
 * @typedef {'tab' | 'file' | 'image'} AttachmentKind
 */

/**
 * The 108px attachment card shown above the AI chat prompt. Text chips render a
 * title, an optional metadata line and an icon + type row; image chips render a
 * full-bleed preview instead.
 *
 * @param {object} props
 * @param {AttachmentKind} props.attachmentKind - marker for tests and per-kind styling.
 * @param {import('preact').ComponentChildren} [props.imagePreview] - full-bleed preview; when set, the text rows are not rendered.
 * @param {import('preact').ComponentChildren} [props.icon] - leading 16px glyph in the info row.
 * @param {string} [props.title]
 * @param {string} [props.typeLabel] - attachment kind, e.g. "Webpage" or "PDF".
 * @param {string} [props.metadata] - extra line, e.g. domain or file size.
 * @param {string} [props.tooltipLabel] - hover preview; defaults to `title`.
 * @param {() => void} props.onRemove
 * @param {string} props.removeLabel
 * @param {number} [props.enteringAnimationDelay] - ms; staggers the pop-in across a row.
 */
export function AttachmentChip({
    attachmentKind,
    imagePreview,
    icon,
    title,
    typeLabel,
    metadata,
    tooltipLabel,
    onRemove,
    removeLabel,
    enteringAnimationDelay = 0,
}) {
    const tooltip = tooltipLabel ?? title ?? '';
    return (
        <div class={styles.listItem} data-attachment-kind={attachmentKind}>
            <span class={styles.enter} style={{ animationDelay: enteringAnimationDelay ? `${enteringAnimationDelay}ms` : undefined }}>
                <Tooltip content={tooltip} position="above" className={styles.tooltipContainer} ariaLabel={tooltip}>
                    <span class={styles.root}>
                        {imagePreview ? (
                            <span class={styles.imageFill}>{imagePreview}</span>
                        ) : (
                            <span class={styles.headerBand}>
                                <span class={styles.title}>{title}</span>
                            </span>
                        )}
                        {!imagePreview && metadata && <span class={styles.metadata}>{metadata}</span>}
                        {!imagePreview && (
                            <span class={styles.info}>
                                <span class={styles.iconSlot}>
                                    <span class={styles.icon}>{icon}</span>
                                </span>
                                <span class={styles.typeLabel}>{typeLabel}</span>
                            </span>
                        )}
                        <span class={styles.removeSlot}>
                            <ChipRemoveButton onRemove={onRemove} label={removeLabel} />
                        </span>
                    </span>
                </Tooltip>
            </span>
        </div>
    );
}
