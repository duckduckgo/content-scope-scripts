import { Fragment, h } from 'preact';
import cn from 'classnames';
import styles from './Sidebar.module.css';
import { useComputed } from '@preact/signals';
import { useTypedTranslation } from '../types.js';
import { useNavContext, useNavDispatch } from '../global/Providers/NavProvider.js';
import { useQueryDispatch } from '../global/Providers/QueryProvider.js';

/**
 * @import json from "../strings.json"
 * @import {SettingsScreen} from "../../types/settings.js"
 */

/**
 * Renders a sidebar navigation component with links based on the provided ranges.
 *
 * @param {Object} props - The properties object.
 * @param {import("@preact/signals").Signal<import('../settings.service').SettingsStructure>} props.settingsStructure
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
                    return (
                        <Fragment>
                            <small class={styles.groupHeading}>{groupLabel}</small>
                            <div class={styles.group}>
                                {group.screenIds.map((id) => {
                                    const match = settingsStructure.value.screens[id];
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

/**
 * A component that renders a list item with optional delete actions and a link.
 *
 * @param {Object} props
 * @param {import('@preact/signals').ReadonlySignal<string|null>} props.current The current selection with a value property.
 * @param {import('../settings.service').PaneDefinition} props.setting The range represented by this item.
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
                    <img src={'icons/all.svg'} />
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
    const maybe = t(`${screen}.screenTitle`);
    if (maybe === '') return { buttonLabel: 'missing sidebar label' };
    return { buttonLabel: maybe };
}
