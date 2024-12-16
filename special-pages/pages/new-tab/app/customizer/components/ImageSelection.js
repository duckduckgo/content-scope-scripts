import { h } from 'preact';
import cn from 'classnames';

import styles from './CustomizerDrawerInner.module.css';
import { useComputed } from '@preact/signals';
import { DismissButton } from '../../components/DismissButton.jsx';
import { BackChevron } from '../../components/Icons.js';

/**
 * @import { Widgets, WidgetConfigItem, WidgetVisibility, VisibilityMenuItem, CustomizerData, BackgroundData, PredefinedGradient } from '../../../types/new-tab.js'
 */

/**
 * @param {object} props
 * @param {import('@preact/signals').Signal<CustomizerData>} props.data
 * @param {(bg: BackgroundData) => void} props.select
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
                            select({ background: { kind: 'userImage', value: match } });
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
        <div>
            <button type={'button'} onClick={back} class={cn(styles.backBtn, styles.sectionTitle)}>
                <BackChevron />
                My Backgrounds
            </button>
            <div className={styles.sectionBody} onClick={onClick}>
                <ImageGrid data={data} deleteImage={deleteImage} onUpload={onUpload} />
            </div>
        </div>
    );
}

/**
 * @param {object} props
 * @param {import("@preact/signals").Signal<CustomizerData>} props.data
 * @param {(id: string) => void} props.deleteImage
 * @param {() => void} props.onUpload
 */
function ImageGrid({ data, deleteImage, onUpload }) {
    const selected = useComputed(() => data.value.background.kind === 'userImage' && data.value.background.value.id);
    const entries = useComputed(() => {
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
            <li className={styles.bgListItem}>
                <button type="button" onClick={onUpload}>
                    Add image
                </button>
            </li>
        </ul>
    );
}
