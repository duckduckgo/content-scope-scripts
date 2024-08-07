import { Fragment, h } from 'preact'
import classNames from 'classnames'
import { useTypedTranslation } from '../types'
import { useMessaging } from '../MessagingProvider'
import { useAdvancedInfo } from '../UIProvider'
import { useErrorData, usePlatformName } from '../AppSettingsProvider'
import { useWarningHeading, useWarningContent } from '../hooks/ErrorStrings'
import { Text } from '../../../../shared/components/Text/Text'
import { Button } from '../../../../shared/components/Button/Button'

import styles from './Warning.module.css'

export function AdvancedInfoButton() {
    const { t } = useTypedTranslation()
    const { showAdvancedInfo, advancedButtonHandler } = useAdvancedInfo()
    const { platformName } = usePlatformName()

    return (<>
            {!showAdvancedInfo &&
                <Button
                    variant={platformName === 'ios' ? 'ghost' : 'clear'}
                    className={classNames(styles.button, styles.advanced)}
                    onClick={() => advancedButtonHandler()}>
                    {t('advancedButton')}
                </Button>}
            </>)
}

export function LeaveSiteButton() {
    const { t } = useTypedTranslation()
    const { messaging } = useMessaging()

    return (
            <Button
                className={classNames(styles.button, styles.leaveSite)}
                onClick={() => messaging?.leaveSite()} >
                {t('leaveSiteButton')}
            </Button>
    )
}

export function WarningHeading() {
    const { kind } = useErrorData().errorData
    const heading = useWarningHeading()

    return (<header className={styles.heading}>
            <i className={classNames(styles.icon, styles[kind])} aria-hidden="true" />
            <Text as="h1" variant="title-2">{heading}</Text>
        </header>)
}

export function WarningContent() {
    const content = useWarningContent()

    return (
        <div className={styles.content}>
            {content.map(text => <Text as="p" variant="body">{text}</Text>)}
        </div>
    )
}

export function Warning() {

    return (
        <section className={styles.container}>
            <WarningHeading />

            <WarningContent />

            <div className={styles.buttonContainer}>
                <AdvancedInfoButton />
                <LeaveSiteButton />
            </div>
        </section>
    )
}