import { h } from 'preact'
import { useTypedTranslation } from '../types'
import { useMessaging } from '../MessagingProvider'
import { Text } from '../../../../shared/components/Text/Text'
import { Button } from '../../../../shared/components/Button/Button'

import styles from './Warning.module.css'

/**
 * @param {object} props
 * @param {string} props.heading
 * @param {boolean} props.advancedInfo
 * @param {function} props.advancedButtonHandler
 * @param {import("preact").ComponentChild} props.children
 */
export function Warning({ heading, children, advancedInfo, advancedButtonHandler }) {
    const { t } = useTypedTranslation()
    const { messaging } = useMessaging()

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <i className={styles.icon} aria-hidden="true" />
                <Text as="h1" variant="title-2">{heading}</Text>
            </header>
            {children}
            <div className={styles.buttonContainer}>
                {!advancedInfo && <Button onClick={() => advancedButtonHandler()}>
                    {t('advancedButton')}
                </Button>}
                <Button onClick={() => messaging?.leaveSite()}>
                    {t('leaveSiteButton')}
                </Button>
            </div>
        </div>
    )
}