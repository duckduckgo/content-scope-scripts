import { h } from 'preact';
import cn from 'classnames';
import styles from './Sidebar.module.css';
import { useComputed, useSignal } from '@preact/signals';
import { useTypedTranslation } from '../types.js';
import { useQueryContext } from '../global/Providers/QueryProvider.js';
import { useSettingsServiceDispatch } from '../global/Providers/SettingsServiceProvider.js';
import { useNavContext, useNavDispatch } from '../global/Providers/NavProvider.js';

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
 * @param {SettingsScreen[]} props.settingScreens
 */
export function Sidebar({ settingScreens }) {
    const { t } = useTypedTranslation();
    const search = useQueryContext();
    const nav = useNavContext();
    const navDispatch = useNavDispatch();
    const dispatch = useSettingsServiceDispatch();
    const current = useSignal(/** @type {ScreenId|null} */ (null));

    return (
        <div class={styles.stack}>
            <h1 class={styles.pageTitle}>{t('page_title')}</h1>
            <nav class={styles.nav}>
                {settingScreens.map((settingScreen) => {
                    const id = settingScreen.id;
                    return (
                        <Item
                            current={current}
                            key={settingScreen.id}
                            onClick={() => navDispatch({ kind: 'nav', id })}
                            setting={settingScreen}
                        />
                    );
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
 * @param {SettingsScreen} props.setting The range represented by this item.
 * @param {(setting: string) => void} props.onClick Callback function triggered when the range is clicked.
 */
function Item({ current, setting, onClick }) {
    const { t } = useTypedTranslation();
    const { buttonLabel } = labels(setting.id, t);
    const classNames = useComputed(() => {
        if (setting.id === 'all' && current.value === null) {
            return cn(styles.item, styles.active);
        }
        return cn(styles.item, current.value === setting.id && styles.active);
    });

    return (
        <div class={classNames} key={setting.id}>
            <a
                href={'/' + setting.id}
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
            </a>
        </div>
    );
}

/**
 * @param {string} screen
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
