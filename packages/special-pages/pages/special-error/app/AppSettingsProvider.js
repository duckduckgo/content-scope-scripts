import { createContext, h } from 'preact'
import { useContext, useState } from 'preact/hooks'

/**
 * @typedef {Pick<import("../../../types/special-error.js").InitialSetupResponse, "errorData" | "platform">} AppSettings
 */
/**
 * @typedef {(key: string, replacements?: Record<string, any>) => string} LocalTranslationFn
 */

export const AppSettingsContext = createContext({
    /** @type {AppSettings['platform']['name']} */
    platformName: ('macos'),
    /** @type {(value: AppSettings['platform']['name']) => void} */
    updatePlatformName: () => {},
    /** @type {AppSettings['errorData']} */
    errorData: ({
        kind: 'phishing'
    }),
    /** @type {(value: AppSettings['errorData']) => void} */
    updateErrorData: () => {}
})

/**
 * A component that provides information about the error page.
 *
 * @param {Object} props - The component props.
 * @param {import("preact").ComponentChild} [props.children] - The child elements.
 * @param {AppSettings['platform']['name']} props.platformName - The browser platform.
 * @param {AppSettings['errorData']} props.errorData - The error data object.
 */
export function AppSettingsProvider ({ children, platformName: initialPlatformName, errorData: initialErrorData }) {
    const [platformName, setPlatformName] = useState(initialPlatformName)
    const [errorData, setErrorData] = useState(initialErrorData)

    console.log('P', platformName)

    /**
     * @param {AppSettings['platform']['name']} value
     */
    const updatePlatformName = value => {
        console.log('SET PLAT', value)
        setPlatformName(value)
    }

    /**
     * @param {AppSettings['errorData']} value
     */
    const updateErrorData = value => setErrorData(value)

    return (
        <AppSettingsContext.Provider value={{ platformName, updatePlatformName, errorData, updateErrorData }}>{children}</AppSettingsContext.Provider>
    )
}

export function useErrorData () {
    const { errorData, updateErrorData } = useContext(AppSettingsContext)
    return { errorData, updateErrorData }
}

export function usePlatformName () {
    const context = useContext(AppSettingsContext)
    return { platformName: context.platformName, updatePlatformName: context.updatePlatformName }
}
