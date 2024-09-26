import { h } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { useEnv } from '../../../../../shared/components/EnvironmentProvider'
import { RiveAnimation } from '../../components/RiveAnimation'
import { useBeforeAfter } from './BeforeAfterProvider'
import { SlideIn } from './Animation'

import onboardingAnimation from '../../animations/Onboarding.riv'

import styles from './DuckPlayerStep.module.css'

export function DuckPlayerStep () {
    const { isDarkMode, isReducedMotion } = useEnv()
    const [canPlay, setCanPlay] = useState(false)
    const { stepStates, getStep, setStep } = useBeforeAfter()
    /** @type ReturnType<typeof useState<ReturnType<typeof getStep>>> */
    const [animationState, setAnimationState] = useState('before')

    useEffect(() => {
        let id

        if (canPlay) {
            id = setTimeout(() => {
                setStep('duckPlayerSingle', 'after')
            }, isReducedMotion ? 0 : 300)
        }

        return () => id && clearTimeout(id)
    }, [canPlay, isReducedMotion])

    useEffect(() => {
        setAnimationState(getStep('duckPlayerSingle'))
    }, [stepStates])

    const animationDidEnd = () => {
        setCanPlay(true)
    }

    return (
        <SlideIn onAnimationEnd={animationDidEnd}>
            <div className={styles.animationContainer}>
                <RiveAnimation
                    animation={onboardingAnimation}
                    state={animationState}
                    isDarkMode={isDarkMode}
                    artboard='Duck Player'
                    inputName='Duck Player?'
                    stateMachine='State Machine 2'
                />
            </div>
        </SlideIn>
    )
}
