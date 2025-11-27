import { createContext, h } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';
import { useMessaging } from '../../types.js';
import { useEnv } from '../../../../../shared/components/EnvironmentProvider.js';

/**
 * @typedef {import('../../../types/history').BrowserTheme} BrowserTheme
 * @typedef {import('../../../types/history').ThemeVariant} ThemeVariant
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
    const history = useMessaging();

    // Use initial theme from messaging, or fall back to system preference
    const [theme, setTheme] = useState(initialTheme ?? (isDarkMode ? 'dark' : 'light'));
    const [themeVariant, setThemeVariant] = useState(initialThemeVariant ?? 'default');

    useEffect(() => {
        const unsubscribe = history.messaging.subscribe('onThemeUpdate', (data) => {
            setTheme(data.theme);
            setThemeVariant(data.themeVariant);
        });
        return unsubscribe;
    }, [history]);

    return <ThemeContext.Provider value={{ theme, themeVariant }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    return useContext(ThemeContext);
}
