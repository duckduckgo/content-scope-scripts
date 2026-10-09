import { values } from '../customizer/values.js';
import { detectThemeFromHex } from '../customizer/utils.js';

/**
 * @import { BackgroundVariant, BrowserTheme, ThemeVariant } from "../../types/new-tab"
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
