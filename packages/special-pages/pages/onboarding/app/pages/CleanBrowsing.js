// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from 'preact'
import { ListItem } from '../components/ListItem'
import { BounceIn, Check, SlideUp } from '../components/Icons'
import { List } from '../components/List'
import { Stack } from '../components/Stack'
import { Button, ButtonBar } from '../components/Buttons'
import { useRollin } from '../hooks/useRollin'
import { beforeAfterMeta, noneSettingsRowItems } from '../data'
import { useTranslation } from '../translations'
import { Delay } from '../components/Timeout'
import { Animate } from '../components/Animate'
import { RiveAnimation } from '../components/RiveAnimation'
import { BeforeAfter } from '../components/BeforeAfter'
import { useContext } from 'preact/hooks'
import { SettingsContext } from '../settings'

/**
 * @param {object} props
 * @param {(args: any) => void} props.onNextPage
 */
export function CleanBrowsing ({ onNextPage }) {
    const { t } = useTranslation()

    const rows = [
        noneSettingsRowItems.fewerAds,
        noneSettingsRowItems.duckPlayer
    ]

    // show each after interaction
    const frames = new Array(rows.length).fill('start-trigger')

    // each section (after initial delay) is user-triggered here
    const { state, advance } = useRollin([300, ...frames])

    return (
        <Stack>
            <Stack animate>
                {state.current > 0 && (
                    <List animate>
                        {rows.slice(0, state.current).map((row, index) => {
                            const isCurrent = state.current === (index + 1)
                            return <RowItem isCurrent={isCurrent} row={row} index={index} advance={advance}/>
                        })}
                    </List>
                )}
            </Stack>
            {state.isLast && (
                <SlideUp delay={'double'}>
                    <ButtonBar>
                        <Button onClick={onNextPage} size={'large'}>{t('Next')}</Button>
                    </ButtonBar>
                </SlideUp>
            )}
        </Stack>
    )
}

function RowItem ({ isCurrent, row, index, advance }) {
    const { isDarkMode } = useContext(SettingsContext)
    const meta = beforeAfterMeta[row.id]
    return (
        <ListItem
            key={row.icon}
            icon={row.icon}
            title={row.title}
            secondaryText={isCurrent && row.secondaryText}
            inline={!isCurrent && <BounceIn delay={'double'}><Check /></BounceIn>}
            index={index}
            animate
        >
            {isCurrent && (
                <Animate>
                    <Delay ms={600}>
                        <BeforeAfter
                            onDone={advance}
                            btnAfter={meta.btnAfterText}
                            btnBefore={meta.btnBeforeText}
                            media={({ state }) => {
                                const animationState = (state === 'initial' || state === 'before') ? 'before' : 'after'
                                return <RiveAnimation
                                    state={animationState}
                                    isDarkMode={isDarkMode}
                                    artboard={meta.artboard}
                                    inputName={meta.inputName}
                                    stateMachine={meta.stateMachine}
                                />
                            }}
                        />
                    </Delay>
                </Animate>
            )}
        </ListItem>
    )
}
