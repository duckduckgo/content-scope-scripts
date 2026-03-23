import { h, createContext } from 'preact';
import { useContext } from 'preact/hooks';

/**
 * @typedef {object} SettingsContextValue
 * @property {{name: ImportMeta['platform']}|undefined} [platform]
 * @property {'title'|null} typingEffect
 */

const SettingsContext = createContext(/** @type {SettingsContextValue} */ ({}));

/**
 * @param {object} params
 * @param {{name: ImportMeta['platform']}} [params.platform]
 * @param {'title'|null} [params.typingEffect]
 * @param {import("preact").ComponentChild} params.children
 */
export function SettingsProvider({ platform, typingEffect = 'title', children }) {
    return <SettingsContext.Provider value={{ platform, typingEffect }}>{children}</SettingsContext.Provider>;
}

export function usePlatformName() {
    return useContext(SettingsContext).platform?.name;
}

/**
 * @returns {'title'|null}
 */
export function useTypingEffect() {
    return useContext(SettingsContext).typingEffect;
}
