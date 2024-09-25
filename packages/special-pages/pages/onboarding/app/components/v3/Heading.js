import { h } from 'preact'
import cn from 'classnames'
import { useState, useEffect, useRef, useLayoutEffect } from 'preact/hooks'
import { Typed } from '../Typed'

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
    if (!title) {
        console.warn('Missing title')
        return null
    }
    const onComplete = () => {
        onTitleComplete && onTitleComplete()
    }
    const HeadingComponent = speechBubble ? SpeechBubble : PlainHeading

    return (
        <header className={styles.heading}>
            <div className={styles.logo}>
                <img className={styles.svg} src="assets/img/dax.svg" alt="DuckDuckGo Logo" />
            </div>
            <HeadingComponent
                title={title}
                subtitle={subtitle}
                onComplete={onComplete}>
                {children}
            </HeadingComponent>
        </header>
    )
}

/**
 * @param {object} props
 * @param {string} props.title - Heading title
 * @param {string|null} [props.subtitle] - Optional heading subtitle
 * @param {() => void} [props.onComplete] - Fires when title is done animating
 * @param {import('preact').ComponentChildren} props.children
 */
function PlainHeading ({ title, subtitle, onComplete, children }) {
    const [typingDone, setTypingDone] = useState(false)
    const onTypingComplete = () => {
        setTypingDone(true)
        onComplete && onComplete()
    }

    const subtitleClass = cn({
        [styles.subTitle]: true,
        [styles.hidden]: !typingDone
    })

    return (
        <div className={styles.headingContents}>
            <h1 className={styles.title}>
                <Typed onComplete={onTypingComplete} text={title} />
            </h1>
            {subtitle && <h2 className={subtitleClass}>{subtitle}</h2>}
            {typingDone && children}
        </div>
    )
}

/**
 * @param {object} props
 * @param {string} props.title - Heading title
 * @param {string|null} [props.subtitle] - Optional heading subtitle
 * @param {() => void} [props.onComplete]
 * @param {import('preact').ComponentChildren} props.children
 */
function SpeechBubble ({ title, subtitle, onComplete, children }) {
    const bubbleContents = useRef(null)
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
    const [animationDone, setAnimationDone] = useState(false)
    const [typingDone, setTypingDone] = useState(false)
    const [typingPaused, setTypingPaused] = useState(true)

    useLayoutEffect(() => {
        if (bubbleContents.current) {
            const div = /** @type {HTMLDivElement} */(bubbleContents.current)
            const { width, height } = div.getBoundingClientRect()
            if (dimensions.width !== width || dimensions.height !== height) {
                setAnimationDone(false)
                setDimensions({ width, height })
            }
        }
    }, [bubbleContents, title, subtitle, children, typingDone])

    useEffect(() => {
        setTypingDone(false)
        setTypingPaused(true)
    }, [title])

    const onTransitionEnd = () => {
        setAnimationDone(true)
        setTypingPaused(false)
    }

    const onTypingComplete = () => {
        setTypingDone(true)
        onComplete && onComplete()
    }

    const subtitleClass = cn({
        [styles.subTitle]: true,
        [styles.hidden]: !typingDone
    })

    const childrenClass = cn({
        [styles.hidden]: !animationDone
    })

    return (
        <div className={styles.speechBubble}>
            <div className={styles.speechBubbleCallout} />
            <div className={styles.speechBubbleContainer}>
                <div className={styles.speechBubbleBackground} style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }} onTransitionEnd={onTransitionEnd}></div>
                <div className={styles.speechBubbleContents} ref={bubbleContents}>
                    <h1 className={styles.title}>
                        <Typed onComplete={onTypingComplete} text={title} paused={typingPaused} />
                    </h1>
                    {subtitle && <h2 className={subtitleClass}>{subtitle}</h2>}
                    {children && typingDone && <div className={childrenClass}>
                        {children}
                    </div>}
                </div>
            </div>
        </div>
    )
}
