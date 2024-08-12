import { h } from "preact"
import { createContext } from "preact";
import { Settings } from "../settings";
import { useContext } from "preact/hooks";

const SettingsContext = createContext(/** @type {{settings: Settings}} */({}))

/**
 * @param {object} params
 * @param {Settings} params.settings
 * @param {import("preact").ComponentChild} params.children
 */
export function SettingsProvider({ settings, children }) {
    return (
        <SettingsContext.Provider value={{settings}}>
            {children}
        </SettingsContext.Provider>
    )
}

export function usePlatformName() {
    return useContext(SettingsContext).settings.platform.name
}