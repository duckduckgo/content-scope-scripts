import { h } from 'preact'
import { useEffect, useLayoutEffect, useRef } from 'preact/hooks'
import styles from './Expander.module.css'
import { Chevron } from './Icons'

/**
 * The Main UI without a specific provider. Use this to test the UI
 * in Storybook etc.
 */
export function Expander (props) {
    /**
     * The following useState and useEffect are here to
     * allow smooth fade-in/out animations on the feed.
     * In the css we have 4 'states' to use for the animations
     * - data-state="hiding"
     * - data-state="showing"
     * - data-state="fadingIn"
     * - data-state="fadingOut"
     */
    const NEXT_EXPANDER_STATE = props.state
    const NEXT_FEATURE_STATE = props.featureState

    /**
     * This ref is used to track the height of the content to render
     */
    const bodyRef = useRef(/** @type {null|HTMLElement} */(null))

    /**
     * This ref is used as the content window that performs the animation
     */
    const bodyWrapRef = useRef(/** @type {null|HTMLElement} */(null))

    /**
     * Fade in/out
     */
    useLayoutEffect(() => {
        if (!bodyRef.current) throw new Error('unreachable')
        if (!bodyWrapRef.current) throw new Error('unreachable')

        const currentBodyRef = bodyRef.current
        const prev = bodyRef.current.dataset.state

        if (prev === NEXT_EXPANDER_STATE) return

        if (!bodyWrapRef.current.dataset.animationsEnabled) {
            currentBodyRef.dataset.state = NEXT_EXPANDER_STATE
            return
        }

        if (NEXT_EXPANDER_STATE === 'hiding') {
            // next state after the fade
            const handler = () => (currentBodyRef.dataset.state = 'hiding')
            currentBodyRef.addEventListener('transitionend', handler)
            currentBodyRef.addEventListener('animationend', handler)

            // apply this state
            currentBodyRef.dataset.state = 'fadingOut'

            return () => {
                currentBodyRef.removeEventListener('transitionend', handler)
                currentBodyRef.removeEventListener('animationend', handler)
            }
        }
        if (NEXT_EXPANDER_STATE === 'showing') {
            // next state
            const handler = () => (currentBodyRef.dataset.state = 'showing')
            currentBodyRef.addEventListener('transitionend', handler)
            currentBodyRef.addEventListener('animationend', handler)

            // apply this state
            currentBodyRef.dataset.state = 'fadingIn'

            return () => {
                currentBodyRef.removeEventListener('transitionend', handler)
                currentBodyRef.removeEventListener('animationend', handler)
            }
        }

        throw new Error('unreachable...')
    }, [NEXT_FEATURE_STATE, NEXT_EXPANDER_STATE])

    useEffect(() => {
        if (!bodyWrapRef.current) throw new Error('unreachable')
        bodyWrapRef.current.dataset.animationsEnabled = 'true'
    }, [])

    return (
        <div className={styles.root} data-variant={props.variant} data-testid={props.testId}>
            {props.header}
            <div className={styles.bodyWrap} ref={/** @type {any} */(bodyWrapRef)}>
                <div className={styles.body} ref={/** @type {any} */(bodyRef)}>
                    {props.body}
                </div>
            </div>
        </div>
    )
}

// Expander.propTypes = {
//     header: PropTypes.node,
//     body: PropTypes.node,
//     state: PropTypes.oneOf(['showing', 'hiding']),
//     featureState: PropTypes.oneOf(['showing', 'hiding']),
//     variant: PropTypes.string,
//     /**
//      * Pass this to perform additional checks to prevent animations on
//      * large containers. For example, when expanding a long list within an
//      * overflow: scroll container.
//      */
//     restrictedHeight: PropTypes.bool,
//     testId: PropTypes.string,
// };

function ExpanderHeader (props) {
    return (
        <ExpanderHeaderText text={props.children} icon={props.icon}>
            <button
                type="button"
                className={styles.toggle}
                onClick={props.toggle}
                aria-pressed={props.state === 'showing'}
                aria-label={props.labelText}
            >
                <Chevron className={styles.toggleIcon} aria-hidden="true" />
            </button>
        </ExpanderHeaderText>
    )
}

// ExpanderHeader.propTypes = {
//     /**
//      * The component will always be in 1 of a finite set of states
//      */
//     state: PropTypes.oneOf(['showing', 'hiding']).isRequired,
//     /**
//      * A callback to toggle visibility of the feed
//      */
//     toggle: PropTypes.func,
//     /**
//      * An icon to place at the side
//      */
//     icon: PropTypes.node.isRequired,
//     /**
//      * Accessibility label for the button
//      */
//     labelText: PropTypes.string.isRequired,
// };

export { ExpanderHeader }

/**
 * Allow re-use of the basic styles of the heading text + icon
 */
export function ExpanderHeaderText (props) {
    return (
        <div className={styles.headerText} data-variant={props.variant}>
            <div className={styles.inner}>
                <div className={styles.icon}>{props.icon}</div>
                <span className={styles.titleText}>{props.text}</span>
                {props.children}
            </div>
        </div>
    )
}

// ExpanderHeaderText.propTypes = {
//     icon: PropTypes.node.isRequired,
//     text: PropTypes.node.isRequired,
//     variant: PropTypes.oneOf(['centered']),
// };
