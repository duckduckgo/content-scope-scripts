import { h } from 'preact';
import cn from 'classnames';
import { Tooltip } from '../../Tooltip.js';
import { ChipRemoveButton } from './ChipRemoveButton';
import styles from './AttachmentChip.module.css';

/**
 * @typedef {'tab' | 'file' | 'image' | 'text'} AttachmentKind
 */

/**
 * The 116px square attachment card shown above the AI chat prompt. Text chips render a
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
 * @param {boolean} [props.metadataInvalid] - shows the metadata line in the error colour.
 * @param {string} [props.tooltipLabel] - hover preview; defaults to `title`.
 * @param {() => void} props.onRemove
 * @param {string} props.removeLabel
 * @param {number} [props.enteringAnimationDelay] - ms; staggers the pop-in across a row.
 * @param {() => void} [props.onOpen] - click, Enter or Space on the chip (not its remove button) opens it.
 */
export function AttachmentChip({
    attachmentKind,
    imagePreview,
    icon,
    title,
    typeLabel,
    metadata,
    metadataInvalid = false,
    tooltipLabel,
    onRemove,
    removeLabel,
    enteringAnimationDelay = 0,
    onOpen,
}) {
    const tooltip = tooltipLabel || title || '';
    return (
        <div class={styles.listItem} data-attachment-kind={attachmentKind}>
            <span
                class={cn(styles.enter, onOpen && styles.openable)}
                style={{ animationDelay: enteringAnimationDelay ? `${enteringAnimationDelay}ms` : undefined }}
                // The Tooltip wrapper is the chip's focusable button; the remove button stops its own clicks.
                onClick={onOpen}
                onKeyDown={(e) => {
                    if (!onOpen || e.target instanceof HTMLButtonElement) return;
                    if (e.key === 'Enter' || e.key === ' ') onOpen();
                }}
            >
                <Tooltip content={tooltip} position="above" className={styles.tooltipContainer} ariaLabel={tooltip}>
                    <span class={styles.root}>
                        {imagePreview ? (
                            <span class={styles.imageFill}>{imagePreview}</span>
                        ) : (
                            <span class={styles.headerBand}>
                                <span class={styles.title}>{title}</span>
                            </span>
                        )}
                        {!imagePreview && metadata && (
                            <span
                                class={cn(styles.metadata, metadataInvalid && styles.metadataInvalid)}
                                data-invalid={metadataInvalid || undefined}
                            >
                                {metadata}
                            </span>
                        )}
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
