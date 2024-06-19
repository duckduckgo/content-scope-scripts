import { createContext, h } from 'preact'
import { useCallback, useContext } from 'preact/hooks'

export const TranslationContext = createContext({
    /**
     * @param {string} key
     * @return {string}
     */
    t: (key) => {
        throw new Error('must implement')
    }
})

/**
 * @param {object} props
 * @param {import("preact").ComponentChild} props.children
 * @param {{en: Record<string, any>}} props.text
 */
export function TranslationProvider ({ children, text }) {
    const t = useCallback((key) => {
        return text.en.translations[key].title
    }, [text])
    return (
        <TranslationContext.Provider value={{ t }}>{children}</TranslationContext.Provider>
    )
}

export function useTranslation () {
    return useContext(TranslationContext)
}
