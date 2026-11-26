import { createContext, h } from 'preact';
import { useCallback, useContext, useEffect, useReducer } from 'preact/hooks';
import { usePlatformName } from './shared/components/SettingsProvider.js';

/**
 * @typedef {import("./types.js").GlobalState} GlobalState
 * @typedef {import("./types.js").GlobalEvents} GlobalEvents
 */

export const GlobalContext = createContext(/** @type {GlobalState} */ ({}));
export const GlobalDispatch = createContext(/** @type {import("preact/hooks").Dispatch<GlobalEvents>} */ ({}));

/**
 * All application state is managed here.
 *
 * @param {GlobalState} state
 * @param {GlobalEvents} action
 * @return {GlobalState}
 */
export function reducer(state, action) {
    // console.group('reducer')
    // console.log('state', state)
    // console.log('action', action)
    // console.groupEnd()

    if (action.kind === 'config-update') {
        let nextStepDefs = state.stepDefinitions;
        if (action.stepDefinitions) {
            nextStepDefs = { ...state.stepDefinitions };
            for (const [key, value] of Object.entries(action.stepDefinitions)) {
                if (typeof value === 'object' && value !== null && nextStepDefs[key]) {
                    nextStepDefs[key] = { ...nextStepDefs[key], ...value };
                } else {
                    nextStepDefs[key] = value;
                }
            }
        }
        let nextOrder = state.order;
        if (action.exclude) {
            // The active step stays in the order even when excluded, so leaving it still finds the step after it
            nextOrder = state.order.filter((id) => id === state.activeStep || !action.exclude?.includes(id));
        }
        return {
            ...state,
            stepDefinitions: nextStepDefs,
            order: nextOrder,
            step: nextStepDefs[state.activeStep] ?? state.step,
        };
    }
    switch (state.status.kind) {
        case 'idle': {
            switch (action.kind) {
                case 'update-system-value':
                case 'picker-ask': {
                    return { ...state, status: { kind: 'executing', action } };
                }
                case 'error-boundary': {
                    return { ...state, status: { kind: 'fatal', action } };
                }
                case 'title-complete': {
                    return {
                        ...state,
                        activeStepVisible: true,
                    };
                }
                case 'advance': {
                    const currentPageIndex = state.order.indexOf(state.activeStep);
                    const nextPageIndex = currentPageIndex + 1;
                    if (nextPageIndex < state.order.length) {
                        return {
                            ...state,
                            activeStep: state.order[nextPageIndex],
                            nextStep: state.order[nextPageIndex + 1],
                            activeRow: 0,
                            activeStepVisible: false,
                            exiting: false,
                            overlay: null,
                            step: state.stepDefinitions[state.order[nextPageIndex]],
                        };
                    }
                    return state;
                }
                case 'enqueue-next': {
                    return {
                        ...state,
                        exiting: true,
                    };
                }
                case 'show-overlay': {
                    return {
                        ...state,
                        overlay: action.overlay,
                    };
                }
                case 'dismiss-overlay': {
                    return {
                        ...state,
                        overlay: null,
                    };
                }
                default:
                    return state;
            }
        }
        case 'executing': {
            // While the page waits for native's picker answer, the answer is the only way out. Clicks on the
            // step before the picker are dropped, since the answer advances the page itself.
            if (state.status.action.kind === 'picker-ask') {
                if (action.kind !== 'picker-answer') return state;
                return { ...applyPickerAnswer(state, action), status: { kind: 'idle' } };
            }
            switch (action.kind) {
                case 'telemetry':
                    return state;
                // The title can finish typing while a value is saving, e.g. after a click lands on a new step's
                // option straight away
                case 'title-complete': {
                    return { ...state, activeStepVisible: true };
                }
                case 'exec-complete': {
                    if (state.step.kind === 'settings') {
                        // only advance to another row if we're updating the current item.
                        // this allows us to toggle items on/off even when the row is no longer the active one
                        const currentRow = state.step.rows[state.activeRow];
                        const isCurrent = currentRow === action.id;

                        /** @type {import('./types').SystemValueId} */
                        const systemValueId = action.id;

                        // skip Duck Player onboarding step when ad blocking is enabled
                        // note: there's no UI for disabling this setting, so we never need to re-insert duckPlayerSingle into order
                        const isAdBlockingSetting =
                            systemValueId === 'placebo-ad-blocking' ||
                            systemValueId === 'aggressive-ad-blocking' ||
                            systemValueId === 'youtube-ad-blocking';
                        const nextOrder =
                            isAdBlockingSetting && action.payload.enabled
                                ? state.order.filter((step) => step !== 'duckPlayerSingle')
                                : state.order;

                        /** @type {import('./types').UIValue} */
                        const nextUIState = isCurrent && action.payload.enabled ? 'accepted' : 'skipped';

                        return {
                            ...state,
                            status: { kind: 'idle' },
                            step: {
                                // bump the step (show the next row)
                                ...state.step,
                            },
                            order: nextOrder,
                            activeRow: isCurrent ? state.activeRow + 1 : state.activeRow,
                            values: {
                                ...state.values,
                                // store the updated value in global state
                                [systemValueId]: action.payload,
                            },
                            UIValues: {
                                ...state.UIValues,
                                // store the UI state, so we know if it was skipped or not
                                [systemValueId]: nextUIState,
                            },
                        };
                    }
                    // Handle exec-complete for 'info' kind steps (e.g., addressBarMode)
                    // These steps dispatch system values but don't need row advancement
                    if (state.step.kind === 'info') {
                        return {
                            ...state,
                            status: { kind: 'idle' },
                            values: {
                                ...state.values,
                                [action.id]: action.payload,
                            },
                        };
                    }
                    throw new Error('unimplemented');
                }
                case 'exec-error': {
                    return {
                        ...state,
                        status: { kind: 'idle', error: action.message },
                    };
                }
                default:
                    throw new Error('unhandled ' + action.kind);
            }
        }
    }
    return state;
}

/**
 * Drops the picker from the order on a no, and hands the picker native's favorites on a yes.
 *
 * @param {GlobalState} state
 * @param {import('./types').PickerAnswerEvent} action
 * @return {GlobalState}
 */
function applyPickerAnswer(state, action) {
    if (!action.show) {
        return { ...state, order: state.order.filter((id) => id !== 'picker') };
    }
    const picker = state.stepDefinitions.picker;
    if (!action.existingFavorites || picker?.id !== 'picker') return state;
    return {
        ...state,
        stepDefinitions: {
            ...state.stepDefinitions,
            picker: { ...picker, existingFavorites: action.existingFavorites },
        },
    };
}

/**
 * Provides navigation functionality for the application.
 * @param {Object} props - The properties for the NavigationProvider component.
 * @param {import('./types').Step['id'][]} props.order - The order of screens to display
 * @param {import("preact").ComponentChild} props.children - The children components.
 * @param {import('./types').StepDefinitions} props.stepDefinitions -
 * @param {import("../src/index.js").OnboardingPage} props.messaging - The messaging object used for communication.
 * @param {import('./types').Step['id']} [props.firstPage]
 */
export function GlobalProvider({ order, children, stepDefinitions, messaging, firstPage = 'welcome' }) {
    const [state, dispatch] = useReducer(reducer, {
        status: { kind: 'idle' },
        order,
        stepDefinitions,
        step: stepDefinitions[firstPage],
        activeStep: firstPage,
        nextStep: order[1],
        activeRow: 0,
        activeStepVisible: false,
        exiting: false,
        overlay: null,
        values: {},
        UIValues: {
            dock: 'idle',
            import: 'idle',
            'default-browser': 'idle',
            bookmarks: 'idle',
            'session-restore': 'idle',
            'home-shortcut': 'idle',
            'placebo-ad-blocking': 'idle',
            'aggressive-ad-blocking': 'idle',
            'youtube-ad-blocking': 'idle',
            'address-bar-mode': 'idle',
            'dock-instructions': 'idle',
            'chrome-extension-install': 'idle',
        },
    });

    const platform = usePlatformName();

    const proxy = useCallback(
        (/** @type {GlobalEvents} */ msg) => {
            /**
             * Right before the picker, ask native whether to show it. Native enrolls the user at this point, so
             * the page asks only when the user is about to reach the step, and drops it if the answer is no.
             * The ask runs in the effect below, and its answer advances the page.
             */
            if (msg.kind === 'advance' && nextStepId(state.order, state.activeStep) === 'picker') {
                dispatch({ kind: 'picker-ask' });
                return;
            }

            /**
             * Past the last step there is nowhere to go. Under reduced motion, Bubble's ref callback calls onExitComplete
             * again on every re-render while `exiting` is true, e.g. after a no from native finished onboarding. This
             * drops those repeats so the step isn't reported twice.
             */
            if (msg.kind === 'advance' && nextStepId(state.order, state.activeStep) === null) {
                return;
            }

            /**
             * Regular global state updates
             */
            dispatch(msg);

            /**
             * Side effects that don't impact global state (advance to non-customize step, or other message kinds).
             */
            if (msg.kind === 'advance') {
                reportStepCompleted(state, state.order, messaging);
            }
            if (msg.kind === 'show-overlay' && msg.overlay === 'dock-instructions') {
                messaging.telemetryEvent({ attributes: { name: 'dock_instructions_shown' } });
            }
            if (msg.kind === 'update-system-value' && !msg.payload.enabled && msg.current) {
                messaging.telemetryEvent({ attributes: { name: 'row_skipped', value: msg.id } });
            }
            if (msg.kind === 'telemetry') {
                messaging.telemetryEvent({ attributes: msg.attributes });
            }
            if (msg.kind === 'dismiss-to-settings') {
                messaging.dismissToSettings();
            }
            if (msg.kind === 'dismiss') {
                messaging.dismissToAddressBar();
            }
            if (msg.kind === 'submit-query') {
                messaging.submitQuery(msg.params);
            }
            if (msg.kind === 'add-favorites') {
                messaging.addFavorites(msg.params);
            }
            if (msg.kind === 'request-chrome-extension') {
                messaging.requestChromeExtensionInstall();
            }
            if (msg.kind === 'set-onboarding-install-options') {
                messaging.setOnboardingInstallOptions(msg.payload);
            }
        },
        [state, messaging],
    );

    useEffect(() => {
        const unsubscribe = messaging.onConfigUpdate((data) => {
            dispatch({
                kind: 'config-update',
                stepDefinitions: data.stepDefinitions,
                exclude: /** @type {import('./types.js').ConfigUpdateEvent['exclude']} */ (data.exclude),
            });
        });
        return unsubscribe;
    }, [messaging]);
    // handle *fatal* state (from error boundary)
    useEffect(() => {
        if (state.status.kind !== 'fatal') return;
        const { error } = state.status.action;
        messaging.reportPageException(error);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- workaround during eslint react rollout; consider removing and addressing deps
    }, [state.status.kind, messaging]);

    // handle 'picker-ask': ask native, then advance past the step before the picker with its answer applied.
    // A no with nothing after the picker finishes onboarding, since there is no step left to advance to.
    useEffect(() => {
        if (state.status.kind !== 'executing' || state.status.action.kind !== 'picker-ask') return;
        const order = state.order;
        askTopSitesPicker(messaging)
            // eslint-disable-next-line promise/prefer-await-to-then
            .then((answer) => {
                const nextOrder = answer.show ? order : order.filter((id) => id !== 'picker');
                dispatch({ kind: 'picker-answer', ...answer });
                if (nextStepId(nextOrder, state.activeStep) !== null) {
                    dispatch({ kind: 'advance' });
                    reportStepCompleted(state, nextOrder, messaging);
                } else {
                    // Like Start Browsing on a last step, this sends no stepCompleted
                    messaging.dismissToAddressBar();
                }
            })
            // eslint-disable-next-line promise/prefer-await-to-then
            .catch((e) => console.warn('handling the picker answer failed', e));
        // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per ask, like the update-system-value effect below
    }, [state.status.kind, messaging]);

    // handle 'update-system-value' messages from the UI
    useEffect(() => {
        if (state.status.kind !== 'executing') return;
        if (state.status.action.kind !== 'update-system-value') return;

        /** @type {import('./types').UpdateSystemValueEvent} */
        const action = state.status.action;

        handleSystemSettingUpdate(action, messaging, platform)
            // eslint-disable-next-line promise/prefer-await-to-then
            .then((/** @type {import('./types').SystemValue} */ payload) => {
                dispatch({
                    kind: 'exec-complete',
                    id: action.id,
                    payload,
                });
                // Fire row_shown for the next row if we just completed the active row
                if (state.step?.kind === 'settings') {
                    const currentRow = state.step.rows[state.activeRow];
                    if (currentRow === action.id) {
                        const nextRowId = state.step.rows[state.activeRow + 1];
                        if (nextRowId) {
                            messaging.telemetryEvent({ attributes: { name: 'row_shown', value: nextRowId } });
                        }
                    }
                }
            })
            // eslint-disable-next-line promise/prefer-await-to-then
            .catch((e) => {
                const message = e?.message || 'unknown error';
                dispatch({ kind: 'exec-error', id: action.id, message });
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- workaround during eslint react rollout; consider removing and addressing deps
    }, [state.status.kind, messaging]);

    return (
        <GlobalContext.Provider value={state}>
            <GlobalDispatch.Provider value={proxy}>{children}</GlobalDispatch.Provider>
        </GlobalContext.Provider>
    );
}

/**
 * @param {import('./types').Step['id'][]} order
 * @param {import('./types').Step['id']} activeStep
 * @returns {import('./types').Step['id'] | null} the step after `activeStep` in `order`, or null if there is none
 */
function nextStepId(order, activeStep) {
    return order[order.indexOf(activeStep) + 1] ?? null;
}

/**
 * Tells native the active step is done, and which step comes after it.
 *
 * @param {GlobalState} state
 * @param {import('./types').Step['id'][]} order - the order the step after the active one comes from
 * @param {import("../src/index.js").OnboardingPage} messaging
 */
function reportStepCompleted(state, order, messaging) {
    const next = nextStepId(order, state.activeStep);
    messaging.stepCompleted({ id: state.activeStep, next });
    // Fire row_shown for the first row of the incoming settings step
    if (next) {
        const nextStepDef = state.stepDefinitions[next];
        if (nextStepDef?.kind === 'settings' && nextStepDef.rows[0]) {
            messaging.telemetryEvent({ attributes: { name: 'row_shown', value: nextStepDef.rows[0] } });
        }
    }
}

/**
 * How long the page waits for native's picker answer before skipping the step, so a missing answer can't
 * leave the user stuck on the step before the picker.
 */
const PICKER_ANSWER_TIMEOUT_MS = 2000;

/**
 * Asks native whether to show the picker. A failed request, an answer the page can't read, or no answer within
 * PICKER_ANSWER_TIMEOUT_MS skips the step. An answer that arrives after the timeout is ignored.
 *
 * @param {import("../src/index.js").OnboardingPage} messaging
 * @param {number} [timeoutMs]
 * @returns {Promise<Omit<import('./types').PickerAnswerEvent, 'kind'>>}
 */
async function askTopSitesPicker(messaging, timeoutMs = PICKER_ANSWER_TIMEOUT_MS) {
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    let timer;
    const timeout = new Promise((resolve) => {
        timer = setTimeout(() => resolve(null), timeoutMs);
    });
    try {
        const answer = await Promise.race([messaging.shouldShowTopSitesPicker(), timeout]);
        if (answer === null) console.warn(`shouldShowTopSitesPicker got no answer within ${timeoutMs}ms, skipping the picker`);
        if (answer?.show !== true) return { show: false };
        return {
            show: true,
            existingFavorites: Array.isArray(answer.existingFavorites) ? answer.existingFavorites : undefined,
        };
    } catch (e) {
        console.warn('shouldShowTopSitesPicker failed, skipping the picker', e);
        return { show: false };
    } finally {
        clearTimeout(timer);
    }
}

/**
 * A single place to handle all messages from the UI that update system settings.
 *
 * @param {import('./types').UpdateSystemValueEvent} action
 * @param {import("../src/index.js").OnboardingPage} messaging
 * @param {ImportMeta['platform']} platform
 */
async function handleSystemSettingUpdate(action, messaging, platform) {
    const { id, payload } = action;
    switch (id) {
        case 'bookmarks': {
            messaging.setBookmarksBar(payload);
            return payload;
        }
        case 'session-restore': {
            messaging.setSessionRestore(payload);
            return payload;
        }
        case 'home-shortcut': {
            messaging.setShowHomeButton(payload);
            return payload;
        }
        case 'placebo-ad-blocking':
        case 'aggressive-ad-blocking':
        case 'youtube-ad-blocking': {
            messaging.setAdBlocking(payload);
            return payload;
        }
        case 'address-bar-mode': {
            messaging.setDuckAiInAddressBar(payload);
            return payload;
        }
        case 'dock': {
            // if a users presses 'skip' and we remove from the dock, can it actually be un-done? (eg: placed back?)
            if (payload.enabled) {
                await messaging.requestDockOptIn();
                return { enabled: true };
            }
            break;
        }
        case 'import': {
            if (payload.enabled) {
                if (platform === 'macos') {
                    return await messaging.requestImport();
                }

                // enabled means we've launched a native UI, not that imports actually occurred
                // todo: can we support both? if a user presses cancel, should we detect and allow them to try again?
                await messaging.requestImport();
                return { enabled: true };
            }
            break;
        }
        case 'default-browser': {
            if (payload.enabled) {
                // enabled means we've launched a native UI, not that we actually agreed
                // todo: can we support both? if a user presses cancel, should we detect and allow them to try again?
                await messaging.requestSetAsDefault();
                return { enabled: true };
            }
            break;
        }
    }
    if ('value' in payload) {
        return { enabled: payload.enabled, value: payload.value };
    }
    return { enabled: payload.enabled };
}

export function useGlobalState() {
    return useContext(GlobalContext);
}

export function useGlobalDispatch() {
    return useContext(GlobalDispatch);
}
