import { h } from 'preact';
import { useTypedTranslation } from '../types';
import { useErrorData } from '../providers/SpecialErrorProvider';
import { Trans } from '../../../../shared/components/TranslationsProvider';
import { phishingHelpPageURL } from '../constants';

const phishingAnchorTagValues = {
    href: phishingHelpPageURL,
    target: 'blank',
};

/**
 * @typedef {import("../../types/special-error.ts").InitialSetupResponse['errorData']} ErrorData
 * @typedef {import("../../types/special-error.ts").SSLExpiredCertificate} SSLExpiredCertificate
 * @typedef {import("../../types/special-error.ts").SSLInvalidCertificate} SSLInvalidCertificate
 * @typedef {import("../../types/special-error.ts").SSLSelfSignedCertificate} SSLSelfSignedCertificate
 * @typedef {import("../../types/special-error.ts").SSLWrongHost} SSLWrongHost
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
        return [<Trans str={t('phishingWarningText')} values={{ a: phishingAnchorTagValues }} />];
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
    const { kind } = useErrorData();

    if (kind === 'phishing') {
        return t('phishingAdvancedInfoHeading');
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

    if (kind === 'phishing') {
        return [t('phishingAdvancedInfoText_1'), <Trans str={t('phishingAdvancedInfoText_2')} values={{ a: phishingAnchorTagValues }} />];
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
