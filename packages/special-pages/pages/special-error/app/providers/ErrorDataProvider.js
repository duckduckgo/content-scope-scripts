import { createContext, h } from 'preact'
import { useContext, useState } from 'preact/hooks'

/**
 * @typedef {Pick<import("../../../../types/special-error.js").InitialSetupResponse, "errorData" | "platform">} ErrorData
 */
/**
 * @typedef {(key: string, replacements?: Record<string, any>) => string} LocalTranslationFn
 */

export const ErrorDataContext = createContext({
    /** @type {ErrorData['platform']['name']} */
    platformName: ('macos'),
    /** @type {(value: ErrorData['platform']['name']) => void} */
    updatePlatformName: () => {},
    /** @type {ErrorData['errorData']} */
    errorData: ({
        kind: 'phishing'
    }),
    /** @type {(value: ErrorData['errorData']) => void} */
    updateErrorData: () => {}
})

/**
 * A component that provides information about the error page.
 *
 * @param {Object} props - The component props.
 * @param {import("preact").ComponentChild} [props.children] - The child elements.
 * @param {ErrorData['platform']['name']} props.platformName - The browser platform.
 * @param {ErrorData['errorData']} props.errorData - The error data object.
 */
export function ErrorDataProvider ({ children, platformName: initialPlatformName, errorData: initialErrorData }) {
    const [platformName, setPlatformName] = useState(initialPlatformName)
    const [errorData, setErrorData] = useState(initialErrorData)

    /**
     * @param {ErrorData['platform']['name']} value
     */
    const updatePlatformName = value => {
        setPlatformName(value)
    }

    /**
     * @param {ErrorData['errorData']} value
     */
    const updateErrorData = value => setErrorData(value)

    return (
        <ErrorDataContext.Provider value={{ platformName, updatePlatformName, errorData, updateErrorData }}>{children}</ErrorDataContext.Provider>
    )
}

export function useErrorData () {
    const { errorData, updateErrorData } = useContext(ErrorDataContext)
    return { errorData, updateErrorData }
}

export function usePlatformName () {
    const context = useContext(ErrorDataContext)
    return { platformName: context.platformName, updatePlatformName: context.updatePlatformName }
}
