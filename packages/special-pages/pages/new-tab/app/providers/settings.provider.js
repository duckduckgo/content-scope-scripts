import { h, createContext } from 'preact'

const SettingsContext = createContext(/** @type {{settings: import("../settings").Settings}} */({}))

/**
 * @param {object} params
 * @param {import("../settings").Settings} params.settings
 * @param {import("preact").ComponentChild} params.children
 */
export function SettingsProvider ({ settings, children }) {
    return (
        <SettingsContext.Provider value={{ settings }}>
            {children}
        </SettingsContext.Provider>
    )
}
