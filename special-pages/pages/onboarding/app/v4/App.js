import { h } from 'preact';
import { useContext } from 'preact/hooks';
import './App.module.css';
import { GlobalContext, GlobalDispatch } from '../global';
import { useEnv } from '../../../../shared/components/EnvironmentProvider';
import { usePlatformName } from '../shared/components/SettingsProvider';
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary';
import { Fallback } from '../shared/components/Fallback';
import { Background } from './components/Background.js';
import { BeforeAfterProvider } from './context/BeforeAfterProvider';
import { SingleStep } from './components/SingleStep';

/**
 * @param {object} props
 * @param {import("preact").ComponentChild} props.children
 */
export function App({ children }) {
    const { debugState } = useEnv();
    const platformName = usePlatformName();
    const globalState = useContext(GlobalContext);
    const dispatch = useContext(GlobalDispatch);

    const { activeStep, exiting } = globalState;

    const advance = () => dispatch({ kind: 'advance' });

    const didCatch = ({ error }) => {
        const message = error?.message || 'unknown';
        dispatch({ kind: 'error-boundary', error: { message, id: activeStep } });
    };

    // For non-animating steps, just advance immediately when 'exiting' is set
    const didRender = (e) => {
        /** @type {import('../types').Step['id'][]} */
        const ignoredSteps = ['welcome', 'getStarted'];
        const shouldSkipAnimation = ignoredSteps.includes(e?.dataset?.current);
        if (shouldSkipAnimation && exiting === true) {
            advance();
        }
    };

    return (
        <main data-platform-name={platformName || 'macos'} data-app-version="v4">
            <Background />
            {debugState && <Debug state={globalState} />}
            <div style={{ position: 'relative', zIndex: 1 }} data-current={activeStep} data-exiting={String(exiting)} ref={didRender}>
                <ErrorBoundary didCatch={didCatch} fallback={<Fallback />}>
                    <BeforeAfterProvider>
                        <SingleStep />
                    </BeforeAfterProvider>
                </ErrorBoundary>
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
