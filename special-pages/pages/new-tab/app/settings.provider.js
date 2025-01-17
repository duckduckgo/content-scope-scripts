import { h, createContext } from 'preact';
import { useContext } from 'preact/hooks';

const SettingsContext = createContext(/** @type {{settings: import("./settings.js").Settings}} */ ({}));

/**
 * @param {object} params
 * @param {import("./settings.js").Settings} params.settings
 * @param {import("preact").ComponentChild} params.children
 */
export function SettingsProvider({ settings, children }) {
    return <SettingsContext.Provider value={{ settings }}>{children}</SettingsContext.Provider>;
}

export function usePlatformName() {
    return useContext(SettingsContext).settings.platform.name;
}

export function useCustomizerDrawerSettings() {
    return useContext(SettingsContext).settings.customizerDrawer;
}

/**
 * @returns {"menu" | "drawer"}
 */
export function useCustomizerKind() {
    const settings = useContext(SettingsContext).settings;
    return settings.customizerDrawer.state === 'enabled' ? 'drawer' : 'menu';
}
