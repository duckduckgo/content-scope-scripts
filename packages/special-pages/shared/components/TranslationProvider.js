import { createContext, h } from 'preact'
import { useCallback, useContext } from 'preact/hooks'

export const TranslationContext = createContext({
    /**
     * @param {string} key
     * @param {Record<string, string>} [replacements]
     * @return {string}
     */
    t: (key, replacements) => {
        throw new Error('must implement')
    }
})

/**
 * @param {object} props
 * @param {import("preact").ComponentChild} props.children
 * @param {{en: Record<string, any>}} props.text
 */
export function TranslationProvider ({ children, text }) {
    const t = useCallback(
        /**
         * @param {string} key
         * @param {Record<string, string>} [replacements]
         */
        (key, replacements) => {
            if (replacements) {
                const regex = RegExp(Object.keys(replacements).map((s) => (`\\{(${s})\\}`)).join('|'), 'gm')
                return text.en.translations[key].title.replace(regex, (_, id) => replacements[id])
            }

            return text.en.translations[key].title
        }, [text])
    return (
        <TranslationContext.Provider value={{ t }}>{children}</TranslationContext.Provider>
    )
}

export function useTranslation () {
    return useContext(TranslationContext)
}
