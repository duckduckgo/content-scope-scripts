import { h, Fragment } from 'preact'
import { useContext } from 'preact/hooks'
import { useTypedTranslation } from '../../types'
import { GlobalContext, GlobalDispatch } from '../../global'
import { SingleSettingStep } from './SingleSettingStep'
import { SettingsStep } from './SettingsStep'
import { settingsRowItemsV3 as settingsRowItems, stepMeta } from '../../data'
import { Launch } from '../../components/Icons'

export function CustomizeStep () {
    const { step, activeStep, activeRow } = useContext(GlobalContext)
    const dispatch = useContext(GlobalDispatch)

    const { t } = useTypedTranslation()

    const isDone = activeRow >= step.rows.length

    const acceptContent = () => isDone ? <>{t('startBrowsing')}<Launch/></> : null
    const acceptHandler = () => {
        if (!isDone) return null

        return () => dispatch({ kind: 'dismiss' })
    }

    return (
        <SingleSettingStep
            acceptContent={acceptContent()}
            acceptHandler={acceptHandler()}>
            <SettingsStep
                key={activeStep}
                data={settingsRowItems}
                metaData={stepMeta}
            />
        </SingleSettingStep>
    )
}
