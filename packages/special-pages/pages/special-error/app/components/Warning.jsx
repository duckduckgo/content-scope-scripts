import { h } from 'preact'
import classNames from 'classnames'
import { useTypedTranslation } from '../types'
import { useMessaging } from '../MessagingProvider'
import { useAdvancedInfo } from '../UIProvider'
import { Text } from '../../../../shared/components/Text/Text'
import { Button } from '../../../../shared/components/Button/Button'

import styles from './Warning.module.css'

export function WarningButtons() {
    const { t } = useTypedTranslation()
    const { showAdvancedInfo, advancedButtonHandler } = useAdvancedInfo()
    const { messaging } = useMessaging()

    return (
        <div className={styles.buttonContainer}>
            { !showAdvancedInfo && <Button className={styles.button} onClick={() => advancedButtonHandler()}>
                {t('advancedButton')}
            </Button>}

            <Button
                className={classNames(styles.button, styles.leaveSite)}
                onClick={() => messaging?.leaveSite()} >
                {t('leaveSiteButton')}
            </Button>
        </div>
    )
}

/**
 * @param {object} props
 * @param {string} props.heading
 * @param {'ssl'|'phishing'} props.variant
 * @param {import("preact").ComponentChild} props.children
 */
export function Warning({ heading, variant = 'ssl', children }) {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <i className={classNames(styles.icon, styles[variant])} aria-hidden="true" />
                <Text as="h1" variant="title-2">{heading}</Text>
            </header>
            <div className={styles.content}>
                {children}
            </div>
            <WarningButtons />
        </div>
    )
}