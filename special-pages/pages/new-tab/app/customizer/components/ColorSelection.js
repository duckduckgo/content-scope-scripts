import { h, Fragment } from 'preact';
import cn from 'classnames';

import { values } from '../values.js';
import styles from './CustomizerDrawerInner.module.css';
import { BackChevron, Picker } from '../../components/Icons.js';
import { computed, useSignal } from '@preact/signals';

/**
 * @import { Widgets, WidgetConfigItem, WidgetVisibility, VisibilityMenuItem, CustomizerData, PredefinedColor } from '../../../types/new-tab.js'
 */

/**
 * @param {object} props
 * @param {import("@preact/signals").Signal<CustomizerData>} props.data
 * @param {(bg: CustomizerData['background']) => void} props.select
 * @param {() => void} props.back
 */
export function ColorSelection({ data, select, back }) {
    console.log('    RENDER:ColorSelection?');

    function onClick(event) {
        let target = /** @type {HTMLElement|null} */ (event.target);
        while (target && target !== event.currentTarget) {
            if (target.getAttribute('role') === 'radio') {
                event.preventDefault();
                event.stopImmediatePropagation();
                if (target.getAttribute('aria-checked') === 'false') {
                    if (target.dataset.key) {
                        const value = /** @type {PredefinedColor} */ (target.dataset.key);
                        select({ kind: 'color', value });
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
                Solid Colors
            </button>
            <div class={styles.sectionBody}>
                <div class={cn(styles.bgList)} role="radiogroup" onClick={onClick}>
                    <PickerPanel data={data} select={select} />
                    <ColorGrid data={data} />
                </div>
            </div>
        </div>
    );
}

const entries = Object.entries(values.colors);

/**
 * @param {object} props
 * @param {import("@preact/signals").Signal<CustomizerData>} props.data
 */
function ColorGrid({ data }) {
    const selected = computed(() => data.value.background.kind === 'color' && data.value.background.value);
    return (
        <Fragment>
            {entries.map(([key, entry]) => {
                return (
                    <div class={styles.bgListItem} key={key}>
                        <button
                            class={styles.bgPanel}
                            type="button"
                            tabindex={0}
                            style={{ background: entry.hex }}
                            role="radio"
                            aria-checked={key === selected.value}
                            data-key={key}
                        >
                            <span class="sr-only">Select {key}</span>
                        </button>
                    </div>
                );
            })}
        </Fragment>
    );
}

/**
 * @param {object} props
 * @param {import("@preact/signals").Signal<CustomizerData>} props.data
 * @param {(bg: CustomizerData['background']) => void} props.select
 */
function PickerPanel({ data, select }) {
    const peeked = data.peek();
    const initialColor = peeked.background.kind === 'hex' ? peeked.background.value : '#FFFFFF';
    const hex = useSignal(initialColor);
    const hexSelected = computed(() => data.value.background.kind === 'hex');

    return (
        <div class={styles.bgListItem}>
            <button
                className={cn(styles.bgPanel, styles.bgPanelOutlined)}
                type="button"
                tabIndex={0}
                style={{ background: hex.value }}
                role="radio"
                aria-checked={hexSelected}
            ></button>
            <input
                type={'color'}
                tabIndex={-1}
                style={{ opacity: 0, inset: 0, position: 'absolute', width: '100%', height: '100%' }}
                value={hex}
                onChange={(e) => {
                    if (!(e.target instanceof HTMLInputElement)) {
                        return;
                    }
                    hex.value = e.target.value;
                    select({ kind: 'hex', value: hex.value });
                }}
                onClick={(e) => {
                    select({ kind: 'hex', value: hex.value });
                }}
            />
            <span class={styles.colorInputIcon}>
                <Picker />
            </span>
            <span class="sr-only">Show color picker</span>
        </div>
    );
}
