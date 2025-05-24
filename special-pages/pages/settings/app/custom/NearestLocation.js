import { Fragment, h } from 'preact';
import styles from './NearestLocation.module.css';
import { useTranslation } from '../types.js';
import { useGlobalSettingsState, useSettingsServiceDispatch } from '../global/Providers/SettingsServiceProvider.js';
import { useComputed } from '@preact/signals';
import { Boxed } from '../components/Boxed.js';

/**
 * @import { Signal } from '@preact/signals';
 * @param {object} props
 * @param {Signal<"nearest" | "uk" | "usa">} props.location
 * @param {() => void} props.onClick
 */
export function NearestLocation({ onClick, location }) {
    const { t } = useTranslation();
    const value = location.value || 'nearest';
    return (
        <Boxed>
            <div class={styles.root} data-testid="NearestLocation">
                {value === 'nearest' && (
                    <Fragment>
                        <span class={styles.arrow}>{value === 'nearest' && <LocationIcon />}</span>
                        <p class={styles.title}>{t('vpn.location.nearest.title')}</p>
                        <p class={styles.text}>{t('vpn.location.nearest.text')}</p>
                    </Fragment>
                )}
                {value === 'uk' && (
                    <Fragment>
                        <p class={styles.title}>UK</p>
                    </Fragment>
                )}
                <button class={styles.button} onClick={onClick}>
                    {t('vpn.location.button_label')}
                </button>
            </div>
        </Boxed>
    );
}

/**
 * @param {object} props
 * @param {string} props.id
 */
export function NearestLocationWithState(props) {
    const dispatch = useSettingsServiceDispatch();
    const value = useGlobalSettingsState();
    const location = useComputed(() => value.value[props.id]);
    return (
        <NearestLocation
            {...props}
            location={location}
            onClick={() => {
                dispatch({ kind: 'button-press', id: props.id });
            }}
        />
    );
}

export function LocationIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 12L12 4M12 4H6M12 4V10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
    );
}
