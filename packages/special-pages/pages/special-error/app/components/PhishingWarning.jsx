import { Fragment, h } from "preact";
import { useState } from "preact/hooks";
import { useTypedTranslation } from "../types"
import { Trans } from "../../../../shared/components/TranslationsProvider";
import { phishingHelpPageURL } from "../constants";

import { Warning } from "./Warning";
import { AdvancedInfo } from "./AdvancedInfo";
import { Text } from "../../../../shared/components/Text/Text";

export function PhishingWarning() {
    const { t } = useTypedTranslation()
    const [showAdvancedInfo, setShowAdvancedInfo] = useState(false)
    const advancedInfoClickHandler = () => setShowAdvancedInfo(value => !value)

    const anchorTagValues = {
            href: phishingHelpPageURL,
            target: 'blank'
    }

    const warningText = Trans({
        str: t('phishingWarningText'),
        values: { a: anchorTagValues }
    })

    const advancedInfoText2 = Trans({
        str: t('phishingAdvancedInfoText_2'),
        values: { a: anchorTagValues }
    })

    return (
        <>
            <Warning
                variant="phishing"
                heading={t('phishingPageHeading')}
                showAdvancedInfoButton={!showAdvancedInfo}
                advancedInfoClickHandler={advancedInfoClickHandler}>
                <Text as="p" variant="body">{warningText}</Text>
            </Warning>
            { showAdvancedInfo &&
                <AdvancedInfo heading={t('phishingAdvancedInfoHeading')}>
                    <Text as="p" variant="body">{t('phishingAdvancedInfoText_1')}</Text>
                    <Text as="p" variant="body">{advancedInfoText2}</Text>
                </AdvancedInfo> }
        </>
    )
}