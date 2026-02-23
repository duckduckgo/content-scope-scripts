import { h, Fragment } from 'preact';
import { useState } from 'preact/hooks';
import cn from 'classnames';
import { useGlobalDispatch, useGlobalState } from '../../global';
import { useTypedTranslation } from '../../types';
import { usePlatformName } from '../../shared/components/SettingsProvider';
import { BounceIn, FadeIn, Launch } from '../../shared/components/Icons';
import { Switch } from '../../../../../shared/components/Switch/Switch.js';
import { useEnv } from '../../../../../shared/components/EnvironmentProvider.js';
import { settingsRowItems } from '../data/data';
import { Button } from './Button';
import { usePresence } from '../hooks/usePresence';
import { useFlip } from '../hooks/useFlip';
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
    const { isReducedMotion } = useEnv();

    if (appState.step.kind !== 'settings') throw new Error('unreachable, for TS benefit');

    const { step, status, order, activeStep } = appState;
    const isDone = appState.activeRow >= step.rows.length;
    const isLastStep = order[order.length - 1] === activeStep;
    const pendingId = status.kind === 'executing' && status.action.kind === 'update-system-value' && status.action.id;

    const [exitingIndex, setExitingIndex] = useState(/** @type {number | null} */ (null));
    const enteringIndex = exitingIndex !== null && exitingIndex + 1 < step.rows.length ? exitingIndex + 1 : null;
    const isAnimating = exitingIndex !== null;

    const rows = step.rows.map((rowId, index) => {
        return {
            visible: appState.activeRow >= index || enteringIndex === index,
            current: appState.activeRow === index,
            isExiting: exitingIndex === index,
            isEntering: enteringIndex === index,
            systemValue: appState.values[rowId] || null,
            uiValue: appState.UIValues[rowId],
            pending: pendingId === rowId,
            id: rowId,
            data: settingsRowItems[rowId](t, platform),
        };
    });

    const advance = () => dispatch({ kind: 'enqueue-next' });
    const dismiss = () => dispatch({ kind: 'dismiss' });

    return (
        <div class={styles.root}>
            <div class={styles.rows}>
                {rows
                    .filter((item) => item.visible)
                    .map((item, index) => (
                        <Fragment key={item.id}>
                            {index > 0 && <div class={cn(styles.divider, item.isEntering && styles.fadeIn)} />}
                            <SettingListItem
                                dispatch={dispatch}
                                item={item}
                                onAction={() => {
                                    if (isReducedMotion) return;
                                    setExitingIndex(appState.activeRow);
                                }}
                                onTransitionEnd={() => setExitingIndex(null)}
                            />
                        </Fragment>
                    ))}
            </div>

            {appState.status.kind === 'idle' && appState.status.error && <p>{appState.status.error}</p>}

            {isDone && (
                <div class={cn(styles.actions, isAnimating && styles.fadeInDelayed)}>
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
 * @typedef {{
 *    visible: boolean;
 *    current: boolean;
 *    isExiting: boolean;
 *    isEntering: boolean;
 *    pending: boolean;
 *    id: import('../../types').SystemValueId;
 *    systemValue: import('../../types').SystemValue | null;
 *    data: import('../data/data').RowData;
 *    uiValue: import('../../types').UIValue;
 * }} SettingRowItem
 */

/**
 * Renders a single settings row with icon, title, and optional inline action / buttons.
 *
 * @param {Object} props
 * @param {SettingRowItem} props.item
 * @param {ReturnType<typeof useGlobalDispatch>} props.dispatch
 * @param {() => void} props.onAction
 * @param {() => void} props.onTransitionEnd
 */
function SettingListItem({ item, dispatch, onAction, onTransitionEnd }) {
    const { data, current, isExiting, isEntering, pending } = item;
    const { t } = useTypedTranslation();

    // usePresence must be declared before useFlip so its useLayoutEffect runs first, taking
    // elements out of flow before useFlip measures the new layout
    /** @type {[import('preact').RefObject<HTMLParagraphElement>, boolean]} */
    const [subtitleRef, subtitleMounted] = usePresence(!isExiting, {
        keyframes: [{ opacity: 1 }, { opacity: 0 }],
        options: { duration: 200, easing: 'ease-out' },
    });
    /** @type {[import('preact').RefObject<HTMLDivElement>, boolean]} */
    const [buttonsRef, buttonsMounted] = usePresence(!isExiting, {
        keyframes: [{ opacity: 1 }, { opacity: 0 }],
        options: { duration: 200, easing: 'ease-out' },
        onComplete: onTransitionEnd,
    });
    /** @type {import('preact').RefObject<HTMLImageElement>} */
    const iconRef = useFlip();

    /** @param {boolean} enabled */
    const handleAction = (enabled) => {
        if (isExiting || isEntering) return;
        if (current) onAction();
        dispatch({
            kind: 'update-system-value',
            id: data.id,
            payload: { enabled },
            current,
        });
    };

    const showDetails = current || isExiting || isEntering;

    return (
        <div class={cn(styles.row, isEntering && styles.fadeIn)} data-testid="ListItem" data-id={data.id}>
            <div class={styles.rowContent}>
                <div class={styles.rowMain}>
                    <img ref={iconRef} class={styles.rowIcon} src={'assets/img/steps/' + data.icon} alt="" />
                    <div class={styles.rowText}>
                        <p class={styles.rowTitle}>{data.title}</p>
                        {showDetails && data.secondaryText && subtitleMounted && (
                            <p ref={subtitleRef} class={styles.rowSubtitle}>
                                {data.secondaryText}
                            </p>
                        )}
                    </div>
                    <InlineAction item={item} onAction={handleAction} />
                </div>

                {showDetails && buttonsMounted && (
                    <div ref={buttonsRef} class={styles.rowButtons}>
                        <Button variant="secondary" disabled={pending} onClick={() => handleAction(false)}>
                            {t('skipButton')}
                        </Button>
                        <Button disabled={pending} onClick={() => handleAction(true)}>
                            {data.acceptText}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Inline action shown to the right of a row's title after the user has acted.
 * Renders a check icon, a recall button, or a toggle switch depending on state.
 *
 * @param {Object} props
 * @param {SettingRowItem} props.item
 * @param {(enabled: boolean) => void} props.onAction
 */
function InlineAction({ item, onAction }) {
    const { isDarkMode } = useEnv();
    const platformName = /** @type {'macos'|'windows'} */ (usePlatformName());

    if (item.uiValue === 'idle' || !item.systemValue) return null;

    if (item.uiValue === 'accepted' || (item.uiValue === 'skipped' && item.systemValue.enabled && item.data.kind === 'one-time')) {
        return (
            <div class={styles.rowInline}>
                <BounceIn delay={'normal'}>
                    <img src="assets/img/v4/icons/check-circle.svg" width="16" height="16" alt="Completed Action" />
                </BounceIn>
            </div>
        );
    }

    if (item.uiValue === 'skipped') {
        return (
            <div class={styles.rowInline}>
                <FadeIn>
                    {item.data.kind === 'one-time' && (
                        <Button variant="secondary" disabled={item.pending} onClick={() => onAction(true)}>
                            {item.data.acceptTextRecall || item.data.acceptText}
                        </Button>
                    )}
                    {item.data.kind === 'toggle' && (
                        <Switch
                            ariaLabel={item.data.acceptText}
                            pending={item.pending}
                            checked={item.systemValue.enabled}
                            onChecked={() => onAction(true)}
                            onUnchecked={() => onAction(false)}
                            platformName={platformName}
                            theme={isDarkMode ? 'dark' : 'light'}
                        />
                    )}
                </FadeIn>
            </div>
        );
    }

    throw new Error('unreachable');
}
