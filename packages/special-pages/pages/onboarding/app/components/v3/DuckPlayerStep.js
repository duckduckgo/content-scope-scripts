import { h } from 'preact'
import { useEnv } from '../../../../../shared/components/EnvironmentProvider'
import { RiveAnimation } from '../../components/RiveAnimation'

import onboardingAnimation from '../../animations/Onboarding.riv'

import styles from './DuckPlayerStep.module.css'
import { useEffect } from 'preact/hooks'

/**
 * @param {object} props
 * @param {'before'|'after'|null} props.beforeAfter
 * @param {(value: 'before'|'after') => void} props.setBeforeAfter
 */
export function DuckPlayerStep ({ beforeAfter, setBeforeAfter }) {
    const { isDarkMode } = useEnv()

    useEffect(() => {
        const id = setTimeout(() => {
            setBeforeAfter('after')
        }, 500)

        return () => clearTimeout(id)
    }, [setBeforeAfter])

    return (
        <div style={styles.animationContainer}>
            <RiveAnimation
                animation={onboardingAnimation}
                state={beforeAfter || 'before'}
                isDarkMode={isDarkMode}
                artboard='Duck Player'
                inputName='Duck Player?'
                stateMachine='State Machine 2'
            />
        </div>
    )
}
