import { h } from 'preact'
import classNames from 'classnames'
import { useTypedTranslation } from '../types'
import { useMessaging } from '../MessagingProvider'
import { Text } from '../../../../shared/components/Text/Text'
import { Button } from '../../../../shared/components/Button/Button'

import styles from './Warning.module.css'

/**
 * @param {object} props
 * @param {string} props.heading
 * @param {'ssl'|'phishing'} props.variant
 * @param {boolean} props.advancedInfo
 * @param {function} props.advancedButtonHandler
 * @param {import("preact").ComponentChild} props.children
 */
export function Warning({ heading, variant = 'ssl', children, advancedInfo, advancedButtonHandler }) {
    const { t } = useTypedTranslation()
    const { messaging } = useMessaging()

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <i className={classNames(styles.icon, styles[variant])} aria-hidden="true" />
                <Text as="h1" variant="title-2">{heading}</Text>
            </header>
            {children}
            <div className={styles.buttonContainer}>
                {!advancedInfo && <Button className={styles.button} onClick={() => advancedButtonHandler()}>
                    {t('advancedButton')}
                </Button>}
                <Button className={classNames(styles.button, styles.leaveSite)} onClick={() => messaging?.leaveSite()}>
                    {t('leaveSiteButton')}
                </Button>
            </div>
        </div>
    )
}