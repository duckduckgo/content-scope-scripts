import { Fragment, h } from 'preact';
import styles from './BackgroundReceiver.module.css';
import { values } from '../customizer/values.js';
import { useContext } from 'preact/hooks';
import { CustomizerContext } from '../customizer/CustomizerProvider.js';
import { detectThemeFromHex } from '../customizer/utils.js';

/**
 * @import { BackgroundVariant, BrowserTheme } from "../../types/new-tab"
 */

/**
 * @param {BackgroundVariant} background
 * @param {BrowserTheme} browserTheme
 * @param {'light' | 'dark'} system
 * @return {{bg: 'light' | 'dark', browser: 'light' | 'dark'}}
 */
export function inferSchemeFrom(background, browserTheme, system) {
    const browser = themeFromBrowser(browserTheme, system);
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
 * @param {'light' | 'dark'} system
 * @return {'light' | 'dark'}
 */
export function themeFromBrowser(browserTheme, system) {
    if (browserTheme === 'system') {
        return system;
    }
    return browserTheme;
}

/**
 * @param {object} props
 * @param {import("@preact/signals").Signal<'light' | 'dark'>} props.bg
 * @param {import("@preact/signals").Signal<'light' | 'dark'>} props.browser
 */
export function BackgroundConsumer({ bg, browser }) {
    const { data } = useContext(CustomizerContext);
    const background = data.value.background;

    switch (background.kind) {
        case 'default': {
            return <div className={styles.root} data-testid="BackgroundConsumer" data-background-kind="default" data-theme={browser} />;
        }
        case 'hex': {
            return (
                <div
                    class={styles.root}
                    data-animate="true"
                    data-testid="BackgroundConsumer"
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
                    data-background-color={color.hex}
                    data-testid="BackgroundConsumer"
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
                        data-testid="BackgroundConsumer"
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
                    data-testid="BackgroundConsumer"
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
