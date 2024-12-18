import styles from './CustomizerDrawerInner.module.css';
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
        <div class={styles.section}>
            <h3 class={styles.sectionTitle}>Browser Theme</h3>
            <ul class={cn(styles.sectionBody, styles.themeList)}>
                <li class={styles.themeItem}>
                    <button
                        class={styles.themeButton}
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
                        class={styles.themeButton}
                        role="radio"
                        type="button"
                        aria-checked={current.value === 'dark'}
                        tabindex={0}
                        onClick={() => props.setTheme({ theme: 'dark' })}
                    >
                        <span className="sr-only">Select dark theme</span>
                    </button>
                    Dark
                </li>
                <li class={styles.themeItem}>
                    <button
                        class={styles.themeButton}
                        role="radio"
                        type="button"
                        aria-checked={current.value === 'system'}
                        tabindex={0}
                        onClick={() => props.setTheme({ theme: 'system' })}
                    >
                        <span className="sr-only">Select system theme</span>
                    </button>
                    System
                </li>
            </ul>
        </div>
    );
}
