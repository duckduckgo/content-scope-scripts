import { useTranslation } from '../types.js';
import { Boxed } from '../components/Boxed.js';
import { Fragment, h } from 'preact';
import styles from './Sync.module.css';
import { useGlobalSettingsState, useSetting, useSettingsServiceDispatch } from '../global/Providers/SettingsServiceProvider.js';
import { Button } from '../../../../shared/components/Button/Button.js';

/**
 * @typedef {{startId: string }} SyncDefinition
 */

/**
 * @import { Signal } from '@preact/signals';
 * @param {object} props
 * @param {Signal<"syncing" | "none">} props.sync
 * @param {()=>void} props.onClick
 */
function Sync({ sync, onClick }) {
    return <div data-testid="Sync">{sync.value === 'none' && <StartSync onClick={onClick} />}</div>;
}

function StartSync({ onClick }) {
    const { t } = useTranslation();

    return (
        <Fragment>
            <Boxed>
                <div class={styles.sync}>
                    <div class={styles.icon}>
                        <img src="/icons/Sync-Desktop-100.svg" alt="" />
                    </div>
                    <div class={styles.title}>{t('sync.start.title')}</div>
                    <div class={styles.description}>{t('sync.start.description')}</div>
                    <div class={styles.button}>
                        <Button onClick={onClick}>{t('sync.start.begin')}</Button>
                    </div>
                </div>
            </Boxed>
            <div class={styles.info}>{t('sync.start.info')}</div>
        </Fragment>
    );
}

/**
 * @param {object} props
 * @param {string} props.id
 * @param {string} props.startId
 */
export function SyncWithState(props) {
    const dispatch = useSettingsServiceDispatch();
    const value = useGlobalSettingsState();
    const sync = useSetting('sync.status');
    return (
        <Sync
            {...props}
            sync={sync}
            onClick={() => {
                dispatch({ kind: 'button-press', id: props.startId });
            }}
        />
    );
}
