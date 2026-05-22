import { useTypedTranslationWith } from '../../types';

/**
 * @typedef {import('../strings.json')} Strings
 * @typedef {import('../utils').Suffix} Suffix
 */

/**
 * @param {Suffix} suffix
 * @returns {string}
 */
export function useSuffixText(suffix) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    if (!suffix) return '';
    switch (suffix.kind) {
        case 'searchDuckDuckGo':
            return ' – ' + t('omnibar_searchDuckDuckGoSuffix');
        case 'duckDuckGo':
            return ' – ' + t('omnibar_duckDuckGoSuffix');
        case 'visit':
            return ' – ' + t('omnibar_visitSuffix', { url: suffix.url });
        case 'raw':
            return ' – ' + suffix.text;
        case 'askDuckAi':
            return ' – ' + t('omnibar_askDuckAiSuffix');
    }
}

/**
 * @param {object} props
 * @param {Suffix} props.suffix
 */
export function SuffixText({ suffix }) {
    return useSuffixText(suffix);
}
