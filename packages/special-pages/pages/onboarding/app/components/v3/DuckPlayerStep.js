import { h } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { useEnv } from '../../../../../shared/components/EnvironmentProvider'
import { RiveAnimation } from '../../components/RiveAnimation'
import { useBeforeAfter } from './BeforeAfterProvider'
import { SlideIn } from './Animation'

import onboardingAnimation from '../../animations/Onboarding.riv'

import styles from './DuckPlayerStep.module.css'

export function DuckPlayerStep () {
    const { isDarkMode } = useEnv()
    const [canPlay, setCanPlay] = useState(false)
    const { getStep, setStep } = useBeforeAfter()

    useEffect(() => {
        let id

        if (canPlay) {
            id = setTimeout(() => {
                setStep('duckPlayerSingle', 'after')
            }, 1000)
        }

        return () => id && clearTimeout(id)
    }, [canPlay])

    const animationState = getStep('duckPlayerSingle')

    const animationDidEnd = () => {
        setCanPlay(true)
    }

    return (
        <SlideIn onAnimationEnd={animationDidEnd}>
            <div className={styles.animationContainer}>
                <RiveAnimation
                    animation={onboardingAnimation}
                    state={animationState || 'before'}
                    isDarkMode={isDarkMode}
                    artboard='Duck Player'
                    inputName='Duck Player?'
                    stateMachine='State Machine 2'
                />
            </div>
        </SlideIn>
    )
}
