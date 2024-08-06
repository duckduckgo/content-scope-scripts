import { createContext, h } from 'preact'
import { useContext, useState } from 'preact/hooks'

export const UIContext = createContext({
    showAdvancedInfo: false,
    advancedButtonHandler: () => {}
})

/**
 * A component that holds info and functionality for the page UI.
 *
 * @param {Object} props - The component props.
 * @param {import("preact").ComponentChild} [props.children] - The child elements.
 */
export function UIProvider ({ children }) {
    const [showAdvancedInfo, setShowAdvancedInfo] = useState(false)
    const advancedButtonHandler = () => setShowAdvancedInfo(value => !value)

    return (
        <UIContext.Provider value={{ showAdvancedInfo, advancedButtonHandler }}>{children}</UIContext.Provider>
    )
}

export function useAdvancedInfo () {
    const { showAdvancedInfo, advancedButtonHandler } = useContext(UIContext)
    return { showAdvancedInfo, advancedButtonHandler }
}
