import { createContext, h } from 'preact'
import {useContext, useEffect, useState} from 'preact/hooks'

/**
 * A container for environment related settings/updates
 */
export class Environment {
    /**
     * @param {object} params
     * @param {'app' | 'components'} [params.display] - whether to show the application or component list
     * @param {'production' | 'development'} [params.env] - whether to show the application or component list
     * @param {URLSearchParams} [params.urlParams] - whether to show the application or component list
     * @param {ImportMeta['injectName']} [params.platform] - whether to show the application or component list
     * @param {boolean} [params.willThrow] - whether the application will simulate an error
     * @param {boolean} [params.debugState] - whether to show debugging UI
     */
    constructor({
        display = 'app',
        env = 'production',
        urlParams = new URLSearchParams(location.search),
        platform = 'windows',
        willThrow = urlParams.has('willthrow'),
        debugState = urlParams.has('debugState'),
    } = {}) {
        this.display = display;
        this.urlParams = urlParams;
        this.platform = platform;
        this.willThrow = willThrow;
        this.debugState = debugState;
        this.env = env;
    }

    /**
     * @param {string|null|undefined} platform
     * @returns {Environment}
     */
    withPlatform(platform) {
        if (!platform) return this
        if (!isPlatform(platform)) return this
        return new Environment({
            ...this,
            platform
        })
    }

    /**
     * @param {string|null|undefined} env
     * @returns {Environment}
     */
    withEnv(env) {
        if (!env) return this;
        if (env !== 'production' && env !== 'development') return this;

        return new Environment({
            ...this,
            env,
        })
    }
}

/**
 * @param {any} input
 * @returns {input is ImportMeta['injectName']}
 */
function isPlatform (input) {
    /** @type {ImportMeta['injectName'][]} */
    const allowed = ['windows', 'apple', 'integration']
    return allowed.includes(input)
}

const EnvironmentContext = createContext({
    isReducedMotion: /** @type {boolean} */(false),
    isDarkMode: /** @type {boolean} */(false),
    debugState: /** @type {boolean} */(false),
    platform: /** @type {ImportMeta['injectName']} */('windows'),
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
 * @param {ImportMeta['injectName']} [props.platform] - The flag indicating if debug state is enabled.
 * @param {boolean} [props.willThrow] - used to simulate a fatal exception
 */
export function EnvironmentProvider ({ children, debugState, willThrow = false, platform = 'windows' }) {
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
        <EnvironmentContext.Provider value={{
            isReducedMotion,
            debugState,
            isDarkMode: theme === 'dark',
            platform,
            willThrow
        }}>{children}</EnvironmentContext.Provider>
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
export function UpdateEnvironment ({ search }) {
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

export function useEnv() {
    return useContext(EnvironmentContext)
}
