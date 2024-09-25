import { h, createContext } from 'preact'

const SettingsContext = createContext(/** @type {{settings: import("./settings.js").Settings}} */({}))

/**
 * @param {object} params
 * @param {import("./settings.js").Settings} params.settings
 * @param {import("preact").ComponentChild} params.children
 */
export function SettingsProvider ({ settings, children }) {
    return (
        <SettingsContext.Provider value={{ settings }}>
            {children}
        </SettingsContext.Provider>
    )
}
