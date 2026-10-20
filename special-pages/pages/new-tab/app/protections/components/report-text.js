import { createContext } from 'preact';
import { useContext, useMemo } from 'preact/hooks';
import { useTypedTranslationWith } from '../../types.js';
import { useLocale } from '../../../../../shared/components/EnvironmentProvider.js';
import { getLocalizedNumberFormatter } from '../../../../../shared/utils.js';

/**
 * @import enStrings from "../strings.json"
 * @typedef {enStrings} Strings
 */

/**
 * Who the report speaks to. On the page it addresses the reader ("trackers
 * tried to watch you"); in the picture they share, it speaks as them
 * ("trackers tried to watch me", "DuckDuckGo blocked…").
 *
 * @typedef {'you' | 'me'} Voice
 */
export const VoiceContext = createContext(/** @type {Voice} */ ('you'));

/**
 * Strings with a first-person version (the same key plus `FirstPerson`), used
 * in the shared picture. Everything else reads the same either way.
 *
 * @type {Set<keyof Strings>}
 */
const FIRST_PERSON = new Set(
    /** @type {(keyof Strings)[]} */ ([
        'protections_report_headlineSingular',
        'protections_report_headlinePlural',
        'protections_report_blockedSingular',
        'protections_report_blockedPlural',
        'protections_report_cookiePopUpsSingular',
        'protections_report_cookiePopUpsPlural',
        'protections_report_viewPurposes',
        'protections_report_viewCompanies',
        'protections_report_viewRecognition',
        'protections_report_viewTopSites',
        'protections_report_purposeAdvertising',
        'protections_report_purposeSocial',
        'protections_report_purposeFingerprinting',
        'protections_report_purposeSessionReplay',
        'protections_report_purposeAnalytics',
        'protections_report_purposeAdvertisingInline',
        'protections_report_purposeSocialInline',
        'protections_report_purposeFingerprintingInline',
        'protections_report_purposeSessionReplayInline',
        'protections_report_purposeAnalyticsInline',
        'protections_report_freqNearlyAll',
        'protections_report_freqFourInFive',
        'protections_report_freqTwoInThree',
        'protections_report_freqMoreThanHalf',
        'protections_report_freqHalf',
        'protections_report_freqAlmostHalf',
        'protections_report_freqOneInThree',
        'protections_report_freqMoreThanOneInFour',
        'protections_report_freqOneInFive',
        'protections_report_freqSitesSingular',
        'protections_report_freqSitesPlural',
        'protections_report_recognitionIntroSingular',
        'protections_report_recognitionIntroPlural',
        'protections_report_recognitionFooter',
        'protections_report_compareIntro',
        'protections_report_compareFootnote',
        'protections_report_compareGoogleSingular',
        'protections_report_compareGooglePlural',
    ]),
);

/**
 * Translations in the report's current voice (see `VoiceContext`).
 */
export function useReportTranslation() {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const voice = useContext(VoiceContext);
    return {
        /**
         * @param {keyof Strings} key
         * @param {Record<string, string>} [values]
         */
        t: (key, values) => t(voice === 'me' && FIRST_PERSON.has(key) ? /** @type {keyof Strings} */ (`${key}FirstPerson`) : key, values),
    };
}

/**
 * Numbers and lists in the page's locale, and counted strings in the
 * report's current voice.
 */
export function useReportFormat() {
    const { t } = useReportTranslation();
    const locale = useLocale();
    const numbers = useMemo(() => getLocalizedNumberFormatter(locale), [locale]);
    const lists = useMemo(() => new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }), [locale]);
    return {
        /** @param {number} n */
        number: (n) => numbers.format(n),
        /** @param {string[]} items - joined by the locale's rules, eg: "Google, Facebook, and Amazon" */
        list: (items) => lists.format(items),
        /**
         * @param {number} n
         * @param {keyof Strings} one - the string for exactly 1
         * @param {keyof Strings} many - the string for any other count, with a `{count}` placeholder
         */
        plural: (n, one, many) => (n === 1 ? t(one) : t(many, { count: numbers.format(n) })),
    };
}
