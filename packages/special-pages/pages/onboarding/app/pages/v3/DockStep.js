import { h } from 'preact'
import { useEnv } from '../../../../../shared/components/EnvironmentProvider'
import { RiveAnimation } from '../../components/RiveAnimation'

import pinningAnimation from '../../animations/taskbar_pinning.riv'

export function DockStep () {
    const { isDarkMode } = useEnv()

    return (
        <RiveAnimation animation={pinningAnimation} state="before" isDarkMode={isDarkMode}/>
    )
}
