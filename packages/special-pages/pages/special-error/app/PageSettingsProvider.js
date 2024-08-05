import { createContext, h } from 'preact'
import { useContext } from 'preact/hooks'

/**
 * @typedef {Pick<import("../../../types/special-error.js").InitialSetupResponse, "errorData" | "platform">} PageSettings
 */

export const PageSettingsContext = createContext({
    errorData: /** @type {PageSettings['errorData']} */({
        kind: 'phishing'
    }),
    platformName: /** @type {PageSettings['platform']['name']} */('macos')
})

/**
 * A component that provides information about the error page.
 *
 * @param {Object} props - The component props.
 * @param {import("preact").ComponentChild} [props.children] - The child elements.
 * @param {PageSettings['platform']['name']} props.platformName - The browser platform.
 * @param {PageSettings['errorData']} props.errorData - The error data object.
 */
export function PageSettingsProvider ({ children, platformName, errorData }) {
    return (
        <PageSettingsContext.Provider value={{ platformName, errorData }}>{children}</PageSettingsContext.Provider>
    )
}

export function useErrorData () {
    return useContext(PageSettingsContext).errorData
}

export function usePlatformName () {
    return useContext(PageSettingsContext).platformName
}
