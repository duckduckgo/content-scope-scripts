import { h } from 'preact';
import { CloseSmallIcon } from '../../../../components/Icons';
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
            <button
                type="button"
                tabIndex={0}
                class={styles.thumbnailRemove}
                aria-label={removeLabel}
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                }}
            >
                <CloseSmallIcon width="10" height="10" style="stroke: currentColor; stroke-width: 1px;" />
            </button>
        </div>
    );
}
