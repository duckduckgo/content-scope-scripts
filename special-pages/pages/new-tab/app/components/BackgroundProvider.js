import { createContext, Fragment, h } from 'preact';
import styles from './BackgroundReceiver.module.css';
import { detectThemeFromHex, values } from '../customizer/values.js';
import { signal, useComputed } from '@preact/signals';
import { useContext } from 'preact/hooks';
import { CustomizerContext } from '../customizer/CustomizerProvider.js';

/**
 * @import { BackgroundVariant, BrowserTheme } from "../../types/new-tab"
 */

const BackgroundContext = createContext({
    /** @type {import("@preact/signals").Signal<BackgroundVariant>} */
    bg: signal({ kind: 'default' }),
    /** @type {import("@preact/signals").Signal<BrowserTheme>} */
    theme: signal('system'),
});

/**
 * @param {object} props
 * @param {import("preact").ComponentChild} props.children
 */
export function BackgroundProvider({ children }) {
    const { data } = useContext(CustomizerContext);
    const bg = useComputed(() => data.value.background);
    const theme = useComputed(() => data.value.theme);
    return <BackgroundContext.Provider value={{ bg, theme }}>{children}</BackgroundContext.Provider>;
}

/**
 * @param {BackgroundVariant} background
 * @param {BrowserTheme} browserTheme
 * @return {{bg: 'light' | 'dark', browser: 'light' | 'dark'}}
 */
export function inferSchemeFrom(background, browserTheme) {
    const browser = themeFromBrowser(browserTheme);
    switch (background.kind) {
        case 'default':
            return { bg: browser, browser };
        case 'color': {
            const color = values.colors[background.value];
            return { bg: color.colorScheme, browser };
        }

        case 'gradient': {
            const gradient = values.gradients[background.value];
            return { bg: gradient.colorScheme, browser };
        }

        case 'userImage':
            return { bg: background.value.colorScheme, browser };

        case 'hex':
            return { bg: detectThemeFromHex(background.value), browser };
    }
}

/**
 * @param {BrowserTheme} browserTheme
 * @return {'light' | 'dark'}
 */
export function themeFromBrowser(browserTheme) {
    if (browserTheme === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return browserTheme;
}

/**
 *
 */
export function BackgroundConsumer() {
    const { bg, theme } = useContext(BackgroundContext);
    const defaultBgColorScheme = themeFromBrowser(theme.value);
    const background = bg.value;
    switch (background.kind) {
        case 'default': {
            return (
                <div
                    class={styles.root}
                    style={{
                        backgroundColor: defaultBgColorScheme === 'light' ? 'white' : '#333',
                    }}
                ></div>
            );
        }
        case 'hex': {
            return (
                <div
                    class={styles.root}
                    data-animate="true"
                    style={{
                        backgroundColor: background.value,
                    }}
                ></div>
            );
        }
        case 'color': {
            const color = values.colors[background.value];
            return (
                <div
                    class={styles.root}
                    data-animate="true"
                    style={{
                        backgroundColor: color.hex,
                    }}
                ></div>
            );
        }
        case 'gradient': {
            const gradient = values.gradients[background.value];
            return (
                <Fragment key="gradient">
                    <div
                        class={styles.root}
                        data-animate="false"
                        style={{
                            backgroundColor: gradient.fallback,
                            backgroundImage: `url(${gradient.path})`,
                            backgroundSize: 'cover',
                            backgroundRepeat: 'no-repeat',
                        }}
                    />
                    <div
                        class={styles.root}
                        data-animate="false"
                        style={{
                            backgroundImage: `url(gradients/grain.png)`,
                            backgroundRepeat: 'repeat',
                            opacity: 0.5,
                            mixBlendMode: 'soft-light',
                        }}
                    ></div>
                </Fragment>
            );
        }
        case 'userImage': {
            const img = background.value;
            return (
                <div
                    class={styles.root}
                    data-animate="true"
                    style={{
                        backgroundImage: `url(${img.src})`,
                        backgroundSize: 'cover',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center center',
                    }}
                ></div>
            );
        }
        default: {
            console.warn('Unreachable!');
            return <div className={styles.root}></div>;
        }
    }
}
