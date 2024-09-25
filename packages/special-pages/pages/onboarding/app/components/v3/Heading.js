import { h } from 'preact'
import cn from 'classnames'
import { useState, useEffect } from 'preact/hooks'
import { Typed } from '../Typed'
import { Stack } from '../Stack'

import styles from './Heading.module.css'

/**
 * Animated Dax heading with optional speech bubble
 *
 * @param {object} props
 * @param {string|null} [props.title] - Heading title
 * @param {string|null} [props.subtitle] - Optional heading subtitle
 * @param {boolean} [props.speechBubble=false] - Display title and subtitle inside speech bubble
 * @param {() => void} [props.onTitleComplete] - Fires when title is done animating
 * @param {import('preact').ComponentChildren} [props.children]
 */
export function Heading ({ title, subtitle, speechBubble = false, onTitleComplete, children }) {
    const [animationDone, setAnimationDone] = useState(false)

    if (!title) {
        console.warn('Missing title')
        return null
    }

    useEffect(() => {
        setAnimationDone(false)
    }, [title])

    const onComplete = () => {
        setAnimationDone(true)
        onTitleComplete && onTitleComplete()
    }

    const HeadingComponent = speechBubble ? SpeechBubble : PlainHeading
    const subtitleClass = cn({
        [styles.subTitle]: true,
        [styles.hidden]: !animationDone
    })

    return (
        <header className={styles.heading}>
            <div className={styles.logo}>
                <img className={styles.svg} src="assets/img/dax.svg" alt="DuckDuckGo Logo" />
            </div>
            <HeadingComponent>
                <Stack animate>
                    <h1 className={styles.title}>
                        <Typed onComplete={onComplete} text={title} />
                    </h1>
                    {subtitle && <h2 className={subtitleClass}>{subtitle}</h2>}
                    {!!animationDone && children}
                </Stack>
            </HeadingComponent>
        </header>
    )
}

/**
 * @param {object} props
 * @param {import('preact').ComponentChildren} props.children
 */
function PlainHeading ({ children }) {
    return (
        <div className={styles.headingContents}>
            {children}
        </div>
    )
}

/**
 * @param {object} props
 * @param {import('preact').ComponentChildren} props.children
 */
function SpeechBubble ({ children }) {
    return (
        <div className={styles.speechBubble}>
            <div className={styles.speechBubbleCallout} />
            <div className={styles.speechBubbleContents}>
                {children}
            </div>
        </div>
    )
}
