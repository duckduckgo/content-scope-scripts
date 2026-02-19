import { h } from 'preact';
import { useCallback, useContext } from 'preact/hooks';
import { flushSync } from 'preact/compat';
import styles from './App.module.css';
import { GlobalContext, GlobalDispatch } from '../global';
import { useEnv } from '../../../../shared/components/EnvironmentProvider';
import { usePlatformName } from '../shared/components/SettingsProvider';
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary';
import { Fallback } from '../shared/components/Fallback';
import { Background } from './components/Background.js';
import { SingleStep } from './components/SingleStep';

/**
 * @param {object} props
 * @param {import("preact").ComponentChild} props.children
 */
export function App({ children }) {
    const { debugState } = useEnv();
    const platformName = usePlatformName();
    const globalState = useContext(GlobalContext);
    const parentDispatch = useContext(GlobalDispatch);

    // Proxy dispatch so that 'advance' actions run inside a view transition,
    // giving the bubble content a cross-fade between steps.
    const dispatch = useCallback(
        /** @param {import('../types').GlobalEvents} msg */
        (msg) => {
            if (msg.kind === 'advance') {
                document.startViewTransition(() => {
                    flushSync(() => parentDispatch(msg));
                });
            } else {
                parentDispatch(msg);
            }
        },
        [parentDispatch],
    );

    const { activeStep, exiting } = globalState;

    const advance = () => dispatch({ kind: 'advance' });

    const didCatch = ({ error }) => {
        const message = error?.message || 'unknown';
        dispatch({ kind: 'error-boundary', error: { message, id: activeStep } });
    };

    // For screens that animate out, trigger 'advance' when the animation finishes.
    const didAnimationEnd = (e) => {
        if (e.target?.dataset?.exiting === 'true') {
            advance();
        }
    };

    // For non-animating steps, just advance immediately when 'exiting' is set
    const didRender = (e) => {
        /** @type {import('../types').Step['id'][]} */
        const ignoredSteps = ['welcome'];
        const shouldSkipAnimation = ignoredSteps.includes(e?.dataset?.current);
        if (shouldSkipAnimation && exiting === true) {
            advance();
        }
    };

    return (
        <main data-platform-name={platformName || 'macos'} data-app-version="v4">
            <Background />
            {debugState && <Debug state={globalState} />}
            <div
                class={styles.container}
                data-current={activeStep}
                data-exiting={String(exiting)}
                ref={didRender}
                onAnimationEnd={didAnimationEnd}
            >
                <GlobalDispatch.Provider value={dispatch}>
                    <ErrorBoundary didCatch={didCatch} fallback={<Fallback />}>
                        <SingleStep />
                    </ErrorBoundary>
                </GlobalDispatch.Provider>
            </div>
            {children}
        </main>
    );
}

function Debug(props) {
    const { order, step, exiting, activeStep, nextStep } = props.state;
    const debugData = { order, step, exiting, activeStep, nextStep };

    return (
        <div style={{ position: 'absolute', top: 0, right: 0, overflowY: 'scroll', height: '100vh', zIndex: 10000, pointerEvents: 'none' }}>
            <pre>
                <code>{JSON.stringify(debugData, null, 2)}</code>
            </pre>
        </div>
    );
}
