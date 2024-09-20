import { h, Fragment } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import { useEnv } from '../../../../../shared/components/EnvironmentProvider'
import { useTypedTranslation } from '../../types'
import { RiveAnimation } from '../../components/RiveAnimation'
import { Replay } from '../../components/Icons'
import { SingleSettingStep } from './SingleSettingStep'

import onboardingAnimation from '../../animations/Onboarding.riv'

import styles from './DuckPlayerStep.module.css'

export function DuckPlayerStep () {
    const { isDarkMode } = useEnv()
    const { t } = useTypedTranslation()

    useEffect(() => {
        setTimeout(() => {
            setBeforeAfter('after')
        }, 500)
    }, [])

    const [beforeAfter, setBeforeAfter] = /** @type ReturnType<typeof useState<'before'|'after'|null>> */(useState(null))

    const dismissContent = () => {
        if (!beforeAfter) return null
        return (
            <>
                <Replay />
                {beforeAfter === 'before' ? t('beforeAfter_duckPlayer_show') : t('beforeAfter_duckPlayer_hide')}
            </>
        )
    }

    const dismissHandler = () => setBeforeAfter(value => value === 'before' ? 'after' : 'before')

    const acceptContent = t('nextButton')

    return (
        <SingleSettingStep
            dismissContent={dismissContent()}
            dismissHandler={dismissHandler}
            acceptContent={acceptContent}>
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
        </SingleSettingStep>
    )
}
