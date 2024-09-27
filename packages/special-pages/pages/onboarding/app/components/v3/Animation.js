import { h } from 'preact'
import cn from 'classnames'
import { useContext, useEffect } from 'preact/hooks'
import { GlobalContext } from '../../global'
import { useEnv } from '../../../../../shared/components/EnvironmentProvider'

import styles from './Animation.module.css'

/**
 * @param {object} props
 * @param {() => void} [props.onAnimationEnd]
 * @param {import("preact").ComponentChild} props.children
 */
export function SlideIn ({ children, onAnimationEnd }) {
    const { activeStepVisible, activeStep } = useContext(GlobalContext)
    const { isReducedMotion } = useEnv()

    useEffect(() => {
        if (isReducedMotion && onAnimationEnd) onAnimationEnd()
    }, [isReducedMotion])

    const animationDidEnd = (e) => {
        if (e.animationName === 'Animation_slidein' && onAnimationEnd) {
            onAnimationEnd()
        }
    }

    const classes = cn({
        [styles.slideIn]: true,
        [styles.animating]: activeStepVisible
    })

    return (
        <div class={styles.container} onAnimationEnd={animationDidEnd} key={activeStep}>
            <div className={classes}>
                {children}
            </div>
        </div>
    )
}
