import styles from './BrowserThemeSection.module.css';
import cn from 'classnames';
import { h } from 'preact';
import { useComputed } from '@preact/signals';

/**
 * @param {object} props
 * @param {import('@preact/signals').Signal<import('../../../types/new-tab').CustomizerData>} props.data
 * @param {(theme: import('../../../types/new-tab').ThemeData) => void} props.setTheme
 */
export function BrowserThemeSection(props) {
    const current = useComputed(() => props.data.value.theme);
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
                    <span class="sr-only">Select light theme</span>
                </button>
                Light
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
                    <span class="sr-only">Select dark theme</span>
                </button>
                Dark
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
                    <span class="sr-only">Select system theme</span>
                </button>
                System
            </li>
        </ul>
    );
}
