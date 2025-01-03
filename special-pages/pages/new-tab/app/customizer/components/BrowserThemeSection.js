import styles from './BrowserThemeSection.module.css';
import cn from 'classnames';
import { h } from 'preact';
import { useComputed } from '@preact/signals';
import { useTypedTranslationWith } from '../../types.js';

/**
 * @import enStrings from '../strings.json';
 * @typedef {enStrings} strings
 */

/**
 * @param {object} props
 * @param {import('@preact/signals').Signal<import('../../../types/new-tab').CustomizerData>} props.data
 * @param {(theme: import('../../../types/new-tab').ThemeData) => void} props.setTheme
 */
export function BrowserThemeSection(props) {
    const current = useComputed(() => props.data.value.theme);
    const { t } = useTypedTranslationWith(/** @type {strings} */ ({}));

    return (
        <ul class={styles.themeList}>
            <li class={styles.themeItem}>
                <button
                    class={cn(styles.themeButton, styles.themeButtonLight)}
                    role="radio"
                    type="button"
                    aria-checked={current.value === 'light'}
                    tabindex={0}
                    onClick={() => props.setTheme({ theme: 'light' })}
                >
                    <span class="sr-only">{t('customizer_browser_theme_label', { type: 'light' })}</span>
                </button>
                {t('customizer_browser_theme_light')}
            </li>
            <li class={styles.themeItem}>
                <button
                    class={cn(styles.themeButton, styles.themeButtonDark)}
                    role="radio"
                    type="button"
                    aria-checked={current.value === 'dark'}
                    tabindex={0}
                    onClick={() => props.setTheme({ theme: 'dark' })}
                >
                    <span class="sr-only">{t('customizer_browser_theme_label', { type: 'dark' })}</span>
                </button>
                {t('customizer_browser_theme_dark')}
            </li>
            <li class={styles.themeItem}>
                <button
                    class={cn(styles.themeButton, styles.themeButtonSystem)}
                    role="radio"
                    type="button"
                    aria-checked={current.value === 'system'}
                    tabindex={0}
                    onClick={() => props.setTheme({ theme: 'system' })}
                >
                    <span class="sr-only">{t('customizer_browser_theme_label', { type: 'system' })}</span>
                </button>
                {t('customizer_browser_theme_system')}
            </li>
        </ul>
    );
}
