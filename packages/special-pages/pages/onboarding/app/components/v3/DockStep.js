import { h } from 'preact'
import { useState } from 'preact/hooks'
import { useEnv } from '../../../../../shared/components/EnvironmentProvider'
import { RiveAnimation } from '../../components/RiveAnimation'
import { SlideIn } from './Animation'

import styles from './DockStep.module.css'
import pinningAnimation from '../../animations/taskbar_pinning.riv'

export function DockStep () {
    const { isDarkMode, isReducedMotion } = useEnv()
    const [autoplay, setAutoplay] = useState(isReducedMotion)

    const animationDidEnd = () => {
        setAutoplay(true)
    }

    return (
        <SlideIn onAnimationEnd={animationDidEnd}>
            <div className={styles.animationContainer}>
                <RiveAnimation animation={pinningAnimation} state="before" isDarkMode={isDarkMode} autoplay={autoplay}/>
            </div>
        </SlideIn>
    )
}
