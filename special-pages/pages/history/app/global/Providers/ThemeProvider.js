import { createContext, h } from 'preact';
import { useContext, useEffect, useLayoutEffect, useState } from 'preact/hooks';
import { useMessaging } from '../../types.js';

/**
 * @typedef {import('../../../types/history').BrowserTheme} BrowserTheme
 * @typedef {import('../../../types/history').ThemeVariant} ThemeVariant
 */

const ThemeContext = createContext({
    /** @type {'light' | 'dark'} */
    theme: 'light',
    /** @type {ThemeVariant} */
    themeVariant: 'default',
});

const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

/**
 * Hook that tracks the system color scheme preference via media query.
 * @return {'light' | 'dark'}
 */
function useSystemTheme() {
    const [systemTheme, setSystemTheme] = useState(/** @type {'light' | 'dark'} */ (darkModeMediaQuery.matches ? 'dark' : 'light'));

    useEffect(() => {
        const listener = (e) => setSystemTheme(e.matches ? 'dark' : 'light');
        darkModeMediaQuery.addEventListener('change', listener);
        return () => darkModeMediaQuery.removeEventListener('change', listener);
    }, []);

    return systemTheme;
}

/**
 * @param {object} props
 * @param {import('preact').ComponentChild} props.children
 * @param {BrowserTheme | undefined} props.initialTheme
 * @param {ThemeVariant | undefined} props.initialThemeVariant
 */
export function ThemeProvider({ children, initialTheme, initialThemeVariant }) {
    const history = useMessaging();
    const systemTheme = useSystemTheme();

    // Track explicit theme updates from onThemeUpdate subscription
    const [explicitTheme, setExplicitTheme] = useState(/** @type {BrowserTheme | undefined} */ (undefined));
    const [explicitThemeVariant, setExplicitThemeVariant] = useState(/** @type {ThemeVariant | undefined} */ (undefined));

    useEffect(() => {
        const unsubscribe = history.onThemeUpdate((data) => {
            setExplicitTheme(data.theme);
            setExplicitThemeVariant(data.themeVariant);
        });
        return unsubscribe;
    }, [history]);

    // Derive theme from explicit updates, initial theme, or system preference (in that order)
    const browserTheme = explicitTheme ?? initialTheme ?? 'system';
    const themeVariant = explicitThemeVariant ?? initialThemeVariant ?? 'default';
    const theme = browserTheme === 'system' ? systemTheme : browserTheme;

    // Sync theme attributes to <body>
    useLayoutEffect(() => {
        document.body.dataset.theme = theme;
    }, [theme]);
    useLayoutEffect(() => {
        document.body.dataset.themeVariant = themeVariant;
    }, [themeVariant]);

    return <ThemeContext.Provider value={{ theme, themeVariant }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    return useContext(ThemeContext);
}
