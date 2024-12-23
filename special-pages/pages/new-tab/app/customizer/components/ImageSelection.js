import { h } from 'preact';
import cn from 'classnames';

import styles from './CustomizerDrawerInner.module.css';
import { useComputed } from '@preact/signals';
import { DismissButton } from '../../components/DismissButton.jsx';
import { BackChevron, PlusIcon } from '../../components/Icons.js';
import { useContext } from 'preact/hooks';
import { CustomizerThemesContext } from '../CustomizerProvider.js';
import { InlineError } from '../../InlineError.js';
import { useTypedTranslationWith } from '../../types.js';

/**
 * @import enStrings from '../strings.json';
 * @import ntpStrings from '../../strings.json';
 * @typedef {enStrings & ntpStrings} strings
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
    const { t } = useTypedTranslationWith(/** @type {strings} */ ({}));
    function onClick(event) {
        let target = /** @type {HTMLElement|null} */ (event.target);
        const selector = `[role="radio"][aria-checked="false"][data-id]`;
        if (!target?.matches(selector)) {
            target = /** @type {HTMLElement|null} */ (target?.closest(selector));
        }
        if (!target) return;
        const value = /** @type {string} */ (target.dataset.id);
        const match = data.value.userImages.find((i) => i.id === value);
        if (!match) return console.warn('could not find matching image', value);
        select({ background: { kind: 'userImage', value: match } });
    }

    return (
        <div>
            <button type={'button'} onClick={back} class={cn(styles.backBtn, styles.sectionTitle)}>
                <BackChevron />
                My Backgrounds
            </button>
            <div className={styles.sectionBody} onClick={onClick}>
                <InlineError named={'Image Selection'}>
                    <ImageGrid data={data} deleteImage={deleteImage} onUpload={onUpload} />
                </InlineError>
            </div>
            <div className={styles.sectionBody}>
                <p>{t('customizer_image_privacy')}</p>
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
    const { browser } = useContext(CustomizerThemesContext);
    const selected = useComputed(() => data.value.background.kind === 'userImage' && data.value.background.value.id);
    const entries = useComputed(() => {
        return data.value.userImages;
    });
    const max = 8;
    const diff = max - entries.value.length;
    const placeholders = new Array(diff).fill(null);

    return (
        <ul className={cn(styles.bgList)}>
            {entries.value.map((entry, index) => {
                // eslint-disable-next-line no-labels,no-unused-labels
                $INTEGRATION: (() => {
                    if (entry.id === '__will_throw__') throw new Error('Simulated error');
                })();
                return (
                    <li className={styles.bgListItem} key={entry.id}>
                        <button
                            className={styles.bgPanel}
                            type="button"
                            tabIndex={0}
                            role="radio"
                            aria-checked={entry.id === selected.value}
                            data-id={entry.id}
                            style={{
                                backgroundImage: `url(${entry.thumb})`,
                                backgroundSize: 'cover',
                                backgroundRepeat: 'no-repeat',
                            }}
                        >
                            <span class="sr-only">Select image {index + 1}</span>
                        </button>
                        <DismissButton
                            className={styles.deleteBtn}
                            onClick={() => deleteImage(entry.id)}
                            buttonProps={{
                                'data-color-mode': String(entry.colorScheme),
                                'aria-label': `Delete image ${index + 1}`,
                            }}
                        />
                    </li>
                );
            })}
            {placeholders.map((_, index) => {
                return (
                    <li className={styles.bgListItem} key={`placeholder-${diff}-${index}`}>
                        <button
                            type="button"
                            onClick={onUpload}
                            class={cn(styles.bgPanel, styles.bgPanelEmpty, styles.dynamicIconColor)}
                            data-color-mode={browser}
                        >
                            <PlusIcon />
                            <span class="sr-only">Add Background</span>
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}
