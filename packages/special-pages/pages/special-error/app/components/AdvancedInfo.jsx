import { h } from 'preact'
import { forwardRef } from 'preact/compat'
import { useRef, useImperativeHandle } from 'preact/hooks'
import { useTypedTranslation } from '../types'
import { Text } from '../../../../shared/components/Text/Text'
import { useMessaging } from '../providers/MessagingProvider'
import { useAdvancedInfoHeading, useAdvancedInfoContent } from '../hooks/ErrorStrings'

import styles from './AdvancedInfo.module.css'

export const VisitSiteLink = forwardRef((_, ref) => {
    /** @type {import("preact/hooks").MutableRef<HTMLSpanElement|null>} */
    const spanRef = useRef(null)

    const { messaging } = useMessaging()
    const { t } = useTypedTranslation()

    useImperativeHandle(ref, () => {
        return {
            scroll() {
                if (spanRef.current) {
                    spanRef.current.scrollIntoView({ behavior: 'smooth' })
                }
            }
        }
    })

    return (
        <Text as="a" variant="body" className={styles.visitSite} onClick={() => messaging?.visitSite()}>
            <span ref={spanRef}>{t('visitSiteButton')}</span>
        </Text>
    )
})

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
    /** @type {import("preact/hooks").MutableRef<HTMLSpanElement|null>} */
    const visitSiteRef = useRef(null)

    const animationDidEnd = () => {
        visitSiteRef.current?.scroll()
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.container} onAnimationEnd={animationDidEnd}>
                <AdvancedInfoHeading />

                <AdvancedInfoContent />

                <VisitSiteLink ref={visitSiteRef}/>
            </div>
        </div>
    )
}
