import { useContext } from 'preact/hooks';
import { TranslationContext } from '../../../shared/components/TranslationsProvider.js';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import json from './strings.json';
import { createContext } from 'preact';
import { AppSettings } from './AppSettings.js';

/**
 * This is a wrapper to only allow keys from the default translation file
 * @type {() => { t: (key: keyof json, replacements?: Record<string, string>) => string }}
 */
export function useTypedTranslation() {
    return {
        t: useContext(TranslationContext).t,
    };
}

export const MessagingContext = createContext(/** @type {import("../src/index.js").SettingsPage} */ ({}));
export const useMessaging = () => useContext(MessagingContext);
export const AppSettingsContext = createContext(new AppSettings({ platform: { name: 'macos' } }));
export const useSettings = () => useContext(AppSettingsContext);

export function usePlatformName() {
    return useContext(AppSettingsContext).platform.name;
}
