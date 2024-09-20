import { h } from 'preact'
import { useContext } from 'preact/hooks'
import { useEnv } from '../../../../../shared/components/EnvironmentProvider'
import { useTypedTranslation } from '../../types'
import { GlobalContext, GlobalDispatch } from '../../global'
import { RiveAnimation } from '../../components/RiveAnimation'
import { SingleSettingStep } from './SingleSettingStep'

import pinningAnimation from '../../animations/taskbar_pinning.riv'

export function DockStep () {
    const { injectName: platform, isDarkMode } = useEnv()
    const { UIValues } = useContext(GlobalContext)
    const dispatch = useContext(GlobalDispatch)

    const { t } = useTypedTranslation()

    const isIdle = UIValues.dock === 'idle'

    const dismissContent = () => platform !== 'windows' && isIdle ? t('skipButton') : null

    const acceptContent = () => {
        if (platform === 'windows') {
            return isIdle ? t('nextButton') : t('nextButton')
        }
        return isIdle ? t('keepInDockButton') : t('nextButton')
    }

    const acceptHandler = () => {
        if (!isIdle) return null

        return () => dispatch({
            kind: 'update-system-value',
            id: 'dock',
            payload: { enabled: true },
            current: true
        })
    }

    return (
        <SingleSettingStep
            isIdle={isIdle}
            dismissContent={dismissContent()}
            acceptContent={acceptContent()}
            acceptHandler={acceptHandler()}>
            <RiveAnimation animation={pinningAnimation} state="before" isDarkMode={isDarkMode}/>
        </SingleSettingStep>
    )
}
