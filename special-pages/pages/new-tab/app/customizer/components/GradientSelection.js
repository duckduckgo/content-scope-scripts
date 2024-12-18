import { h } from 'preact';
import cn from 'classnames';

import { values } from '../values.js';
import styles from './CustomizerDrawerInner.module.css';
import { useComputed } from '@preact/signals';
import { BackChevron } from '../../components/Icons.js';

/**
 * @import { Widgets, WidgetConfigItem, WidgetVisibility, VisibilityMenuItem, BackgroundData, CustomizerData, PredefinedGradient } from '../../../types/new-tab.js'
 */

/**
 * @param {object} props
 * @param {import('@preact/signals').Signal<CustomizerData>} props.data
 * @param {(bg: BackgroundData) => void} props.select
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
                        select({ background: { kind: 'gradient', value } });
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
                Gradients
            </button>
            <div className={styles.sectionBody} onClick={onClick}>
                <GradientGrid data={data} />
            </div>
        </div>
    );
}

const entries = Object.entries(values.gradients);
/**
 * @param {object} props
 * @param {import("@preact/signals").Signal<CustomizerData>} props.data
 */
function GradientGrid({ data }) {
    const selected = useComputed(() => data.value.background.kind === 'gradient' && data.value.background.value);
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
