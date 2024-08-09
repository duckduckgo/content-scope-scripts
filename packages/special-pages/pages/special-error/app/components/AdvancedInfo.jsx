import { h } from 'preact'
import { useTypedTranslation } from '../types'
import { Text } from '../../../../shared/components/Text/Text'
import { useMessaging } from '../providers/MessagingProvider'
import { useAdvancedInfoHeading, useAdvancedInfoContent } from '../hooks/ErrorStrings'

import styles from './AdvancedInfo.module.css'

export function VisitSiteLink() {
    const { messaging } = useMessaging()
    const { t } = useTypedTranslation()

    return (
        <Text as="a" variant="body" className={styles.visitSite} onClick={() => messaging?.visitSite()}>
            {t('visitSiteButton')}
        </Text>
    )
}

export function AdvancedInfoHeading() {
    const heading = useAdvancedInfoHeading()

    return (
        <header className={styles.heading}>
            <Text as="h2" variant="body">{heading}</Text>
        </header>
    )
}

export function AdvancedInfoContent() {
    const content = useAdvancedInfoContent()

    return (
        <div className={styles.content}>
            {content.map(text => <Text as="p" variant="body">{text}</Text>)}
        </div>
    )
}

export function AdvancedInfo() {
    return (
        <div className={styles.container}>
            <AdvancedInfoHeading />

            <AdvancedInfoContent />

            <VisitSiteLink />
        </div>
    )
}
