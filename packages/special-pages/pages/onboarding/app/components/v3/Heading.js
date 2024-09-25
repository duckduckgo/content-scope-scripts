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
    const [typingDone, setTypingDone] = useState(false)
    const [typingPaused, setTypingPaused] = useState(!!speechBubble)

    if (!title) {
        console.warn('Missing title')
        return null
    }

    useEffect(() => {
        setTypingDone(false)
        setTypingPaused(!!speechBubble)
    }, [speechBubble, title, subtitle])

    const onTypingComplete = () => {
        setTypingDone(true)
        onTitleComplete && onTitleComplete()
    }

    const onAnimationDone = () => {
        setTypingPaused(false)
    }

    const HeadingComponent = speechBubble ? SpeechBubble : PlainHeading
    const subtitleClass = cn({
        [styles.subTitle]: true,
        [styles.hidden]: !typingDone
    })

    return (
        <header className={styles.heading}>
            <div className={styles.logo}>
                <img className={styles.svg} src="assets/img/dax.svg" alt="DuckDuckGo Logo" />
            </div>
            <HeadingComponent onAnimationDone={onAnimationDone}>
                <h1 className={styles.title}>
                    <Typed onComplete={onTypingComplete} text={title} paused={typingPaused} />
                </h1>
                {subtitle && <h2 className={subtitleClass}>{subtitle}</h2>}
                {typingDone && children}
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
 * @param {() => void} [props.onAnimationDone]
 * @param {import('preact').ComponentChildren} props.children
 */
function SpeechBubble ({ onAnimationDone, children }) {
    const bubbleContents = useRef(null)
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
    const [animationDone, setAnimationDone] = useState(false)

    useLayoutEffect(() => {
        if (bubbleContents.current) {
            const div = /** @type {HTMLDivElement} */(bubbleContents.current)
            const { width, height } = div.getBoundingClientRect()
            if (dimensions.width !== width || dimensions.height !== height) {
                setAnimationDone(false)
                setDimensions({ width, height })
            }
        }
    }, [bubbleContents, children])

    const onTransitionEnd = () => {
        setAnimationDone(true)
        onAnimationDone && onAnimationDone()
    }

    const contentsClass = cn({
        [styles.speechBubbleContents]: true,
        [styles.hidden]: !animationDone
    })

    return (
        <div className={styles.speechBubble}>
            <div className={styles.speechBubbleCallout} />
            <div className={styles.speechBubbleContainer}>
                <div className={styles.speechBubbleBackground} style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }} onTransitionEnd={onTransitionEnd}></div>
                <div className={contentsClass} ref={bubbleContents}>
                    {children}
                </div>
            </div>
        </div>
    )
}
