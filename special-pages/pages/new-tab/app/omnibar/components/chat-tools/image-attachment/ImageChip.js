import { h } from 'preact';
import { ChipRemoveButton } from '../attachments/ChipRemoveButton';
import styles from './ImageAttachment.module.css';

/**
 * @typedef {import('./useImageAttachments').AttachedImage} AttachedImage
 */

/**
 * @param {object} props
 * @param {AttachedImage} props.image
 * @param {() => void} props.onRemove
 * @param {string} props.removeLabel
 */
export function ImageChip({ image, onRemove, removeLabel }) {
    return (
        <div class={styles.thumbnailWrapper} data-attachment-kind="image">
            <img src={image.dataUrl} alt="" class={styles.thumbnail} />
            <ChipRemoveButton onRemove={onRemove} label={removeLabel} stopPropagation />
        </div>
    );
}
