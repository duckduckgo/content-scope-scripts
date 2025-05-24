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

/**
 * This is a wrapper to only allow keys from the default translation file
 * @type {() => { t: (key: string, replacements?: Record<string, string>) => string }}
 */
export function useTranslation() {
    const fn = useContext(TranslationContext).t;

    return {
        t: (key, params) => {
            const r = fn(key, params);
            if (r === '') {
                console.warn('missing translation for ', key);
                return key;
            }
            return r;
        },
    };
}

/**
 * This is a wrapper to only allow keys from the default translation file + contextual ones
 * @template {Record<string, any>} T
 * @param {T} _context
 * @returns {{ t: (key: keyof json|keyof T, replacements?: Record<string, string>) => string }}
 */
export function useTypedTranslationWith(_context) {
    return {
        /** @type {any} */
        t: useContext(TranslationContext).t,
    };
}

export const MessagingContext = createContext(/** @type {import("../src/index.js").SettingsPage} */ ({}));
export const StringsContext = createContext(/** @type {Record<string, {title: string}>} */ ({}));
export const useMessaging = () => useContext(MessagingContext);
export const AppSettingsContext = createContext(new AppSettings({ platform: { name: 'macos' } }));
export const useSettings = () => useContext(AppSettingsContext);

export function usePlatformName() {
    return useContext(AppSettingsContext).platform.name;
}

export function usePrivateSearchTranslations() {
    return useTypedTranslationWith(/** @type {import("./screens/privateSearch/strings.json") & import("./shared/strings.json")} */ ({}));
}

export function useDefaultBrowserTranslations() {
    return useTypedTranslationWith(/** @type {import("./screens/defaultBrowser/strings.json") & import("./shared/strings.json")} */ ({}));
}

/**
 * @returns {Record<string, {title: string}>}
 */
export function useStrings() {
    return useContext(StringsContext);
}
