import { h } from 'preact';
import styles from './BackgroundReceiver.module.css';
import { useContext } from 'preact/hooks';
import { CustomizerContext } from '../customizer/CustomizerProvider.js';

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
        case 'gradient':
        case 'userImage':
        case 'hex':
            console.log('not supported yet!');
    }
    return { bg: browser, browser };
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
 * @param {import("@preact/signals").Signal<'light' | 'dark'>} props.browser
 */
export function BackgroundConsumer({ browser }) {
    const { data } = useContext(CustomizerContext);
    const background = data.value.background;

    switch (background.kind) {
        case 'default': {
            return <div className={styles.root} data-testid="BackgroundConsumer" data-background-kind="default" data-theme={browser} />;
        }
        case 'hex':
        case 'color':
        case 'gradient':
        case 'userImage':
        default: {
            console.warn('not supported yet!');
            return <div className={styles.root} data-testid="BackgroundConsumer" data-background-kind="default" data-theme={browser} />;
        }
    }
}
