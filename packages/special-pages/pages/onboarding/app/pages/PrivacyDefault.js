// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from 'preact'
import { ListItem } from '../components/ListItem'
import { BounceIn, Check } from '../components/Icons'
import { List } from '../components/List'
import { Progress } from '../components/Progress'
import { Header } from '../components/Header'
import { Stack } from '../components/Stack'
import { Content } from '../components/Content'
import { Button, ButtonBar } from '../components/Buttons'
import { useRollin } from '../hooks/useRollin'
import { noneSettingsRowItems } from '../row-data'
import { useTranslation } from '../translations'

/**
 * @param {object} props
 * @param {(args: any) => void} props.onNextPage
 * @param {number} props.stepNumber
 * @param {string} props.title
 */
export function PrivacyDefault ({ onNextPage, stepNumber, title }) {
    const { t } = useTranslation()
    const rows = [
        noneSettingsRowItems.search,
        noneSettingsRowItems.trackingProtection,
        noneSettingsRowItems.cookieManagement
    ]

    // show each after 1s
    const frames = new Array(rows.length).fill(1000)

    // create the timer
    const { state, advance } = useRollin(['start-trigger', ...frames])

    // shared checkmark
    const check = <BounceIn delay={'double'}><Check /></BounceIn>

    return (
        <Stack>
            <Header
                title={title}
                aside={<Progress current={stepNumber} total={4} />}
                onComplete={advance}
            />
            <Content>
                <Stack animate>
                    {state.current > 0 && (
                        <List>
                            {rows.slice(0, state.current).map((row) => {
                                return (
                                    <ListItem
                                        key={row.icon}
                                        icon={row.icon}
                                        title={row.title}
                                        secondaryText={row.secondaryText}
                                        inline={check} />
                                )
                            })}
                        </List>
                    )}
                    {state.isLast && (
                        <ButtonBar>
                            <Button onClick={onNextPage} size={'large'}>{t('Got it')}</Button>
                        </ButtonBar>
                    )}
                </Stack>
            </Content>
        </Stack>
    )
}
