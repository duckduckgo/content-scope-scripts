import { h } from 'preact';
import { CloseSmallIcon } from '../../../../components/Icons';

/**
 * @param {object} props
 * @param {string} props.className
 * @param {() => void} props.onRemove
 * @param {string} props.label
 * @param {boolean} [props.stopPropagation] - stop the click bubbling, e.g. when the chip itself is clickable.
 * @param {string} [props.iconStyle]
 */
export function ChipRemoveButton({ className, onRemove, label, stopPropagation, iconStyle }) {
    return (
        <button
            type="button"
            tabIndex={0}
            class={className}
            aria-label={label}
            onClick={(e) => {
                if (stopPropagation) e.stopPropagation();
                onRemove();
            }}
        >
            <CloseSmallIcon width="10" height="10" style={iconStyle} />
        </button>
    );
}
