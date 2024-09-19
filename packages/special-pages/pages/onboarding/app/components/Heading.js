import { h } from 'preact'
import cn from 'classnames'
import { Typed } from './Typed'
import styles from './Heading.module.css'

/**
 * Animated Dax heading with optional speech bubble
 *
 * @param {object} props
 * @param {string|undefined} props.title - Heading title
 * @param {string|null|undefined} [props.subtitle] - Optional heading subtitle
 * @param {boolean} [props.hideSubtitle=false] - Visually hide subtitle
 * @param {boolean} [props.speechBubble=false] - Display title and subtitle inside speech bubble
 * @param {(() => void) | null} [props.onComplete=null] - A callback function to be called when the typing is complete.
 * @param {import('preact').ComponentChildren} props.children
 */
export function Heading ({ title, subtitle, hideSubtitle = false, speechBubble = false, onComplete = null, children }) {
    if (!title) {
        console.warn('Missing title')
        return null
    }

    const HeadingComponent = speechBubble ? SpeechBubble : PlainHeading
    const subtitleClass = cn({
        [styles.subTitle]: true,
        [styles.hidden]: hideSubtitle
    })

    return (
        <header className={styles.heading}>
            <div className={styles.logo}>
                <img className={styles.svg} src="assets/img/dax.svg" alt="DuckDuckGo Logo" />
            </div>
            <HeadingComponent>
                <h1 className={styles.title}>
                    <Typed onComplete={onComplete} text={title} />
                </h1>
                {subtitle && <h2 className={subtitleClass}>{subtitle}</h2>}
                {children}
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
