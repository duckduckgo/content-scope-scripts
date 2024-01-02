// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from 'preact'
import { ListItem } from '../components/ListItem'
import { BounceIn, Check, FadeIn, SlideUp } from '../components/Icons'
import { List } from '../components/List'
import { Stack } from '../components/Stack'
import { Button, ButtonBar } from '../components/Buttons'
import { useGlobalDispatch, useGlobalState } from '../global'
import { useTranslation } from '../translations'
import { useRollin } from '../hooks/useRollin'
import { Switch } from '../components/Switch'

/**
 * @param {object} props
 * @param {(args: any) => void} props.onNextPage
 * @param {typeof import('../data').settingsRowItems} props.data
 * @param {string} [props.subtitle] - optional subtitle
 */
export function SettingsStep ({ onNextPage, data, subtitle }) {
    const { state } = useRollin([300])
    const { t } = useTranslation()

    const dispatch = useGlobalDispatch()
    const appState = useGlobalState()
    if (appState.step.kind !== 'settings') throw new Error('unreachable, for TS benefit')

    const { step, status } = appState
    const pendingId = status.kind === 'executing' && status.action.kind === 'update-system-value' && status.action.id
    const complete = appState.activeRow >= step.rows.length

    /** @type {import("preact").ComponentProps<SettingListItem>['item'][]} */
    const rows = step.rows.map((rowId, index) => {
        return {
            visible: appState.activeRow >= index,
            current: appState.activeRow === index,
            systemValue: appState.values[rowId] || null,
            uiValue: appState.UIValues[rowId],
            pending: pendingId === rowId,
            id: rowId,
            data: data[rowId]
        }
    })

    return (
        <Stack>
            <Stack animate>
                {appState.status.kind === 'idle' && appState.status.error && (
                    <p>{appState.status.error}</p>
                )}
                {state.current > 0 && (
                    <Stack gap={Stack.gaps['4']}>
                        {subtitle && <h2>{subtitle}</h2>}
                        <List>
                            {rows.filter(item => item.visible).map((item, index) => {
                                return <SettingListItem key={item.id} dispatch={dispatch} item={item} index={index} />
                            })}
                        </List>
                    </Stack>
                )}
            </Stack>
            {complete && (
                <SlideUp delay={'double'}>
                    <ButtonBar>
                        <Button onClick={onNextPage} size={'large'}>{t('Next')}</Button>
                    </ButtonBar>
                </SlideUp>
            )}
        </Stack>
    )
}

/**
 * Renders a setting list item with optional interactive components.
 *
 * @param {Object} props - The props object.
 * @param {{
 *    visible: boolean;
 *    current: boolean;
 *    pending: boolean;
 *    id: import('../types').SystemValueId;
 *    systemValue: import('../types').SystemValue | null;
 *    data: import('../data').RowData;
 *    uiValue: import('../types').UIValue;
 * }} props.item - The item object containing the row data.
 * @param {ReturnType<typeof useGlobalDispatch>} props.dispatch - The function to dispatch actions.
 * @param {number} props.index
 */
function SettingListItem ({ index, item, dispatch }) {
    const data = item.data

    const accept = () => {
        dispatch({
            kind: 'update-system-value',
            id: data.id,
            payload: { enabled: true },
            current: item.current
        })
    }

    const deny = () => {
        dispatch({
            kind: 'update-system-value',
            id: data.id,
            payload: { enabled: false },
            current: item.current
        })
    }

    const inline = (() => {
        if (item.uiValue === 'idle') return null
        if (!item.systemValue) return null
        const enabled = item.systemValue.enabled

        // was this item previously skipped?
        if (item.uiValue === 'skipped') {
            // is the item something that can only be enabled once?
            if (enabled && item.data.kind === 'one-time') {
                return <BounceIn delay={'normal'}><Check /></BounceIn>
            }
            // otherwise, allow it to be toggled
            return (
                <FadeIn>
                    {item.data.kind === 'one-time' && (
                        <Button disabled={item.pending} variant={'secondary'} onClick={accept}>
                            {item.data.acceptText}
                        </Button>
                    )}
                    {item.data.kind === 'toggle' && (
                        <Switch
                            ariaLabel={item.data.acceptText}
                            pending={item.pending}
                            checked={enabled}
                            onChecked={accept}
                            onUnchecked={deny}
                        />
                    )}
                </FadeIn>
            )
        }

        // otherwise, it must have been accepted
        if (item.uiValue === 'accepted') {
            return <BounceIn delay={'normal'}><Check /></BounceIn>
        }

        throw new Error('unreachable')
    })()

    return (
        <ListItem
            key={data.id}
            icon={data.icon}
            title={data.title}
            secondaryText={item.current && data.secondaryText}
            inline={inline}
            animate={true}
            index={index}
        >
            {item.current && (
                <ListItem.Indent>
                    <ButtonBar>
                        <Button disabled={item.pending} variant={'secondary'} onClick={deny}>Skip</Button>
                        <Button disabled={item.pending} variant={'secondary'} onClick={accept}>{item.data.acceptText}</Button>
                    </ButtonBar>
                </ListItem.Indent>
            )}
        </ListItem>
    )
}
