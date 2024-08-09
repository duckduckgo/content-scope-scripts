import { Fragment, h } from 'preact'
import classNames from 'classnames'
import { useTypedTranslation } from '../types'
import { useMessaging } from '../providers/MessagingProvider'
import { useAdvancedInfo } from '../providers/UIProvider'
import { useErrorData, usePlatformName } from '../providers/ErrorDataProvider'
import { useWarningHeading, useWarningContent } from '../hooks/ErrorStrings'
import { Text } from '../../../../shared/components/Text/Text'
import { Button } from '../../../../shared/components/Button/Button'

import styles from './Warning.module.css'

export function AdvancedInfoButton() {
    const { t } = useTypedTranslation()
    const { showAdvancedInfo, advancedButtonHandler } = useAdvancedInfo()
    const { platformName } = usePlatformName()

    if (showAdvancedInfo) return null

    return (
        <Button
            variant={platformName === 'macos' ? 'standard' : 'ghost'}
            className={classNames(styles.button, styles.advanced)}
            onClick={() => advancedButtonHandler()}>
            {t('advancedButton')}
        </Button>
    )
}

export function LeaveSiteButton() {
    const { t } = useTypedTranslation()
    const { messaging } = useMessaging()
    const { platformName } = usePlatformName()

    return (
        <Button
            variant={platformName === 'macos' ? 'accent' : 'primary'}
            className={classNames(styles.button, styles.leaveSite)}
            onClick={() => messaging?.leaveSite()} >
            {t('leaveSiteButton')}
        </Button>
    )
}

export function WarningHeading() {
    const { kind } = useErrorData().errorData
    const heading = useWarningHeading()

    return (
        <header className={styles.heading}>
            <i className={classNames(styles.icon, styles[kind])} aria-hidden="true" />
            <Text as="h1" variant="title-2">{heading}</Text>
        </header>
    )
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