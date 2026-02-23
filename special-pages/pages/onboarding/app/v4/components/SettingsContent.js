import { h } from 'preact';
import { useGlobalDispatch, useGlobalState } from '../../global';
import { useTypedTranslation } from '../../types';
import { usePlatformName } from '../../shared/components/SettingsProvider';
import { ListItem } from '../../shared/components/ListItem';
import { BounceIn, Check, FadeIn, Launch } from '../../shared/components/Icons';
import { Stack } from '../../shared/components/Stack';
import { Switch } from '../../../../../shared/components/Switch/Switch.js';
import { PlainList } from '../../shared/components/List';
import { useEnv } from '../../../../../shared/components/EnvironmentProvider.js';
import { settingsRowItems } from '../data/data';

/**
 * Bottom bubble content for systemSettings and customize steps.
 * Renders settings rows one at a time with Skip/Action buttons.
 * Shows "Next" button when all rows are complete.
 */
export function SettingsContent() {
    const platform = usePlatformName();
    const { t } = useTypedTranslation();
    const dispatch = useGlobalDispatch();
    const appState = useGlobalState();

    if (appState.step.kind !== 'settings') throw new Error('unreachable, for TS benefit');

    const { step, status, order, activeStep } = appState;
    const isDone = appState.activeRow >= step.rows.length;
    const isLastStep = order[order.length - 1] === activeStep;
    const pendingId = status.kind === 'executing' && status.action.kind === 'update-system-value' && status.action.id;

    const advance = () => dispatch({ kind: 'advance' });
    const dismiss = () => dispatch({ kind: 'dismiss' });

    /** @type {import("preact").ComponentProps<SettingListItem>['item'][]} */
    const rows = step.rows.map((rowId, index) => {
        return {
            visible: appState.activeRow >= index,
            current: appState.activeRow === index,
            systemValue: appState.values[rowId] || null,
            uiValue: appState.UIValues[rowId],
            pending: pendingId === rowId,
            id: rowId,
            data: settingsRowItems[rowId](t, platform),
        };
    });

    return (
        <div>
            <Stack>
                {appState.status.kind === 'idle' && appState.status.error && <p>{appState.status.error}</p>}
                <PlainList variant="bordered" animate>
                    {rows
                        .filter((item) => item.visible)
                        .map((item, index) => {
                            return <SettingListItem key={item.id} dispatch={dispatch} item={item} index={index} />;
                        })}
                </PlainList>
            </Stack>

            {isDone && (
                <div>
                    <button type="button" onClick={isLastStep ? dismiss : advance}>
                        {isLastStep ? t('startBrowsing') : t('nextButton')}
                        {isLastStep && <Launch />}
                    </button>
                </div>
            )}
        </div>
    );
}

/**
 * Renders a setting list item with optional interactive components.
 *
 * @param {Object} props
 * @param {{
 *    visible: boolean;
 *    current: boolean;
 *    pending: boolean;
 *    id: import('../../types').SystemValueId;
 *    systemValue: import('../../types').SystemValue | null;
 *    data: import('../data/data').RowData;
 *    uiValue: import('../../types').UIValue;
 * }} props.item
 * @param {ReturnType<typeof useGlobalDispatch>} props.dispatch
 * @param {number} props.index
 */
export function SettingListItem({ index, item, dispatch }) {
    const data = item.data;
    const { t } = useTypedTranslation();
    const { isDarkMode } = useEnv();
    const platformName = /** @type {'macos'|'windows'} */ (usePlatformName());

    const accept = () => {
        dispatch({
            kind: 'update-system-value',
            id: data.id,
            payload: { enabled: true },
            current: item.current,
        });
    };

    const deny = () => {
        dispatch({
            kind: 'update-system-value',
            id: data.id,
            payload: { enabled: false },
            current: item.current,
        });
    };

    const inline = (() => {
        if (item.uiValue === 'idle') return null;
        if (!item.systemValue) return null;
        const enabled = item.systemValue.enabled;

        if (item.uiValue === 'skipped') {
            if (enabled && item.data.kind === 'one-time') {
                return (
                    <BounceIn delay={'normal'}>
                        <Check />
                    </BounceIn>
                );
            }
            return (
                <FadeIn>
                    {item.data.kind === 'one-time' && (
                        <button type="button" disabled={item.pending} onClick={accept}>
                            {item.data.acceptTextRecall || item.data.acceptText}
                        </button>
                    )}
                    {item.data.kind === 'toggle' && (
                        <Switch
                            ariaLabel={item.data.acceptText}
                            pending={item.pending}
                            checked={enabled}
                            onChecked={accept}
                            onUnchecked={deny}
                            platformName={platformName}
                            theme={isDarkMode ? 'dark' : 'light'}
                        />
                    )}
                </FadeIn>
            );
        }

        if (item.uiValue === 'accepted') {
            return (
                <BounceIn delay={'normal'}>
                    <Check />
                </BounceIn>
            );
        }

        throw new Error('unreachable');
    })();

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
                    <div>
                        <button type="button" disabled={item.pending} onClick={deny}>
                            {t('skipButton')}
                        </button>
                        <button type="button" disabled={item.pending} onClick={accept}>
                            {item.data.acceptText}
                        </button>
                    </div>
                </ListItem.Indent>
            )}
        </ListItem>
    );
}
