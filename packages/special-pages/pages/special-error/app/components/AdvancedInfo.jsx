import { h } from 'preact'
import { useRef, useEffect } from 'preact/hooks'
import { useTypedTranslation } from '../types'
import { Text } from '../../../../shared/components/Text/Text'
import { useMessaging } from '../providers/MessagingProvider'
import { useAdvancedInfoHeading, useAdvancedInfoContent } from '../hooks/ErrorStrings'

import styles from './AdvancedInfo.module.css'

export function VisitSiteLink() {
    /** @type {import("preact/hooks").MutableRef<HTMLAnchorElement|null>} */
    const linkRef = useRef(null)
    const { messaging } = useMessaging()
    const { t } = useTypedTranslation()

    useEffect(() => {
        if (!linkRef.current) return;
        const link =  linkRef.current;
        const controller = new AbortController();

        window.addEventListener('advanced-info-animation-end', () => {
            link.scrollIntoView({ behavior: 'smooth' })
        }, { signal: controller.signal })

        return () => {
            controller.abort()
        }
    }, [])

    return (
        <a className={styles.visitSite} onClick={() => messaging?.visitSite()} ref={linkRef}>
            {t('visitSiteButton')}
        </a>
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
        window.dispatchEvent(new Event('advanced-info-animation-end'))
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
