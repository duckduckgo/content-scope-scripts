import { h, Fragment } from 'preact';
import { useRef, useState } from 'preact/hooks';
import cn from 'classnames';
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
 * @typedef {{ top: number; left: number; width: number }} ElementPosition
 */

/**
 * @typedef {{
 *   exitingIndex: number;
 *   enteringIndex: number | null;
 *   showNextButton: boolean;
 *   exitingPositions: { subtitle?: ElementPosition; buttons?: ElementPosition } | null;
 * }} RowTransition
 */

/**
 * @typedef {{ content: HTMLElement | null; subtitle: HTMLElement | null; buttons: HTMLElement | null }} ExitAnimElements
 */

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

    const advance = () => dispatch({ kind: 'enqueue-next' });
    const dismiss = () => dispatch({ kind: 'dismiss' });

    // --- Row transition animation ---
    const exitAnimRef = useRef(/** @type {ExitAnimElements} */ ({ content: null, subtitle: null, buttons: null }));
    const [transition, setTransition] = useState(/** @type {RowTransition | null} */ (null));

    /** Called from row buttons before dispatching to start the exit/enter animation. */
    const startRowTransition = () => {
        if (isReducedMotion) return;
        const curr = appState.activeRow;
        const { content, subtitle, buttons } = exitAnimRef.current;

        /** @type {RowTransition['exitingPositions']} */
        let exitingPositions = null;
        if (content) {
            const containerRect = content.getBoundingClientRect();
            exitingPositions = {};
            if (subtitle) exitingPositions.subtitle = measureRelativeTo(subtitle, containerRect);
            if (buttons) exitingPositions.buttons = measureRelativeTo(buttons, containerRect);
        }

        setTransition({
            exitingIndex: curr,
            enteringIndex: curr + 1 < step.rows.length ? curr + 1 : null,
            showNextButton: curr + 1 >= step.rows.length,
            exitingPositions,
        });
    };

    const clearTransition = () => setTransition(null);

    /** @type {import("preact").ComponentProps<SettingListItem>['item'][]} */
    const rows = step.rows.map((rowId, index) => {
        return {
            visible: appState.activeRow >= index || transition?.enteringIndex === index,
            current: appState.activeRow === index,
            isExiting: transition?.exitingIndex === index,
            isEntering: transition?.enteringIndex === index,
            exitingPositions: transition?.exitingIndex === index ? transition.exitingPositions : null,
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
                            {index > 0 && <div class={cn(styles.divider, item.isEntering && styles.fadeIn)} />}
                            <SettingListItem
                                dispatch={dispatch}
                                item={item}
                                onAction={startRowTransition}
                                onTransitionEnd={clearTransition}
                                exitAnimRef={item.current ? exitAnimRef : null}
                            />
                        </Fragment>
                    ))}
            </div>

            {appState.status.kind === 'idle' && appState.status.error && <p>{appState.status.error}</p>}

            {isDone && (
                <div class={cn(styles.actions, transition?.showNextButton && styles.fadeInDelayed)}>
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
 * Measures an element's position relative to a container rect.
 * @param {HTMLElement} el
 * @param {DOMRect} containerRect
 * @returns {ElementPosition}
 */
function measureRelativeTo(el, containerRect) {
    const rect = el.getBoundingClientRect();
    return {
        top: rect.top - containerRect.top,
        left: rect.left - containerRect.left,
        width: rect.width,
    };
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
 *    isExiting: boolean;
 *    isEntering: boolean;
 *    exitingPositions: RowTransition['exitingPositions'];
 *    pending: boolean;
 *    id: import('../../types').SystemValueId;
 *    systemValue: import('../../types').SystemValue | null;
 *    data: import('../data/data').RowData;
 *    uiValue: import('../../types').UIValue;
 * }} props.item
 * @param {ReturnType<typeof useGlobalDispatch>} props.dispatch
 * @param {() => void} props.onAction
 * @param {() => void} props.onTransitionEnd
 * @param {import('preact').RefObject<ExitAnimElements> | null} props.exitAnimRef
 */
function SettingListItem({ item, dispatch, onAction, onTransitionEnd, exitAnimRef }) {
    const data = item.data;
    const { t } = useTypedTranslation();
    const { isDarkMode } = useEnv();
    const platformName = /** @type {'macos'|'windows'} */ (usePlatformName());

    const accept = () => {
        if (item.current) onAction();
        dispatch({
            kind: 'update-system-value',
            id: data.id,
            payload: { enabled: true },
            current: item.current,
        });
    };

    const deny = () => {
        if (item.current) onAction();
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

    const showDetails = item.current || item.isExiting || item.isEntering;
    const pos = item.exitingPositions;

    return (
        <div class={cn(styles.row, item.isEntering && styles.fadeIn)} data-testid="ListItem" data-id={data.id}>
            <div
                class={styles.rowContent}
                ref={(el) => {
                    if (exitAnimRef?.current) exitAnimRef.current.content = el;
                }}
            >
                <div class={styles.rowMain}>
                    <img class={styles.rowIcon} src={iconPath} alt="" />
                    <div class={styles.rowText}>
                        <p class={styles.rowTitle}>{data.title}</p>
                        {showDetails && data.secondaryText && (
                            <p
                                class={cn(styles.rowSubtitle, item.isExiting && styles.fadeOut)}
                                style={pos?.subtitle ? { position: 'absolute', ...pos.subtitle } : undefined}
                                ref={(el) => {
                                    if (exitAnimRef?.current) exitAnimRef.current.subtitle = el;
                                }}
                            >
                                {data.secondaryText}
                            </p>
                        )}
                    </div>
                    {inline && <div class={styles.rowInline}>{inline}</div>}
                </div>

                {showDetails && (
                    <div
                        class={cn(styles.rowButtons, item.isExiting && styles.fadeOut)}
                        style={pos?.buttons ? { position: 'absolute', ...pos.buttons } : undefined}
                        ref={(el) => {
                            if (exitAnimRef?.current) exitAnimRef.current.buttons = el;
                        }}
                        onAnimationEnd={
                            item.isExiting
                                ? (e) => {
                                      if (e.currentTarget === e.target) onTransitionEnd();
                                  }
                                : undefined
                        }
                    >
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
