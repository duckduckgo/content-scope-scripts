// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from 'preact'
import { Header } from '../components/Header'
import { Stack } from '../components/Stack'
import { Content } from '../components/Content'
import { useRollin } from '../hooks/useRollin'
import { Launch } from '../components/Icons'
import { Button, ButtonBar } from '../components/Buttons'
import { noneSettingsRowItems, settingsRowItems } from '../row-data'
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
 * @param {string} props.title
 */
export function Summary ({ values, onDismiss, onSettings, title }) {
    const { state, advance } = useRollin(['start-trigger'])
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

    return (
        <Stack>
            <Header title={title} onComplete={advance} />
            <Content>
                {state.current > 0 && (
                    <Stack gap={Stack.gaps['3']}>
                        <SummaryList>
                            {items.concat(enabledSettingsItems).map(item => {
                                return (
                                    <ListItemPlain key={item.summary} icon={item.icon} title={item.summary}/>
                                )
                            })}
                        </SummaryList>
                        <div style={{ height: '19px' }} />
                        <ButtonBar>
                            <Button onClick={onDismiss} size={'xl'}>{t('Start Browsing')}
                                <Launch/>
                            </Button>
                        </ButtonBar>
                        <div style={{ height: '38px' }} />
                        <div>
                            {t('You can change your choices any time in')}{' '}
                            <a onClick={onSettings} href="about:preferences">{t('Settings')}</a>.
                        </div>
                    </Stack>
                )}
            </Content>
        </Stack>
    )
}
