import { createContext, h } from 'preact'

export const SettingsContext = createContext({
    isReducedMotion: /** @type {boolean} */(false)
})

export function SettingsProvider ({ children, isReducedMotion }) {
    return (
        <SettingsContext.Provider value={{ isReducedMotion }}>{children}</SettingsContext.Provider>
    )
}
