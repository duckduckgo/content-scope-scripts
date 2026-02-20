import { h, Fragment } from 'preact';
import { useGlobalDispatch, useGlobalState } from '../../global';
import { useTypedTranslation } from '../../types';
import { usePlatformName } from '../../shared/components/SettingsProvider';
import { BounceIn, FadeIn, Launch } from '../../shared/components/Icons';
import { Switch } from '../../../../../shared/components/Switch/Switch.js';
import { useEnv } from '../../../../../shared/components/EnvironmentProvider.js';
import { settingsRowItems } from '../data/data';
import { Button } from './Button';
import styles from './SettingsContent.module.css';

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

    const advance = () => dispatch({ kind: 'enqueue-next' });
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
        <div class={styles.root}>
            <div class={styles.rows}>
                {rows
                    .filter((item) => item.visible)
                    .map((item, index) => (
                        <Fragment key={item.id}>
                            {index > 0 && <div class={styles.divider} />}
                            <SettingListItem dispatch={dispatch} item={item} />
                        </Fragment>
                    ))}
            </div>

            {appState.status.kind === 'idle' && appState.status.error && <p>{appState.status.error}</p>}

            {isDone && (
                <div class={styles.actions}>
                    <Button size="wide" onClick={isLastStep ? dismiss : advance}>
                        {isLastStep ? t('startBrowsing') : t('nextButton')}
                        {isLastStep && <Launch />}
                    </Button>
                </div>
            )}
        </div>
    );
}

/**
 * A green check icon for completed settings rows.
 */
function CheckIcon() {
    return <img src="assets/img/v4/icons/check-circle.svg" width="16" height="16" alt="Completed Action" />;
}

/**
 * Renders a single settings row with icon, title, and optional inline action / buttons.
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
 */
function SettingListItem({ item, dispatch }) {
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

    const iconPath = 'assets/img/steps/' + data.icon;

    const inline = (() => {
        if (item.uiValue === 'idle') return null;
        if (!item.systemValue) return null;
        const enabled = item.systemValue.enabled;

        if (item.uiValue === 'skipped') {
            if (enabled && item.data.kind === 'one-time') {
                return (
                    <BounceIn delay={'normal'}>
                        <CheckIcon />
                    </BounceIn>
                );
            }
            return (
                <FadeIn>
                    {item.data.kind === 'one-time' && (
                        <Button variant="secondary" disabled={item.pending} onClick={accept}>
                            {item.data.acceptTextRecall || item.data.acceptText}
                        </Button>
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
                    <CheckIcon />
                </BounceIn>
            );
        }

        throw new Error('unreachable');
    })();

    return (
        <div class={styles.row} data-testid="ListItem" data-id={data.id}>
            <div class={styles.rowContent}>
                <div class={styles.rowMain}>
                    <img class={styles.rowIcon} src={iconPath} alt="" />
                    <div class={styles.rowText}>
                        <p class={styles.rowTitle}>{data.title}</p>
                        {item.current && data.secondaryText && <p class={styles.rowSubtitle}>{data.secondaryText}</p>}
                    </div>
                    {inline && <div class={styles.rowInline}>{inline}</div>}
                </div>

                {item.current && (
                    <div class={styles.rowButtons}>
                        <Button variant="secondary" disabled={item.pending} onClick={deny}>
                            {t('skipButton')}
                        </Button>
                        <Button disabled={item.pending} onClick={accept}>
                            {item.data.acceptText}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
