import { h } from 'preact'
import { useContext } from 'preact/hooks'
import { GlobalContext } from '../../global'
import { SettingsStep } from './SettingsStep'
import { settingsRowItemsV3 as settingsRowItems, stepMeta } from '../../data'

export function CustomizeStep () {
    const { activeStep } = useContext(GlobalContext)

    return (
        <SettingsStep
            key={activeStep}
            data={settingsRowItems}
            metaData={stepMeta}
        />
    )
}
