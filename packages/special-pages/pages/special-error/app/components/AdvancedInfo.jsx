import { h } from 'preact'
import { useTypedTranslation } from '../types'
import { Text } from '../../../../shared/components/Text/Text'
import { useMessaging } from '../MessagingProvider'

import styles from './AdvancedInfo.module.css'

/**
 * @param {object} props
 * @param {string} props.heading
 * @param {import("preact").ComponentChild} props.children
 */
export function AdvancedInfo({ heading, children }) {
    const { messaging } = useMessaging()
    const { t } = useTypedTranslation()

    return (
        <div className={styles.container}>
            <Text as="h2" variant="body">{heading}</Text>
            {children}
            <Text as="a" variant="body" className={styles.visitSite} onClick={() => messaging?.visitSite()}>{t('visitSiteButton')}</Text>
        </div>
    )
}
