// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from 'preact'
import { useContext, useRef } from 'preact/hooks'
import styles from './App.module.css'
import { Summary } from '../pages/Summary'
import { GlobalContext, GlobalDispatch } from '../global'
import { Background } from './Background'
import { GetStarted } from '../pages/Welcome'
import { PrivacyDefault } from '../pages/PrivacyDefault'
import { CleanBrowsing, animation } from '../pages/CleanBrowsing'
import { SettingsStep } from '../pages/SettingsStep'
import { settingsRowItems, stepMeta } from '../data'
import { useTranslation } from '../translations'
import { useEnv } from '../environment'
import { Header } from './Header'
import { Typed } from './Typed'
import { Stack } from './Stack'
import { Timeout } from './Timeout'
import { Content } from './Content'
import { ErrorBoundary } from '../ErrorBoundary'
import { Fallback } from '../pages/Fallback'
import { Progress } from './Progress'

/**
 * @param {object} props
 * @param {import("preact").ComponentChild} props.children
 */
export function App ({ children }) {
    const { debugState, isReducedMotion } = useEnv()
    const globalState = useContext(GlobalContext)
    const dispatch = useContext(GlobalDispatch)
    const { t } = useTranslation()

    const { nextStep, activeStep, activeStepVisible, exiting, order, step } = globalState

    const enqueueNext = () => {
        if (isReducedMotion) {
            dispatch({ kind: 'advance' })
        } else {
            dispatch({ kind: 'enqueue-next' });
        }
    }

    const advance = () => dispatch({ kind: 'advance' })
    const titleDone = () => dispatch({ kind: 'title-complete' })
    const dismiss = () => dispatch({ kind: 'dismiss' })
    const dismissToSettings = () => dispatch({ kind: 'dismiss-to-settings' })

    const didCatch = ({ error }) => {
        const message = error?.message || 'unknown'
        dispatch({ kind: 'error-boundary', error: { message, id: activeStep } })
    }

    // typescript is not quite smart enough to figure this part out
    const pageTitle = t(/** @type {any} */(activeStep + '_title'))
    const nextPageTitle = t(/** @type {any} */(nextStep + '_title'))
    const pageSubTitle = t(/** @type {any} */(activeStep + '_subtitle'))

    const infoPages = {
        welcome: () => <Timeout onComplete={enqueueNext} ignore={true} />,
        getStarted: () => <GetStarted onNextPage={enqueueNext} />,
        privateByDefault: () => <PrivacyDefault onNextPage={enqueueNext} />,
        cleanerBrowsing: () => <CleanBrowsing onNextPage={enqueueNext} />,
        summary: () => (
            <Summary
                values={globalState.values}
                onDismiss={dismiss}
                onSettings={dismissToSettings}
            />
        )
    }

    /** @type {import('../types').Step['id'][]} */
    const progress = order.slice(2, -1)
    const showProgress = progress.includes(activeStep)

    function animationDidFinish (e) {
        if (e.target?.dataset?.exiting === 'true') {
            advance()
        }
    }

    return (
        <main className={styles.main}>
            <link rel="preload" href={['js', animation].join('/')} as="image"/>
            <link rel="preload" href={['js', stepMeta.dockSingle.rows.dock.path].join('/')} as="image"/>
            <link rel="preload" href={['js', stepMeta.importSingle.rows.import.path].join('/')} as="image"/>
            <link rel="preload" href={['js', stepMeta.makeDefaultSingle.rows['default-browser'].path].join('/')} as="image"/>
            <Background/>
            {debugState && <Debug state={globalState}/>}
            <div className={styles.container} data-current={activeStep}>
                <ErrorBoundary didCatch={didCatch} fallback={<Fallback/>}>
                    <Stack>
                        <Header aside={showProgress && <Progress current={progress.indexOf(activeStep) + 1} total={progress.length}/>}>
                            <Typed
                                onComplete={titleDone}
                                text={pageTitle}
                                data-current={activeStep}
                                data-exiting={pageTitle !== nextPageTitle && String(exiting)}
                            />
                        </Header>
                        <div data-current={activeStep} data-exiting={String(exiting)} onAnimationEnd={animationDidFinish}>
                            {activeStepVisible && (
                                <Content>
                                    {step.kind === 'settings' && (
                                        <SettingsStep
                                            key={activeStep}
                                            subtitle={pageSubTitle}
                                            data={settingsRowItems}
                                            metaData={stepMeta}
                                            onNextPage={enqueueNext}
                                        />
                                    )}
                                    {step.kind === 'info' && infoPages[activeStep]()}
                                </Content>
                            )}
                        </div>
                    </Stack>
                    <WillThrow/>
                </ErrorBoundary>
            </div>
            {debugState && <DebugLinks current={activeStep}/>}
            {children}
        </main>
    )
}

function Debug (props) {
    return (
        <div style={{ position: 'absolute', top: 0, right: 0, overflowY: 'scroll', height: '100vh' }}>
            <pre>
                <code>{JSON.stringify(props, null, 2)}</code>
            </pre>
        </div>
    )
}

function DebugLinks ({ current }) {
    const globalState = useContext(GlobalContext)

    const exceptionUrl = new URL(window.location.href)
    exceptionUrl.searchParams.set('page', 'welcome')
    exceptionUrl.searchParams.set('willThrow', 'true')

    if (window.__playwright_01) return null
    return (
        <div style={{ display: 'flex', gap: '10px', position: 'fixed', bottom: '1rem', justifyContent: 'center', width: '100%' }}>
            {Object.keys(globalState.stepDefinitions).slice(1).map(pageId => {
                const next = new URL(window.location.href)
                next.searchParams.set('page', pageId)
                return (
                    <a href={next.toString()} key={pageId} style={{
                        textDecoration: current === pageId ? 'none' : 'underline',
                        color: current === pageId ? 'black' : undefined
                    }}>{pageId}</a>
                )
            })}
            <a href={exceptionUrl.toString()}>Exception</a>
        </div>
    )
}

function WillThrow () {
    const { willThrow } = useEnv()
    if (willThrow) {
        throw new Error('Simulated Exception')
    }
    return null
}

export function SkipLink () {
    const dispatch = useContext(GlobalDispatch)
    const count = useRef(0)

    const handler = () => {
        count.current = count.current + 1
        if (count.current >= 5) {
            dispatch({ kind: 'dismiss' })
        }
    }

    return (
        <div style="position: fixed; bottom: 0; left: 0; width: 50px; height: 50px" onClick={handler} data-testid="skip" />
    )
}
