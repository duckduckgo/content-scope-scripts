import { Fragment, h } from "preact";
import { useState } from "preact/hooks";
import { useTypedTranslation } from "../types"
import { useErrorData } from "../../../release-notes/app/ErrorDataProvider";

import { Warning } from "./Warning";
import { AdvancedInfo } from "./AdvancedInfo";
import { Text } from "../../../../shared/components/Text/Text";

/**
 * @typedef {import("../../../../types/special-error.js").InitialSetupResponse['errorData']} ErrorData
 * @typedef {import("../../../../types/special-error.js").SSLExpiredCertificate} SSLExpiredCertificate
 * @typedef {import("../../../../types/special-error.js").SSLInvalidCertificate} SSLInvalidCertificate
 * @typedef {import("../../../../types/special-error.js").SSLSelfSignedCertificate} SSLSelfSignedCertificate
 * @typedef {import("../../../../types/special-error.js").SSLWrongHost} SSLWrongHost
 * @typedef {SSLExpiredCertificate|SSLInvalidCertificate|SSLSelfSignedCertificate|SSLWrongHost} SSLError
 */

/**
 * @returns {{ warningText: string, advancedInfoText: string }}
 */
function useSSLErrorStrings() {
    const errorData = (useErrorData())
    const { errorType, domain } = /** @type {SSLError}} */(errorData)
    const { t } = useTypedTranslation()

    switch (errorType) {
        case 'expired':
            return {
                warningText: t('sslExpiredWarningText', { domain }),
                advancedInfoText: t('sslExpiredAdvancedInfoText')
            }
        case 'invalid':
            return {
                warningText: t('sslInvalidWarningText', { domain }),
                advancedInfoText: t('sslInvalidAdvancedInfoText')
            }
        case 'selfSigned':
            return {
                warningText: t('sslSelfSignedWarningText', { domain }),
                advancedInfoText: t('sslSelfSignedAdvancedInfoText')
            }
        case 'wrongHost':
            const { eTldPlus1 } = /** @type {SSLWrongHost} */(errorData)
            return {
                warningText: t('sslWrongHostWarningText', { domain, eTldPlus1 }),
                advancedInfoText: t('sslWrongHostAdvancedInfoText')
            }
        default:
            throw new Error(`Unhandled SSL error type ${errorType}`)
    }
}

export function SSLError() {
    const { t } = useTypedTranslation()
    const { warningText, advancedInfoText } = useSSLErrorStrings()

    const [showAdvancedInfo, setShowAdvancedInfo] = useState(false)
    const advancedInfoClickHandler = () => setShowAdvancedInfo(value => !value)

    return (
        <>
            <Warning
                variant="ssl"
                heading={t('sslPageHeading')}
                showAdvancedInfoButton={!showAdvancedInfo}
                advancedInfoClickHandler={advancedInfoClickHandler}>
                <Text as="p" variant="body">{warningText}</Text>
            </Warning>
            { showAdvancedInfo &&
                <AdvancedInfo heading={t('sslAdvancedInfoHeading')}>
                    <Text as="p" variant="body">{advancedInfoText}</Text>
                </AdvancedInfo> }
        </>
    )
}