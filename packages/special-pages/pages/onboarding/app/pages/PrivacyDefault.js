// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from 'preact'
import { ListItem } from '../components/ListItem'
import { BounceIn, Check, SlideUp } from '../components/Icons'
import { List } from '../components/List'
import { Stack } from '../components/Stack'
import { Button, ButtonBar } from '../components/Buttons'
import { useRollin } from '../hooks/useRollin'
import { noneSettingsRowItems } from '../data'
import { useTranslation } from '../translations'

/**
 * @param {object} props
 * @param {(args: any) => void} props.onNextPage
 */
export function PrivacyDefault ({ onNextPage }) {
    const { t } = useTranslation()

    const rows = [
        noneSettingsRowItems.search,
        noneSettingsRowItems.trackingProtection,
        noneSettingsRowItems.cookieManagement
    ]

    // manual timings for this step
    const { state } = useRollin([0, 1000, 1000, 800])

    // shared checkmark
    const check = <BounceIn delay={'double'}><Check /></BounceIn>

    return (
        <Stack>
            {state.current > 0 && (
                <SlideUp>
                    <List>
                        {rows.slice(0, state.current).map((row, index) => {
                            return (
                                <ListItem
                                    key={row.icon}
                                    icon={row.icon}
                                    title={row.title}
                                    secondaryText={row.secondaryText}
                                    inline={check}
                                    index={index}
                                    animate={true}
                                />
                            )
                        })}
                    </List>
                </SlideUp>
            )}
            {state.isLast && (
                <SlideUp>
                    <ButtonBar>
                        <Button onClick={onNextPage} size={'large'}>{t('Got It')}</Button>
                    </ButtonBar>
                </SlideUp>
            )}
        </Stack>
    )
}
