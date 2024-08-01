import { Fragment, h } from "preact";
import { useState } from "preact/hooks";
import { useErrorData } from "../../../release-notes/app/ErrorDataProvider";
import { useTypedTranslation } from "../types";
import { Warning } from "./Warning";
import { AdvancedInfo } from "./AdvancedInfo";
import { Text } from "../../../../shared/components/Text/Text";

import styles from "./App.module.css";

/**
 * @typedef {import("../../../../types/special-error.js").InitialSetupResponse['errorData']} ErrorData
 * @typedef {import("../../../../types/special-error.js").SSLWrongHost|import("../../../../types/special-error.js").SSLExpiredCertificate|import("../../../../types/special-error.js").SSLSelfSignedCertificate|import("../../../../types/special-error.js").SSLInvalidCertificate} SSLError
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
            const { eTldPlus1 } = /** @type {import("../../../../types/special-error.js").SSLWrongHost} */(errorData)
            text = t('sslWrongHostWarningText', { domain, eTldPlus1 })
        default:
            throw new Error(`Unhandled SSL error type ${errorType}`)
    }

    return <Text as="p" variant="body">{text}</Text>
}

/**
 * @param {object} props
 */
function SSLError(props) {
    const { t } = useTypedTranslation()
    const [advancedInfo, setAdvancedInfo] = useState(false)
    const advancedInfoToggle = () => setAdvancedInfo(value => !value)

    return (
        <>
            <Warning heading={t('sslPageHeading')} advancedInfo={advancedInfo} advancedButtonHandler={advancedInfoToggle}>
                <SSLWarningText />
            </Warning>
            { advancedInfo &&
                <AdvancedInfo heading={t('sslAdvancedInfoHeading')}>
                    <Text as="p" variant="body"></Text>
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

    return (
        <>
            <Warning heading={t('phishingPageHeading')} advancedInfo={advancedInfo} advancedButtonHandler={advancedInfoToggle}>
                <Text as="p" variant="body">{t('phishingWarningText')}</Text>
            </Warning>
            { advancedInfo &&
                <AdvancedInfo heading={t('phishingAdvancedInfoHeading')}>
                    <Text as="p" variant="body">{t('phishingAdvancedInfoMessage_1')}</Text>
                    <Text as="p" variant="body">{t('phishingAdvancedInfoMessage_2')}</Text>
                </AdvancedInfo> }
        </>
    )
}

/**
 * @param {ErrorData['kind']} kind
 */
function getErrorComponent(kind) {
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
    const ErrorComponent = getErrorComponent(kind)

    console.log('ERROR KIND', kind)

    return (
        <main class={styles.main}>
            <ErrorComponent />
        </main>
    )
}
