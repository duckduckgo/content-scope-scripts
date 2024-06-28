import { useContext } from 'preact/hooks'
import { TranslationContext } from '../../../shared/components/TranslationsProvider.js'

/**
 * @typedef {'PrivacyPro'} NotesIcon // Allows for more icons to be added in the future
 * @typedef {{ icon?: NotesIcon, title?: string, notes: string[] }} Notes
 */

/**
 * This is a wrapper to only allow keys from the default translation file
 * @type {() => { t: (key: keyof import('../src/locales/en/release-notes.json'), replacements?: Record<string, string>) => string }}
 */
export function useTypedTranslation () {
    return {
        t: useContext(TranslationContext).t
    }
}
