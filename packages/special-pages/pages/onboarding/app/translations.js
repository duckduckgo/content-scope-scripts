import { createContext, h } from 'preact'
import { i18n } from './text'
import { useCallback, useContext } from 'preact/hooks'

export const TranslationContext = createContext({
    /**
     * @param {keyof i18n['en']['translation']} key
     * @return {string}
     */
    t: (key) => {
        return i18n.en.translation[key]
    }
})

export function TranslationProvider ({ children }) {
    const t = useCallback((key) => {
        return i18n.en.translation[key]
    }, [])
    return (
        <TranslationContext.Provider value={{ t }}>{children}</TranslationContext.Provider>
    )
}

export function useTranslation () {
    return useContext(TranslationContext)
}
