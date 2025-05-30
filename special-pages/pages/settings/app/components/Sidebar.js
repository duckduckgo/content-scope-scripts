import { Fragment, h } from 'preact';
import { useComputed } from '@preact/signals';
import cn from 'classnames';
import { useTypedTranslation } from '../types.js';
import { useNavContext, useNavDispatch } from '../global/Providers/NavProvider.js';
import { useQueryDispatch } from '../global/Providers/QueryProvider.js';
import { useGlobalSettingsState } from '../global/Providers/SettingsServiceProvider.js';
import styles from './Sidebar.module.css';

/**
 * @import {Signal} from "@preact/signals"
 * @typedef {import('../strings.json')} json
 * @typedef {import('../../types/settings.js').SettingsScreen} SettingsScreen
 * @typedef {import('../schema/pane-types.js').SettingsStructure} SettingsStructure
 */

/**
 * Renders a sidebar navigation component with links based on the provided ranges.
 *
 * @param {Object} props - The properties object.
 * @param {Signal<SettingsStructure>} props.settingsStructure
 */
export function Sidebar({ settingsStructure }) {
    const { t } = useTypedTranslation();
    const nav = useNavContext();
    const navDispatch = useNavDispatch();
    const queryDispatch = useQueryDispatch();
    const current = useComputed(() => nav.value.id);

    function navigateTo(id) {
        navDispatch({ kind: 'nav', id });
        queryDispatch({ kind: 'reset' });
    }

    return (
        <div class={styles.stack}>
            <h1 class={styles.pageTitle}>{t('page_title')}</h1>
            <nav class={styles.nav}>
                {settingsStructure.value.groups.map((group) => {
                    const dynamicLookup = 'group_title_' + group.id;
                    const groupLabel = t(/** @type {any} */ (dynamicLookup));
                    if (groupLabel === '') console.warn('missing group label for ', dynamicLookup);
                    return (
                        <Fragment>
                            <small class={styles.groupHeading}>{groupLabel}</small>
                            <div class={styles.group}>
                                {group.screenIds.map((id) => {
                                    const match = settingsStructure.value.screens[id];
                                    if (!match) {
                                        console.warn('missing pane definition for id: %s in group: %s', id, group.id);
                                        return null;
                                    }
                                    return <Item current={current} key={id} onClick={() => navigateTo(id)} setting={match} />;
                                })}
                            </div>
                        </Fragment>
                    );
                })}
            </nav>
        </div>
    );
}

const DEFAULT_ICON = '/icons/16px/~Placeholder-Color-16.svg';

/**
 * A component that renders a list item with optional delete actions and a link.
 *
 * @param {Object} props
 * @param {import('@preact/signals').ReadonlySignal<string|null>} props.current The current selection with a value property.
 * @param {import("../schema/pane-types.js").PaneDefinition} props.setting The range represented by this item.
 * @param {(setting: string) => void} props.onClick Callback function triggered when the range is clicked.
 */
function Item({ current, setting, onClick }) {
    const { t } = useTypedTranslation();
    const settingsState = useGlobalSettingsState();
    const status = useComputed(() => {
        const paneDefaults = {
            privateSearch: true,
            webTrackingProtection: true,
        };
        if (setting.id in paneDefaults) return true;
        if ('valueId' in setting.title && typeof setting.title.valueId === 'string') {
            const matched = settingsState.value[setting.title.valueId];
            if (matched === undefined) {
                console.warn('valueId exists, but there was no matching value for it: ', setting.title.valueId);
                return null;
            }
            return settingsState.value[setting.title.valueId];
        }
        return null;
    });
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
                <span class={styles.icon}>
                    <img src={setting.icon || DEFAULT_ICON} />
                </span>
                <span class={styles.label}>{buttonLabel}</span>
                <StatusSymbol status={status} />
            </a>
        </div>
    );
}

/**
 * @param {object} props
 * @param {Signal<boolean|null>} props.status
 */
function StatusSymbol({ status }) {
    if (status.value === null) return null;
    return (
        <span class={styles.status} data-status={status.value ? 'on' : 'off'}>
            <span class={styles.statusCircle} />
            <span class={styles.statusText}>{status.value ? 'on' : 'off'}</span>
        </span>
    );
}

/**
 * @param {string} screen
 * @param {(s: string) => string} t
 * @return {{ buttonLabel: string}}
 */
function labels(screen, t) {
    const maybe = t(`${screen}.screenTitle`);
    if (maybe === '') return { buttonLabel: 'missing sidebar label' };
    return { buttonLabel: maybe };
}
