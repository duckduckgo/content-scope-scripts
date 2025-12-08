import { createContext, h } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';
import { useMessaging } from './MessagingProvider.js';
import { useEnv } from '../../../../shared/components/EnvironmentProvider.js';

/**
 * @typedef {import('../../types/special-error').BrowserTheme} BrowserTheme
 * @typedef {import('../../types/special-error').ThemeVariant} ThemeVariant
 */

const ThemeContext = createContext({
    /** @type {BrowserTheme} */
    theme: 'light',
    /** @type {ThemeVariant} */
    themeVariant: 'default',
});

/**
 * @param {object} props
 * @param {import('preact').ComponentChild} props.children
 * @param {BrowserTheme | undefined} props.initialTheme
 * @param {ThemeVariant | undefined} props.initialThemeVariant
 */
export function ThemeProvider({ children, initialTheme, initialThemeVariant }) {
    const { isDarkMode } = useEnv();
    const { messaging } = useMessaging();

    // Track explicit theme updates from onThemeUpdate subscription
    const [explicitTheme, setExplicitTheme] = useState(/** @type {BrowserTheme | undefined} */ (undefined));
    const [explicitThemeVariant, setExplicitThemeVariant] = useState(/** @type {ThemeVariant | undefined} */ (undefined));

    useEffect(() => {
        if (!messaging) return;
        const unsubscribe = messaging.onThemeUpdate((data) => {
            setExplicitTheme(data.theme);
            setExplicitThemeVariant(data.themeVariant);
        });
        return unsubscribe;
    }, [messaging]);

    // Derive theme from explicit updates, initial theme, or system preference (in that order)
    const theme = explicitTheme ?? initialTheme ?? (isDarkMode ? 'dark' : 'light');
    const themeVariant = explicitThemeVariant ?? initialThemeVariant ?? 'default';

    // Sync theme attributes to <body>
    useEffect(() => {
        document.body.dataset.theme = theme;
    }, [theme]);
    useEffect(() => {
        document.body.dataset.themeVariant = themeVariant;
    }, [themeVariant]);

    return <ThemeContext.Provider value={{ theme, themeVariant }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    return useContext(ThemeContext);
}
