import { h, Fragment } from 'preact';
import cn from 'classnames';

import styles from './CustomizerDrawerInner.module.css';
import { computed } from '@preact/signals';
import { DismissButton } from '../../components/DismissButton.jsx';

/**
 * @import { Widgets, WidgetConfigItem, WidgetVisibility, VisibilityMenuItem, CustomizerData, PredefinedGradient } from '../../../types/new-tab.js'
 */

/**
 * @param {object} props
 * @param {import('@preact/signals').Signal<CustomizerData>} props.data
 * @param {(bg: CustomizerData['background']) => void} props.select
 * @param {() => void} props.back
 * @param {() => void} props.onUpload
 * @param {(id: string) => void} props.deleteImage
 */
export function ImageSelection({ data, select, back, onUpload, deleteImage }) {
    // const gradient = values.gradients.gradient02;

    function onClick(event) {
        let target = /** @type {HTMLElement|null} */ (event.target);
        while (target && target !== event.currentTarget) {
            if (target.getAttribute('role') === 'radio') {
                event.preventDefault();
                event.stopImmediatePropagation();
                if (target.getAttribute('aria-checked') === 'false') {
                    if (target.dataset.key) {
                        const value = /** @type {string} */ (target.dataset.key);
                        const match = data.value.userImages.find((i) => i.id === value);
                        if (match) {
                            select({ kind: 'userImage', value: match });
                        }
                    } else {
                        console.warn('missing dataset.key');
                    }
                } else {
                    console.log('ignoring click on selected color');
                }
                break;
            } else {
                target = target.parentElement;
            }
        }
    }

    return (
        <Fragment>
            <button type={'button'} onClick={back} class={cn(styles.backBtn, styles.sectionTitle)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M10.4419 3.18306C10.686 3.42714 10.686 3.82286 10.4419 4.06694L6.50888 8L10.4419 11.9331C10.686 12.1771 10.686 12.5729 10.4419 12.8169C10.1979 13.061 9.80214 13.061 9.55806 12.8169L5.18306 8.44194C4.93898 8.19786 4.93898 7.80214 5.18306 7.55806L9.55806 3.18306C9.80214 2.93898 10.1979 2.93898 10.4419 3.18306Z"
                        fill="currentColor"
                        fill-opacity="0.84"
                    />
                </svg>
                My Backgrounds
            </button>
            <div className={styles.sectionBody} onClick={onClick}>
                <ImageGrid data={data} deleteImage={deleteImage} />
            </div>
        </Fragment>
    );
}

/**
 * @param {object} props
 * @param {import("@preact/signals").Signal<CustomizerData>} props.data
 * @param {(id: string) => void} props.deleteImage
 */
function ImageGrid({ data, deleteImage }) {
    const selected = computed(() => data.value.background.kind === 'userImage' && data.value.background.value.id);
    const entries = computed(() => {
        return data.value.userImages;
    });
    return (
        <ul className={cn(styles.bgList)}>
            {entries.value.map((entry) => {
                return (
                    <li className={styles.bgListItem} key={entry.id}>
                        <button
                            className={styles.bgPanel}
                            type="button"
                            tabIndex={0}
                            role="radio"
                            aria-checked={entry.id === selected.value}
                            data-key={entry.id}
                            style={{
                                backgroundImage: `url(${entry.thumb})`,
                                backgroundSize: 'cover',
                                backgroundRepeat: 'no-repeat',
                            }}
                        ></button>
                        <DismissButton className={styles.deleteBtn} onClick={() => deleteImage(entry.id)} />
                    </li>
                );
            })}
        </ul>
    );
}
