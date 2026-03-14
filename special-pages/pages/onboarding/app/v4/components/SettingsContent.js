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
import { Container } from './Container';
import { usePresence } from '../hooks/usePresence';
import { useFlip } from '../hooks/useFlip';
import styles from './SettingsContent.module.css';

/**
 * Bottom bubble content for systemSettings and customize steps.
 * Renders settings rows one at a time with Skip/Action buttons.
 * Shows "Next" button when all rows are complete.
 *
 * @param {object} props
 * @param {() => void} props.advance
 * @param {() => void} props.dismiss
 * @param {(id: import('../../types').SystemValueId, payload: import('../../types').SystemValue, current: boolean) => void} props.updateSystemValue
 */
export function SettingsContent({ advance, dismiss, updateSystemValue }) {
    const platform = usePlatformName();
    const { t } = useTypedTranslation();
    const dispatch = useGlobalDispatch();
    const globalState = useGlobalState();
    const { isReducedMotion } = useEnv();

    if (globalState.step.kind !== 'settings') throw new Error('unreachable, for TS benefit');

    const { step, status, order, activeStep } = globalState;
    const isDone = globalState.activeRow >= step.rows.length;
    const isLastStep = order[order.length - 1] === activeStep;
    const pendingId = status.kind === 'executing' && status.action.kind === 'update-system-value' ? status.action.id : null;

    const [exitingIndex, setExitingIndex] = useState(/** @type {number | null} */ (null));
    const enteringIndex = exitingIndex !== null && exitingIndex + 1 < step.rows.length ? exitingIndex + 1 : null;
    const isAnimating = exitingIndex !== null;

    const rows = step.rows.map((rowId, index) => {
        return {
            visible: globalState.activeRow >= index || enteringIndex === index,
            current: globalState.activeRow === index,
            isExiting: exitingIndex === index,
            isEntering: enteringIndex === index,
            systemValue: globalState.values[rowId] || null,
            uiValue: globalState.UIValues[rowId],
            pending: pendingId === rowId,
            id: rowId,
            data: settingsRowItems[rowId](t, platform),
        };
    });

    return (
        <Container>
            <div class={styles.rows}>
                {rows
                    .filter((item) => item.visible)
                    .map((item, index) => (
                        <Fragment key={item.id}>
                            {index > 0 && <div class={cn(styles.divider, item.isEntering && styles.fadeIn)} />}
                            <SettingListItem
                                dispatch={dispatch}
                                updateSystemValue={updateSystemValue}
                                item={item}
                                onAction={() => {
                                    if (isReducedMotion) return;
                                    setExitingIndex(globalState.activeRow);
                                }}
                                onTransitionEnd={() => setExitingIndex(null)}
                            />
                        </Fragment>
                    ))}
            </div>

            {globalState.status.kind === 'idle' && globalState.status.error && <p>{globalState.status.error}</p>}

            {isDone && (
                <div class={cn(styles.actions, isAnimating && styles.fadeInDelayed)}>
                    <Button size="wide" onClick={isLastStep ? dismiss : advance}>
                        {isLastStep ? t('startBrowsing') : t('nextButton')}
                        {isLastStep && <Launch />}
                    </Button>
                </div>
            )}
        </Container>
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
 * @param {(id: import('../../types').SystemValueId, payload: import('../../types').SystemValue, current: boolean) => void} props.updateSystemValue
 * @param {() => void} props.onAction
 * @param {() => void} props.onTransitionEnd
 */
function SettingListItem({ item, dispatch, updateSystemValue, onAction, onTransitionEnd }) {
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
        if (data.id === 'dock-instructions' && enabled) {
            dispatch({ kind: 'show-overlay', overlay: 'dock-instructions' });
            return;
        }
        if (current) onAction();
        updateSystemValue(data.id, { enabled }, current);
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
