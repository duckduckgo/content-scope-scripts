import { h } from 'preact'
import { useContext } from 'preact/hooks'
import { useTypedTranslation } from '../../types'
import { GlobalContext, GlobalDispatch } from '../../global'
import { ComparisonTable } from '../../components/ComparisonTable'
import { SingleSettingStep } from './SingleSettingStep'

export function MakeDefaultStep () {
    const { UIValues } = useContext(GlobalContext)
    const dispatch = useContext(GlobalDispatch)

    const { t } = useTypedTranslation()

    const isIdle = UIValues['default-browser'] === 'idle'

    const dismissContent = () => isIdle ? t('skipButton') : null

    const acceptContent = () => isIdle ? t('makeDefaultButton') : t('nextButton')
    const acceptHandler = () => {
        if (!isIdle) return null

        return () => dispatch({
            kind: 'update-system-value',
            id: 'default-browser',
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
            <ComparisonTable />
        </SingleSettingStep>
    )
}
