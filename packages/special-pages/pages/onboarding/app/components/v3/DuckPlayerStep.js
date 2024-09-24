import { h } from 'preact'
import { useEnv } from '../../../../../shared/components/EnvironmentProvider'
import { RiveAnimation } from '../../components/RiveAnimation'
import { useBeforeAfter } from './BeforeAfterProvider'

import onboardingAnimation from '../../animations/Onboarding.riv'

import styles from './DuckPlayerStep.module.css'
import { useEffect } from 'preact/hooks'

export function DuckPlayerStep () {
    const { isDarkMode } = useEnv()
    const { getStep, setStep } = useBeforeAfter()

    useEffect(() => {
        const id = setTimeout(() => {
            setStep('duckPlayerSingle', 'after')
        }, 500)

        return () => clearTimeout(id)
    }, [])

    return (
        <div style={styles.animationContainer}>
            <RiveAnimation
                animation={onboardingAnimation}
                state={getStep('duckPlayerSingle') || 'before'}
                isDarkMode={isDarkMode}
                artboard='Duck Player'
                inputName='Duck Player?'
                stateMachine='State Machine 2'
            />
        </div>
    )
}
