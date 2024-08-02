import { Fragment, h } from "preact";
import { useState } from "preact/hooks";
import { useErrorData } from "../../../release-notes/app/ErrorDataProvider";
import { useTypedTranslation } from "../types";
import { Warning } from "./Warning";
import { AdvancedInfo } from "./AdvancedInfo";
import { Text } from "../../../../shared/components/Text/Text";
import { Trans } from "../../../../shared/components/TranslationsProvider";

import styles from "./App.module.css";

/**
 * @typedef {import("../../../../types/special-error.js").InitialSetupResponse['errorData']} ErrorData
 * @typedef {import("../../../../types/special-error.js").SSLExpiredCertificate} SSLExpiredCertificate
 * @typedef {import("../../../../types/special-error.js").SSLInvalidCertificate} SSLInvalidCertificate
 * @typedef {import("../../../../types/special-error.js").SSLSelfSignedCertificate} SSLSelfSignedCertificate
 * @typedef {import("../../../../types/special-error.js").SSLWrongHost} SSLWrongHost
 * @typedef {SSLExpiredCertificate|SSLInvalidCertificate|SSLSelfSignedCertificate|SSLWrongHost} SSLError
 */

function SSLWarningText() {
    const errorData = (useErrorData())
    const { errorType, domain } = /** @type {SSLError}} */(errorData)
    const { t } = useTypedTranslation()
    let text;

    switch (errorType) {
        case 'expired':
            text = t('sslExpiredWarningText', { domain })
            break
        case 'invalid':
            text = t('sslInvalidWarningText', { domain })
            break
        case 'selfSigned':
            text = t('sslSelfSignedWarningText', { domain })
            break
        case 'wrongHost':
            const { eTldPlus1 } = /** @type {SSLWrongHost} */(errorData)
            text = t('sslWrongHostWarningText', { domain, eTldPlus1 })
        default:
            throw new Error(`Unhandled SSL error type ${errorType}`)
    }

    return <Text as="p" variant="body">{text}</Text>
}

function SSLAdvancedInfoText() {
    const errorData = (useErrorData())
    const { errorType } = /** @type {SSLError}} */(errorData)
    const { t } = useTypedTranslation()
    let text;

    switch (errorType) {
        case 'expired':
            text = t('sslExpiredAdvancedInfoText')
            break
        case 'invalid':
            text = t('sslInvalidAdvancedInfoText')
            break
        case 'selfSigned':
            text = t('sslSelfSignedAdvancedInfoText')
            break
        case 'wrongHost':
            text = t('sslWrongHostAdvancedInfoText')
        default:
            throw new Error(`Unhandled SSL error type ${errorType}`)
    }

    return <Text as="p" variant="body">{text}</Text>
}

function SSLError() {
    const { t } = useTypedTranslation()
    const [advancedInfo, setAdvancedInfo] = useState(false)
    const advancedInfoToggle = () => setAdvancedInfo(value => !value)

    return (
        <>
            <Warning variant="ssl" heading={t('sslPageHeading')} advancedInfo={advancedInfo} advancedButtonHandler={advancedInfoToggle}>
                <SSLWarningText />
            </Warning>
            { advancedInfo &&
                <AdvancedInfo heading={t('sslAdvancedInfoHeading')}>
                    <SSLAdvancedInfoText />
                </AdvancedInfo> }
        </>
    )
}

/**
 * @param {object} props
 */
function PhishingError(props) {
    const { t } = useTypedTranslation()
    const [advancedInfo, setAdvancedInfo] = useState(false)
    const advancedInfoToggle = () => setAdvancedInfo(value => !value)

    const warningText = Trans({
        str: t('phishingWarningText'),
        values: {
            a: {
                href: 'https://duckduckgo.com/duckduckgo-help-pages/privacy/phishing-and-malware-protection/',
                target: 'blank'
            }
        }
    })

    const advancedInfoText2 = Trans({
        str: t('phishingAdvancedInfoText_2'),
        values: {
            a: {
                href: 'https://duckduckgo.com/duckduckgo-help-pages/privacy/phishing-and-malware-protection/',
                target: 'blank'
            }
        }
    })

    return (
        <>
            <Warning variant="phishing" heading={t('phishingPageHeading')} advancedInfo={advancedInfo} advancedButtonHandler={advancedInfoToggle}>
                <Text as="p" variant="body">{warningText}</Text>
            </Warning>
            { advancedInfo &&
                <AdvancedInfo heading={t('phishingAdvancedInfoHeading')}>
                    <Text as="p" variant="body">{t('phishingAdvancedInfoText_1')}</Text>
                    <Text as="p" variant="body">{advancedInfoText2}</Text>
                </AdvancedInfo> }
        </>
    )
}

/**
 * @param {ErrorData['kind']} kind
 */
function getSpecialErrorComponent(kind) {
    switch (kind) {
        case 'ssl':
            return SSLError;
        case 'phishing':
            return PhishingError;
        default:
            throw new Error(`Unhandled error page kind: ${kind}`)
    }
}

export function App() {
    const { kind } = useErrorData();
    const SpecialError = getSpecialErrorComponent(kind)

    console.log('ERROR KIND', kind)

    return (
        <main className={styles.main}>
            <div className={styles.container}>
                <SpecialError />
            </div>
        </main>
    )
}
