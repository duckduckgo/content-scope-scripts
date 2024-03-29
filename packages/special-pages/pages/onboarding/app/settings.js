import { createContext, h } from 'preact'
import { useEffect, useState } from 'preact/hooks'

export const SettingsContext = createContext({
    isReducedMotion: /** @type {boolean} */(false),
    isDarkMode: /** @type {boolean} */(false),
    debugState: /** @type {boolean} */(false),
    platform: /** @type {'apple' | 'windows'} */('windows'),
    willThrow: /** @type {boolean} */(false)
})

const QUERY = '(prefers-color-scheme: dark)'
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Provide settings for the application.
 *
 * @param {Object} props - The props for the settings provider.
 * @param {import("preact").ComponentChild} props.children - The children components to be wrapped by the settings provider.
 * @param {boolean} props.debugState - The flag indicating if debug state is enabled.
 * @param {'windows' | 'apple'} [props.platform] - The flag indicating if debug state is enabled.
 * @param {boolean} [props.willThrow] - used to simulate a fatal exception
 */
export function SettingsProvider ({ children, debugState, willThrow = false, platform = 'windows' }) {
    const [theme, setTheme] = useState(window.matchMedia(QUERY).matches ? 'dark' : 'light')
    const [isReducedMotion, setReducedMotion] = useState(window.matchMedia(REDUCED_MOTION_QUERY).matches)

    useEffect(() => {
        const mediaQueryList = window.matchMedia(QUERY)
        const listener = (e) => setTheme(e.matches ? 'dark' : 'light')
        mediaQueryList.addEventListener('change', listener)
        return () => mediaQueryList.removeEventListener('change', listener)
    }, [])

    useEffect(() => {
        // media query
        const mediaQueryList = window.matchMedia(REDUCED_MOTION_QUERY)
        const listener = (e) => setReducedMotion(e.matches)
        mediaQueryList.addEventListener('change', listener)

        // toggle events on window
        window.addEventListener('toggle-reduced-motion', () => {
            setReducedMotion(true)
            document.documentElement.dataset.reducedMotion = String(true)
        })
        return () => mediaQueryList.removeEventListener('change', listener)
    }, [])

    return (
        <SettingsContext.Provider value={{
            isReducedMotion,
            debugState,
            isDarkMode: theme === 'dark',
            platform,
            willThrow
        }}>{children}</SettingsContext.Provider>
    )
}

/**
 * Update settings based on provided search query.
 *
 * Note: This is here to simulate exactly what native platforms may trigger during their tests
 *
 * ```js
 * window.dispatchEvent(new CustomEvent('toggle-reduced-motion'))
 * ```
 *
 * @param {object} props
 * @param {string} props.search
 */
export function UpdateSettings ({ search }) {
    useEffect(() => {
        const params = new URLSearchParams(search)
        if (params.has('reduced-motion')) {
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('toggle-reduced-motion'))
            }, 0)
        }
    }, [search])
    return null
}
