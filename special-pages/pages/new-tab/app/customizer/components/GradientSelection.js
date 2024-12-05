import { h, Fragment } from 'preact';
import cn from 'classnames';

import { values } from '../values.js';
import styles from './CustomizerDrawerInner.module.css';
import { computed } from '@preact/signals';

/**
 * @import { Widgets, WidgetConfigItem, WidgetVisibility, VisibilityMenuItem, CustomizerData, PredefinedGradient } from '../../../types/new-tab.js'
 */

/**
 * @param {object} props
 * @param {import('@preact/signals').Signal<CustomizerData>} props.data
 * @param {(bg: CustomizerData['background']) => void} props.select
 * @param {() => void} props.back
 */
export function GradientSelection({ data, select, back }) {
    // const gradient = values.gradients.gradient02;

    function onClick(event) {
        let target = /** @type {HTMLElement|null} */ (event.target);
        while (target && target !== event.currentTarget) {
            if (target.getAttribute('role') === 'radio') {
                event.preventDefault();
                event.stopImmediatePropagation();
                if (target.getAttribute('aria-checked') === 'false') {
                    if (target.dataset.key) {
                        const value = /** @type {PredefinedGradient} */ (target.dataset.key);
                        select({ kind: 'gradient', value });
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
                Gradients
            </button>
            <div className={styles.sectionBody} onClick={onClick}>
                <GradientGrid data={data} />
            </div>
        </Fragment>
    );
}

const entries = Object.entries(values.gradients);
/**
 * @param {object} props
 * @param {import("@preact/signals").Signal<CustomizerData>} props.data
 */
function GradientGrid({ data }) {
    const selected = computed(() => data.value.background.kind === 'gradient' && data.value.background.value);
    return (
        <ul className={cn(styles.bgList)}>
            {entries.map(([key, entry]) => {
                return (
                    <li className={styles.bgListItem} key={key}>
                        <button
                            className={styles.bgPanel}
                            type="button"
                            tabIndex={0}
                            role="radio"
                            aria-checked={key === selected.value}
                            data-key={key}
                            style={{
                                backgroundImage: `url(${entry.path})`,
                                backgroundSize: 'cover',
                                backgroundRepeat: 'no-repeat',
                            }}
                        >
                            <span className="sr-only">Select {key}</span>
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}
