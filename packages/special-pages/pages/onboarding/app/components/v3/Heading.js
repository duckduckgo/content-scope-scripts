import { h } from 'preact'
import cn from 'classnames'
import { useState, useRef, useLayoutEffect } from 'preact/hooks'
import { Typed } from '../Typed'
import { useEnv } from '../../../../../shared/components/EnvironmentProvider'

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

/** @enum {number} */
const BUBBLE_STATE = {
    ANIMATING: 0,
    ANIMATION_DONE: 1,
    TYPING_DONE: 2
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
    const { isReducedMotion } = useEnv()
    const initialState = isReducedMotion ? BUBBLE_STATE.TYPING_DONE : BUBBLE_STATE.ANIMATING
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
    /** @type ReturnType<typeof useState<BUBBLE_STATE>> */
    const [bubbleState, setBubbleState] = useState(initialState)

    const handleSizeUpdate = () => {
        if (bubbleContents.current) {
            const div = /** @type {HTMLDivElement} */(bubbleContents.current)
            const { width, height } = div.getBoundingClientRect()
            if (dimensions.width !== width || dimensions.height !== height) {
                setBubbleState(initialState)
                setDimensions({ width, height })
            }
        }
    }

    useLayoutEffect(() => {
        handleSizeUpdate()
    }, [bubbleContents, title, subtitle, children])

    const onTransitionEnd = () => {
        setBubbleState(BUBBLE_STATE.ANIMATION_DONE)
    }

    const onTypingComplete = () => {
        setBubbleState(BUBBLE_STATE.TYPING_DONE)
        onComplete && onComplete()
    }

    const subtitleClass = cn({
        [styles.subTitle]: true,
        [styles.hidden]: bubbleState !== BUBBLE_STATE.TYPING_DONE
    })

    const childrenClass = cn({
        [styles.hidden]: bubbleState !== BUBBLE_STATE.TYPING_DONE
    })

    return (
        <div className={styles.speechBubble}>
            <div className={styles.speechBubbleCallout} />
            <div className={styles.speechBubbleContainer}>
                <div className={styles.speechBubbleBackground} style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }} onTransitionEnd={onTransitionEnd}></div>
                <div className={styles.speechBubbleContents} ref={bubbleContents}>
                    <h1 className={styles.title}>
                        <Typed onComplete={onTypingComplete} text={title} paused={bubbleState === BUBBLE_STATE.ANIMATING} />
                    </h1>
                    {subtitle && <h2 className={subtitleClass}>{subtitle}</h2>}
                    {children && bubbleState === BUBBLE_STATE.TYPING_DONE && <div className={childrenClass}>
                        {console.log('CHILDREN')}
                        {children}
                    </div>}
                </div>
            </div>
        </div>
    )
}
