import { h } from 'preact'
import cn from 'classnames'
import { useContext } from 'preact/hooks'
import { useEnv } from '../../../../../shared/components/EnvironmentProvider'
import { GlobalContext } from '../../global'

import styles from './Animation.module.css'

/**
 * @param {object} props
 * @param {() => void} [props.onAnimationEnd]
 * @param {import("preact").ComponentChild} props.children
 */
export function SlideIn ({ children, onAnimationEnd }) {
    const { isReducedMotion } = useEnv()
    const { activeStepVisible } = useContext(GlobalContext)

    const animationDidEnd = (e) => {
        if (e.animationName === 'Animation_slidein' && onAnimationEnd) {
            onAnimationEnd()
        }
    }

    const classes = cn({
        [styles.slideIn]: !isReducedMotion,
        [styles.animating]: activeStepVisible
    })

    return (
        <div class={styles.container} onAnimationEnd={animationDidEnd}>
            <div className={classes}>
                {children}
            </div>
        </div>
    )
}
