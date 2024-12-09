import { h } from 'preact';
import { useTypedTranslation } from '../types';
import { useErrorData } from '../providers/SpecialErrorProvider';
import { Trans } from '../../../../shared/components/TranslationsProvider';
import { phishingMalwareHelpPageURL, reportSiteAsSafeFormURL } from '../constants';

/**
 * @param {string} urlString
 * @returns {string}
 */
const sanitizeURL = (urlString) => {
    if (!urlString) return '';

    try {
        const url = new URL(urlString);

        return `${url.origin}${url.pathname}`;
    } catch (error) {
        return '';
    }
};

/**
 * @typedef {object} AnchorTagParams
 * @property {string} href
 * @property {string} target
 */

const helpPageAnchorTagParams = {
    href: phishingMalwareHelpPageURL,
    target: '_blank',
};

/** @type {(url: string) => AnchorTagParams} */
const reportSiteAnchorTagParams = (urlParam) => {
    const sanitizedURLParam = sanitizeURL(urlParam);
    const url = new URL(reportSiteAsSafeFormURL);
    url.searchParams.set('url', sanitizedURLParam);

    return {
        href: url.toString(),
        target: '_blank',
    };
};

/**
 * @typedef {import("../../types/special-error.js").InitialSetupResponse['errorData']} ErrorData
 * @typedef {import("../../types/special-error.js").SSLExpiredCertificate} SSLExpiredCertificate
 * @typedef {import("../../types/special-error.js").SSLInvalidCertificate} SSLInvalidCertificate
 * @typedef {import("../../types/special-error.js").SSLSelfSignedCertificate} SSLSelfSignedCertificate
 * @typedef {import("../../types/special-error.js").SSLWrongHost} SSLWrongHost
 * @typedef {import("../../types/special-error.js").PhishingAndMalware} PhishingAndMalware
 * @typedef {SSLExpiredCertificate|SSLInvalidCertificate|SSLSelfSignedCertificate|SSLWrongHost} SSLError
 */

/**
 * @returns {string}
 */
export function useWarningHeading() {
    const { t } = useTypedTranslation();
    const { kind } = useErrorData();

    if (kind === 'phishing') {
        return t('phishingPageHeading');
    }

    if (kind === 'malware') {
        return t('malwarePageHeading');
    }

    if (kind === 'ssl') {
        return t('sslPageHeading');
    }

    throw new Error(`Unhandled error kind ${kind}`);
}

/**
 * @returns {(string|import("preact/src/jsx").JSXInternal.Element)[]}
 */
export function useWarningContent() {
    const { t } = useTypedTranslation();
    const errorData = useErrorData();
    const { kind } = useErrorData();

    if (kind === 'phishing') {
        return [<Trans str={t('phishingWarningText')} values={{ a: helpPageAnchorTagParams }} />];
    }

    if (kind === 'malware') {
        return [<Trans str={t('malwareWarningText')} values={{ a: helpPageAnchorTagParams }} />];
    }

    if (kind === 'ssl') {
        const { domain } = /** @type {SSLError}} */ (errorData);
        return [<Trans str={t('sslWarningText', { domain })} values="" />];
    }

    throw new Error(`Unhandled error kind ${kind}`);
}

/**
 * @returns {string|import("preact/src/jsx").JSXInternal.Element}
 */
export function useAdvancedInfoHeading() {
    const { t } = useTypedTranslation();
    const errorData = useErrorData();
    const { kind } = errorData;

    if (kind === 'phishing' || kind === 'malware') {
        const { url } = /** @type {PhishingAndMalware} */ (errorData);
        const anchorTagParams = reportSiteAnchorTagParams(url);
        const translatioKey = kind === 'phishing' ? 'phishingAdvancedInfoHeading' : 'malwareAdvancedInfoHeading';

        return <Trans str={t(translatioKey)} values={{ a: anchorTagParams }} />;
    }

    if (kind === 'ssl') {
        return t('sslAdvancedInfoHeading');
    }

    throw new Error(`Unhandled error kind ${kind}`);
}

/**
 * @returns {(string|import("preact/src/jsx").JSXInternal.Element)[]}
 */
export function useAdvancedInfoContent() {
    const { t } = useTypedTranslation();
    const errorData = useErrorData();
    const { kind } = errorData;

    if (kind === 'phishing' || kind === 'malware') {
        return [];
    }

    if (kind === 'ssl') {
        const { errorType, domain } = /** @type {SSLError}} */ (errorData);
        switch (errorType) {
            case 'expired':
                return [<Trans str={t('sslExpiredAdvancedInfoText', { domain })} values="" />];
            case 'invalid':
                return [<Trans str={t('sslInvalidAdvancedInfoText', { domain })} values="" />];
            case 'selfSigned':
                return [<Trans str={t('sslSelfSignedAdvancedInfoText', { domain })} values="" />];
            case 'wrongHost':
                const { eTldPlus1 } = /** @type {SSLWrongHost} */ (errorData);
                return [<Trans str={t('sslWrongHostAdvancedInfoText', { domain, eTldPlus1 })} values="" />];
            default:
                throw new Error(`Unhandled SSL error type ${errorType}`);
        }
    }

    throw new Error(`Unhandled error kind ${kind}`);
}
