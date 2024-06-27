import { useContext } from 'preact/hooks'
import { TranslationContext } from '../../../shared/components/TranslationsProvider.js'

/**
 * This is a wrapper to only allow keys from the default translation file
 * @type {() => { t: (key: keyof import('./text.js').i18n['en']['translations'], replacements?: Record<string, string>) => string }}
 */
export function useTypedTranslation () {
    return {
        t: useContext(TranslationContext).t
    }
}
