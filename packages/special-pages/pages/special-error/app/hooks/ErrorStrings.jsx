import { useTypedTranslation } from "../types"
import { useErrorData } from "../AppSettingsProvider";
import { Trans } from "../../../../shared/components/TranslationsProvider";
import { phishingHelpPageURL } from "../constants";

const phishingAnchorTagValues = {
    href: phishingHelpPageURL,
    target: 'blank'
}

/**
 * @typedef {import("../../../../types/special-error.js").InitialSetupResponse['errorData']} ErrorData
 * @typedef {import("../../../../types/special-error.js").SSLExpiredCertificate} SSLExpiredCertificate
 * @typedef {import("../../../../types/special-error.js").SSLInvalidCertificate} SSLInvalidCertificate
 * @typedef {import("../../../../types/special-error.js").SSLSelfSignedCertificate} SSLSelfSignedCertificate
 * @typedef {import("../../../../types/special-error.js").SSLWrongHost} SSLWrongHost
 * @typedef {SSLExpiredCertificate|SSLInvalidCertificate|SSLSelfSignedCertificate|SSLWrongHost} SSLError
 */

/**
 * @returns {string}
 */
export function useWarningHeading() {
    const { t } = useTypedTranslation()
    const { errorData } = useErrorData()
    const { kind } = errorData

    if (kind === 'phishing') {
        return t('phishingPageHeading')
    }

    if (kind === 'ssl') {
        return t('sslPageHeading')
    }

    throw new Error(`Unhandled error kind ${kind}`)
}

/**
 * @returns {(string|import("preact/src/jsx").JSXInternal.Element)[]}
 */
export function useWarningContent() {
    const { t } = useTypedTranslation()
    const { errorData } = useErrorData()
    const { kind } = errorData

    if (kind === 'phishing') {
        return [Trans({
            str: t('phishingWarningText'),
            values: { a: phishingAnchorTagValues }
        })]
    }

    if (kind === 'ssl') {
        const { errorType, domain } = /** @type {SSLError}} */(errorData)
        switch (errorType) {
            case 'expired':
                return [t('sslExpiredWarningText', { domain })]
            case 'invalid':
                return [t('sslInvalidWarningText', { domain })]
            case 'selfSigned':
                return [t('sslSelfSignedWarningText', { domain })]
            case 'wrongHost':
                const { eTldPlus1 } = /** @type {SSLWrongHost} */(errorData)
                return [t('sslWrongHostWarningText', { domain, eTldPlus1 })]
            default:
                throw new Error(`Unhandled SSL error type ${errorType}`)
        }
    }

    throw new Error(`Unhandled error kind ${kind}`)
}

/**
 * @returns {string|import("preact/src/jsx").JSXInternal.Element}
 */
export function useAdvancedInfoHeading() {
    const { t } = useTypedTranslation()
    const { errorData } = useErrorData()
    const { kind } = errorData

    if (kind === 'phishing') {
        return t('phishingAdvancedInfoHeading')
    }

    if (kind === 'ssl') {
        return t('sslAdvancedInfoHeading')
    }

    throw new Error(`Unhandled error kind ${kind}`)
}

/**
 * @returns {(string|import("preact/src/jsx").JSXInternal.Element)[]}
 */
export function useAdvancedInfoContent() {
    const { t } = useTypedTranslation()
    const { errorData } = useErrorData()
    const { kind } = errorData

    if (kind === 'phishing') {
        return [
            t('phishingAdvancedInfoText_1'),
            Trans({
                str: t('phishingAdvancedInfoText_2'),
                values: { a: phishingAnchorTagValues }
            })
        ]
    }

    if (kind === 'ssl') {
        const { errorType, domain } = /** @type {SSLError}} */(errorData)
        switch (errorType) {
            case 'expired':
                return [t('sslExpiredAdvancedInfoText')]
            case 'invalid':
                return [t('sslInvalidAdvancedInfoText')]
            case 'selfSigned':
                return [t('sslSelfSignedAdvancedInfoText')]
            case 'wrongHost':
                return [t('sslWrongHostWarningText')]
            default:
                throw new Error(`Unhandled SSL error type ${errorType}`)
        }
    }

    throw new Error(`Unhandled error kind ${kind}`)
}
