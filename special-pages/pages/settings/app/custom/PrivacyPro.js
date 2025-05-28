import { useTranslation } from '../types.js';
import { Boxed } from '../components/Boxed.js';
import { Fragment, h } from 'preact';
import styles from './PrivacyPro.module.css';
import { useGlobalSettingsState, useSetting, useSettingsServiceDispatch } from '../global/Providers/SettingsServiceProvider.js';
import cn from 'classnames';

/**
 * @import { Signal } from '@preact/signals';
 * @param {object} props
 * @param {Signal<"subscribed" | "none">} props.subscription
 */
export function PrivacyPro({ subscription }) {
    return <div data-testid="PrivacyPro">{subscription.value === 'none' && <Signup />}</div>;
}

function Signup() {
    const { t } = useTranslation();

    return (
        <Fragment>
            <Boxed>
                <div class={styles.signup}>
                    <div class={styles.rowIcon}>
                        <img src="/icons/16px/Privacy-Pro-Color-16.svg" />
                    </div>
                    <div class={styles.content}>
                        <div class={styles.title}>{t('privacyPro.signup.title')}</div>
                        <div class={styles.text}>{t('privacyPro.signup.description')}</div>
                        <div class={styles.buttons}>
                            <button class={cn(styles.button, styles.primary)}>{t('privacyPro.signup.get')}</button>
                            <button class={cn(styles.button, styles.secondary)}>{t('privacyPro.signup.already')}</button>
                        </div>
                    </div>
                </div>
            </Boxed>
            <Boxed>
                <div class={styles.row}>
                    <div class={cn(styles.rowIcon, styles.rowIconCentered)}>
                        <img src="/icons/VPN-16.svg" />
                    </div>
                    <div class={styles.rowTitle}>{t('privacyPro.vpn.title')}</div>
                    <div class={styles.rowText}>{t('privacyPro.vpn.description')}</div>
                </div>
                <div class={styles.row}>
                    <div class={cn(styles.rowIcon, styles.rowIconCentered)}>
                        <img src="/icons/Profile-Blocked-16.svg" />
                    </div>
                    <div class={styles.rowTitle}>{t('privacyPro.pir.title')}</div>
                    <div class={styles.rowText}>{t('privacyPro.pir.description')}</div>
                </div>
                <div class={styles.row}>
                    <div class={cn(styles.rowIcon, styles.rowIconCentered)}>
                        <img src="/icons/Identity-Theft-Restoration-16.svg" />
                    </div>
                    <div class={styles.rowTitle}>{t('privacyPro.id.title')}</div>
                    <div class={styles.rowText}>{t('privacyPro.id.description')}</div>
                </div>
            </Boxed>
        </Fragment>
    );
}

/**
 * @param {object} props
 * @param {string} props.id
 */
export function PrivacyProWithState(props) {
    const dispatch = useSettingsServiceDispatch();
    const value = useGlobalSettingsState();
    const subscription = useSetting('privacyPro.subscription');
    return <PrivacyPro {...props} subscription={subscription} />;
}
