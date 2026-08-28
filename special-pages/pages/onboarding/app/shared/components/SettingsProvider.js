import { h, createContext } from 'preact';
import { useContext, useMemo } from 'preact/hooks';

/**
 * @typedef {object} SettingsContextValue
 * @property {{name: ImportMeta['platform']}|undefined} [platform]
 * @property {'title'|null} typingEffect
 * @property {boolean} showSkip
 */

const SettingsContext = createContext(/** @type {SettingsContextValue} */ ({}));

/**
 * @param {object} params
 * @param {{name: ImportMeta['platform']}} [params.platform]
 * @param {'title'|null} [params.typingEffect]
 * @param {boolean} [params.showSkip]
 * @param {import("preact").ComponentChild} params.children
 */
export function SettingsProvider({ platform, typingEffect = 'title', showSkip = false, children }) {
    const value = useMemo(() => ({ platform, typingEffect, showSkip }), [platform, typingEffect, showSkip]);
    return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
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

export function useShowSkip() {
    return useContext(SettingsContext).showSkip;
}
