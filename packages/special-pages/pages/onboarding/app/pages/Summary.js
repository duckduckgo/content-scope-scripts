// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from 'preact'
import { Stack } from '../components/Stack'
import { Launch, SlideUp } from '../components/Icons'
import { Button, ButtonBar } from '../components/Buttons'
import { noneSettingsRowItems, settingsRowItems } from '../data'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ListItemPlain, availableIcons } from '../components/ListItem'
import { SummaryList } from '../components/List'
import { useTranslation } from '../translations'

/**
 * Renders a summary component
 *
 * @param {Object} props - The component props
 * @param {import('../types').GlobalState['values']} props.values - The component props
 * @param {() => void} props.onDismiss - The function to call when dismissing
 * @param {() => void} props.onSettings - The function to call when opening settings
 */
export function Summary ({ values, onDismiss, onSettings }) {
    const { t } = useTranslation()

    // list of features that are 'on by default', so we always show them
    /** @type {{icon: availableIcons[number]; summary: string}[]} */
    const items = Object.keys(noneSettingsRowItems).map(key => {
        return {
            icon: noneSettingsRowItems[key].icon,
            summary: noneSettingsRowItems[key].summary
        }
    })

    // list of settings that were enabled by the user during onboarding
    const enabledSettingsItems = Object.keys(values || {})
        .filter(key => values[key].enabled === true)
        .map(key => {
            return {
                icon: settingsRowItems[key].icon,
                summary: settingsRowItems[key].summary
            }
        })

    function onSettingsHandler (e) {
        e.preventDefault()
        onSettings()
    }

    return (
        <Stack gap={Stack.gaps['3'] /* 12px */}>
            <SummaryList>
                {items.concat(enabledSettingsItems).map(item => {
                    return (
                        <ListItemPlain key={item.summary} icon={item.icon} title={item.summary}/>
                    )
                })}
            </SummaryList>
            <SlideUp>
                <ButtonBar style={{ marginTop: '19px' /* this matches the designs perfectly */ }}>
                    <Button onClick={onDismiss} size={'xl'}>{t('Start Browsing')}
                        <Launch/>
                    </Button>
                </ButtonBar>
            </SlideUp>
            <div style={{ marginTop: '50px' /* this matches the designs perfectly */ }}>
                {t('You can change your choices any time in')}{' '}
                <a onClick={onSettingsHandler} href="about:preferences">{t('Settings')}</a>.
            </div>
        </Stack>
    )
}
