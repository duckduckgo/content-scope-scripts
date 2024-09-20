// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from 'preact'
import { useContext } from 'preact/hooks'
import { GlobalContext, GlobalDispatch } from '../global'
import { useEnv } from '../../../../shared/components/EnvironmentProvider'
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary'
import { Fallback } from '../pages/Fallback'
import { useTypedTranslation } from '../types'
import { Timeout } from './Timeout'
import { Background } from './Background'
import { ElasticButton } from './Buttons'
import { Heading } from './Heading'
import { Panel } from './Panel'
import { DuckPlayerStep } from '../pages/v3/DuckPlayerStep'
import { ImportStep } from '../pages/v3/ImportStep'
import { MakeDefaultStep } from '../pages/v3/MakeDefaultStep'
import { CustomizeStep } from '../pages/v3/CustomizeStep'
import { DockStep } from '../pages/v3/DockStep'

import styles from './App2.module.css'

export function Hiker () {
    return (
        <img className={styles.hiker} src="assets/img/hiker.svg" alt="Image of hiker" />
    )
}

/**
 * @param {object} props
 * @param {import("preact").ComponentChild} props.children
 */
export function App2 ({ children }) {
    const { debugState, isReducedMotion } = useEnv()
    const globalState = useContext(GlobalContext)
    const dispatch = useContext(GlobalDispatch)
    const { t } = useTypedTranslation()

    const { activeStep, activeStepVisible, exiting, order, step } = globalState

    const enqueueNext = () => {
        if (isReducedMotion) {
            dispatch({ kind: 'advance' })
        } else {
            dispatch({ kind: 'enqueue-next' })
        }
    }

    /** @type {import('../types').Step['id'][]} */
    const progress = order.slice(2, order.length)
    const showProgress = progress.includes(activeStep)

    const advance = () => dispatch({ kind: 'advance' })
    // const dismissToSettings = () => dispatch({ kind: 'dismiss-to-settings' })

    const didCatch = ({ error }) => {
        const message = error?.message || 'unknown'
        dispatch({ kind: 'error-boundary', error: { message, id: activeStep } })
    }

    // typescript is not quite smart enough to figure this part out

    // for screens that animate out, trigger the 'advance' when it's finished.
    function animationDidFinish (e) {
        if (e.target?.dataset?.exiting === 'true') {
            advance()
        }
    }

    // otherwise, for none-animating steps, just advance immediately when 'exiting' is set
    const didRender = (e) => {
        /** @type {import('../types').Step['id'][]} */
        const ignoredSteps = ['welcome', 'getStarted']
        const shouldSkipAnimation = ignoredSteps.includes(e?.dataset?.current)
        if (shouldSkipAnimation && exiting === true) {
            advance()
        }
    }

    return (
        <main className={styles.main}>
            <Background/>
            {debugState && <Debug state={globalState}/>}
            <div className={styles.container} data-current={activeStep} data-exiting={String(exiting)} ref={didRender} onAnimationEnd={animationDidFinish}>
                <ErrorBoundary didCatch={didCatch} fallback={<Fallback/>}>
                    {(step.id === 'welcome' || step.id === 'getStarted') &&
                        <Panel boxed={false}>
                            <Heading
                                title={step.id === 'welcome' ? t('welcome_title') : t('getStarted_highlights_title', { newline: '\n' })}
                                speechBubble={step.id !== 'welcome'}>
                                {step.id === 'getStarted' && activeStepVisible && <ElasticButton onClick={enqueueNext}>{t('getStartedButton_highlights')}</ElasticButton>}
                            </Heading>

                            {step.id === 'welcome' && <Timeout onComplete={enqueueNext} ignore={true} />}
                        </Panel> }
                    {step.id === 'duckPlayerSingle' && <DuckPlayerStep />}
                    {step.id === 'importSingle' && <ImportStep />}
                    {step.id === 'makeDefaultSingle' && <MakeDefaultStep />}
                    {step.id === 'customizeV3' && <CustomizeStep />}
                    {step.id === 'dockSingle' && <DockStep />}
                </ErrorBoundary>
                {children}
            </div>
            {(step.id === 'welcome' || step.id === 'getStarted') && <Hiker />}
        </main>
    )
}

function Debug (props) {
    const { order, step, exiting, activeStep, nextStep } = props.state
    const debugData = { order, step, exiting, activeStep, nextStep }

    return (
        <div style={{ position: 'absolute', top: 0, right: 0, overflowY: 'scroll', height: '100vh', zIndex: 10000 }}>
            <pre>
                <code>{JSON.stringify(debugData, null, 2)}</code>
            </pre>
        </div>
    )
}
