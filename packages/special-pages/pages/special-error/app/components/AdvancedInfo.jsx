import { h } from 'preact'
import { useRef, useEffect } from 'preact/hooks'
import { useTypedTranslation } from '../types'
import { Text } from '../../../../shared/components/Text/Text'
import { useMessaging } from '../providers/MessagingProvider'
import { useAdvancedInfoHeading, useAdvancedInfoContent } from '../hooks/ErrorStrings'

import styles from './AdvancedInfo.module.css'

export function VisitSiteLink() {
    /** @type {import("preact/hooks").MutableRef<HTMLSpanElement|null>} */
    const spanRef = useRef(null)
    const { messaging } = useMessaging()
    const { t } = useTypedTranslation()

    useEffect(() => {
        if (!spanRef.current) return;
        const span =  spanRef.current;

        const scrollToLink = () => {
            span.scrollIntoView({ behavior: 'smooth' })
        }
        window.addEventListener('advanced-info-animation-end', scrollToLink)

        return () => {
            window.removeEventListener('advanced-info-animation-end', scrollToLink)
        }
    }, [])

    return (
        <Text as="a" variant="body" className={styles.visitSite} onClick={() => messaging?.visitSite()}>
            <span ref={spanRef}>{t('visitSiteButton')}</span>
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
    const animationDidEnd = () => {
        window.dispatchEvent(new CustomEvent('advanced-info-animation-end'))
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.container} onAnimationEnd={animationDidEnd}>
                <AdvancedInfoHeading />

                <AdvancedInfoContent />

                <VisitSiteLink />
            </div>
        </div>
    )
}
