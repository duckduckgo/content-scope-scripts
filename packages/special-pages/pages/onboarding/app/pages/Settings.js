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
import { useGlobalDispatch, useGlobalState } from '../global'
import { settingsElements } from '../row-data'
import { useTranslation } from '../translations'

/**
 * @param {object} props
 * @param {(args: any) => void} props.onNextPage
 * @param {typeof import('../row-data').settingsRowItems} props.data
 * @param {string} props.title
 * @param {number} props.stepNumber - for the progress indicator
 */
export function Settings ({ onNextPage, data, title, stepNumber }) {
    // each section is user-triggered here
    const { state, advance } = useRollin(['start-trigger'])
    const { t } = useTranslation()

    const dispatch = useGlobalDispatch()
    const appState = useGlobalState()
    if (appState.step.kind !== 'settings') throw new Error('unreachable, for TS benefit')

    const { step, status } = appState
    const pendingId = status.kind === 'executing' && status.action.kind === 'update-system-value' && status.action.id
    const complete = step.active >= step.rows.length - 1

    /** @type {import("preact").ComponentProps<SettingListItem>['item'][]} */
    const rows = step.rows.map((rowId, index) => {
        return {
            visible: step.active >= index,
            current: step.active === index,
            systemValue: appState.values[rowId],
            pending: pendingId === rowId,
            id: rowId,
            data: data[rowId],
            child: settingsElements[rowId].child,
            accept: settingsElements[rowId].accept
        }
    })

    return (
        <Stack>
            <Header
                title={title}
                aside={<Progress current={stepNumber} total={4} />}
                onComplete={advance}
            />
            <Content>
                <Stack animate>
                    {appState.status.kind === 'idle' && appState.status.error && (
                        <p>{appState.status.error}</p>
                    )}
                    {state.current > 0 && (
                        <List>
                            {rows.map((item) => {
                                if (!item.visible) return null
                                return <SettingListItem key={item.id} dispatch={dispatch} item={item} />
                            })}
                        </List>
                    )}
                    {complete && (
                        <ButtonBar>
                            <Button onClick={onNextPage} size={'large'}>{t('Next')}</Button>
                        </ButtonBar>
                    )}
                </Stack>
            </Content>
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
 *    systemValue: import('../types').SystemValue;
 *    data: import('../row-data').RowData;
 *    child: import('../row-data').ChildFn;
 *    accept: import('../row-data').AcceptFn;
 * }} props.item - The item object containing the row data.
 * @param {ReturnType<typeof useGlobalDispatch>} props.dispatch - The function to dispatch actions.
 */
function SettingListItem ({ item, dispatch }) {
    const data = item.data

    const accept = (choice = undefined) => {
        dispatch({
            kind: 'update-system-value',
            id: data.id,
            payload: { enabled: true, value: choice }
        })
    }

    const deny = () => {
        dispatch({
            kind: 'update-system-value',
            id: data.id,
            payload: { enabled: false }
        })
    }

    const inline = (() => {
        if (!item.systemValue) return null
        const enabled = item.systemValue.enabled
        if (item.pending) {
            return item.accept({ accept, deny, enabled, pending: item.pending })
        }
        /**
         * For one-time actions, switch to a green check-mark when enabled
         */
        if (item.systemValue.enabled === true && item.data.kind === 'one-time') {
            return <BounceIn delay={'normal'}><Check /></BounceIn>
        }
        /**
         * Otherwise, defer to the item specific UI (like a switch)
         */
        return item.accept({ accept, deny, enabled, pending: false })
    })()

    return (
        <ListItem
            key={data.id}
            icon={data.icon}
            title={data.title}
            secondaryText={item.current && data.secondaryText}
            inline={inline}
        >
            {item.current && (
                <ListItem.Indent>
                    {item.child({ accept, deny, pending: item.pending })}
                </ListItem.Indent>
            )}
        </ListItem>
    )
}
