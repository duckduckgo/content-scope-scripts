import { h, createContext } from 'preact';
import { useContext } from 'preact/hooks';

/** @import {Settings} from '../settings' */

const SettingsContext = createContext(/** @type {{settings: Settings}} */ ({}));

/**
 * @param {object} params
 * @param {Settings} params.settings
 * @param {import("preact").ComponentChild} params.children
 */
export function SettingsProvider({ settings, children }) {
    return <SettingsContext.Provider value={{ settings }}>{children}</SettingsContext.Provider>;
}

export function usePlatformName() {
    return useContext(SettingsContext).settings.platform?.name;
}

export function useIsMobile() {
    const platformName = useContext(SettingsContext).settings.platform?.name;
    return platformName === 'android' || platformName === 'ios';
}
