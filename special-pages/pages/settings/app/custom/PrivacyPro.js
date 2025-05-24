import { useTranslation } from '../types.js';
import { Boxed } from '../components/Boxed.js';
import { h } from 'preact';
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
        <Boxed>
            <div class={styles.signup}>
                <div class={styles.icon}>icon</div>
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
