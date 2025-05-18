import { h } from 'preact';
import cn from 'classnames';
import styles from './Sidebar.module.css';
import { useComputed, useSignal } from '@preact/signals';
import { useTypedTranslation } from '../types.js';
import { useQueryContext } from '../global/Providers/QueryProvider.js';

// prettier-ignore
const screenIds = /** @type {const} */([
    'privateSearch',
    'defaultBrowser'
]);

/**
 * @import json from "../strings.json"
 * @import {SettingsScreen} from "../../types/settings.js"
 * @typedef {typeof screenIds[number]} ScreenId
 */

/** @type {Record<ScreenId, string>} */
const iconMap = {
    privateSearch: 'icons/all.svg',
    defaultBrowser: 'icons/all.svg',
};

/**
 * Renders a sidebar navigation component with links based on the provided ranges.
 *
 * @param {Object} props - The properties object.
 * @param {import('../../types/settings').SettingsScreen[]} props.settingScreens
 */
export function Sidebar({ settingScreens }) {
    const { t } = useTypedTranslation();
    const search = useQueryContext();
    console.log('current search', search);
    const current = useSignal(/** @type {ScreenId} */ ('privateSearch'));

    return (
        <div class={styles.stack}>
            <h1 class={styles.pageTitle}>{t('page_title')}</h1>
            <nav class={styles.nav}>
                {settingScreens.map((settingScreen) => {
                    return <Item current={current} key={settingScreen.id} onClick={() => console.log('todo')} setting={settingScreen} />;
                })}
            </nav>
        </div>
    );
}

/**
 * A component that renders a list item with optional delete actions and a link.
 *
 * @param {Object} props
 * @param {import('@preact/signals').ReadonlySignal<ScreenId|null>} props.current The current selection with a value property.
 * @param {import('../global/Providers/SettingsServiceProvider').SettingsScreen} props.setting The range represented by this item.
 * @param {(setting: ScreenId) => void} props.onClick Callback function triggered when the range is clicked.
 */
function Item({ current, setting, onClick }) {
    const { t } = useTypedTranslation();
    const { buttonLabel } = labels(setting, t);
    const classNames = useComputed(() => {
        if (setting.id === 'all' && current.value === null) {
            return cn(styles.item, styles.active);
        }
        return cn(styles.item, current.value === setting.id && styles.active);
    });

    return (
        <div class={classNames} key={setting.id}>
            <button
                class={styles.link}
                tabIndex={0}
                onClick={(e) => {
                    e.preventDefault();
                    onClick(setting.id);
                }}
            >
                <span className={styles.icon}>
                    <img src={iconMap[setting.id]} />
                </span>
                {buttonLabel}
            </button>
        </div>
    );
}

/**
 * @param {ScreenId} screen
 * @param {(s: string) => string} t
 * @return {{ buttonLabel: string}}
 */
function labels(screen, t) {
    switch (screen) {
        case 'privateSearch':
        case 'defaultBrowser':
            return { buttonLabel: t('screen_title_' + screen) };
    }
    throw new Error('missing sidebar');
}
