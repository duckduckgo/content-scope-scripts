import { h } from 'preact'
import { useLayoutEffect, useRef } from 'preact/hooks'
import { useTypedTranslation } from '../types'
import { Text } from '../../../../shared/components/Text/Text'
import { useMessaging } from '../providers/MessagingProvider'
import { useAdvancedInfoHeading, useAdvancedInfoContent } from '../hooks/ErrorStrings'

import styles from './AdvancedInfo.module.css'

export function VisitSiteLink() {
    const { messaging } = useMessaging()
    const { t } = useTypedTranslation()
    /**
     * @type {import("preact/hooks").MutableRef<HTMLDivElement|null>}
     */
    const ref = useRef(null)

    useLayoutEffect(() => {
        setTimeout(() => {
            if (ref.current) {
                ref.current.scrollIntoView({ behavior: 'smooth' })
            }
        }, 300) // Must be the same duration as CSS 'appear' animation in AdvancedInfo.module.css
    }, [])

    return (
        <Text as="a" variant="body" className={styles.visitSite} onClick={() => messaging?.visitSite()}>
            <span ref={ref}>{t('visitSiteButton')}</span>
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
        <div className={styles.wrapper}>
            <div className={styles.container}>
                <AdvancedInfoHeading />

                <AdvancedInfoContent />

                <VisitSiteLink />
            </div>
        </div>
    )
}
