import { createContext, h } from 'preact'
import { useContext } from 'preact/hooks'

/**
 * @typedef {import("../../../types/special-error.js").InitialSetupResponse['errorData']} ErrorData
 */

export const ErrorDataContext = createContext({
    /** @type {ErrorData} */
    errorData: {
        kind: 'phishing'
    }
})

/**
 * A component that provides information about the error page.
 *
 * @param {Object} props - The component props.
 * @param {import("preact").ComponentChild} [props.children] - The child elements.
 * @param {ErrorData} props.errorData - The error data object.
 */
export function ErrorDataProvider ({ children, errorData }) {
    return (
        <ErrorDataContext.Provider value={{ errorData }}>{children}</ErrorDataContext.Provider>
    )
}

export function useErrorData () {
    return useContext(ErrorDataContext).errorData
}
