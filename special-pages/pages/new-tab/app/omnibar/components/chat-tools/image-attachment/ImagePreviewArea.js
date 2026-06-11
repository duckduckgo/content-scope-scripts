import { h } from 'preact';
import { CloseSmallIcon } from '../../../../components/Icons';
import styles from './ImageAttachment.module.css';

/**
 * @param {object} props
 * @param {import('./useImageAttachments').AttachedImage[]} props.images
 * @param {(index: number) => void} props.onRemove
 * @param {string} props.removeLabel
 */
export function ImagePreviewArea({ images, onRemove, removeLabel }) {
    if (images.length === 0) return null;

    return (
        <div class={styles.imagePreviewArea}>
            {images.map((img, index) => (
                <div key={`${img.fileName}-${index}`} class={styles.thumbnailWrapper}>
                    <img src={img.dataUrl} alt="" class={styles.thumbnail} />
                    <button
                        type="button"
                        class={styles.thumbnailRemove}
                        aria-label={removeLabel}
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(index);
                        }}
                    >
                        <CloseSmallIcon width="10" height="10" style="stroke: currentColor; stroke-width: 1px;" />
                    </button>
                </div>
            ))}
        </div>
    );
}
