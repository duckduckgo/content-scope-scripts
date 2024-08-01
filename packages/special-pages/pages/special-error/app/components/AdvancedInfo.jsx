import { h } from 'preact'
import { useTypedTranslation } from '../types'
import { Text } from '../../../../shared/components/Text/Text'
import { Button } from '../../../../shared/components/Button/Button'

import styles from './AdvancedInfo.module.css'

/**
 * @param {object} props
 * @param {string} props.heading
 * @param {import("preact").ComponentChild} props.children
 */
export function AdvancedInfo({ heading, children }) {
    const { t } = useTypedTranslation()

    return (
        <div className={styles.container}>
            <Text as="h2" variant="body">{heading}</Text>
            {children}
            <a className={styles.link}>{t('visitSiteButton')}</a>
        </div>
    )
}
