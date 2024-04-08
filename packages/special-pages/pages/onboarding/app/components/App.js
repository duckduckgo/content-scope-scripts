// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from 'preact'
import { useContext, useRef } from 'preact/hooks'
import styles from './App.module.css'
import { Summary } from '../pages/Summary'
import { GlobalContext, GlobalDispatch } from '../global'
import { Background } from './Background'
import { GetStarted } from '../pages/Welcome'
import { PrivacyDefault } from '../pages/PrivacyDefault'
import { CleanBrowsing } from '../pages/CleanBrowsing'
import { SettingsStep } from '../pages/SettingsStep'
import { settingsRowItems } from '../data'
import { useTranslation } from '../translations'
import { SettingsContext } from '../settings'
import { Header } from './Header'
import { Typed } from './Typed'
import { Stack } from './Stack'
import { Timeout } from './Timeout'
import { Content } from './Content'
import { ErrorBoundary } from '../ErrorBoundary'
import { Fallback } from '../pages/Fallback'
import { Progress } from './Progress'

/**
 * App is the main component of the application.
 */
export function App () {
    const { debugState } = useContext(SettingsContext)
    const globalState = useContext(GlobalContext)
    const dispatch = useContext(GlobalDispatch)
    const { t } = useTranslation()

    const { activeStep, activeStepVisible, exiting } = globalState

    // events
    const enqueueNext = () => dispatch({ kind: 'next' })
    const next = () => dispatch({ kind: 'next-for-real' })
    const titleDone = () => dispatch({ kind: 'title-complete' })
    const dismiss = () => dispatch({ kind: 'dismiss' })
    const dismissToSettings = () => dispatch({ kind: 'dismiss-to-settings' })

    const didCatch = ({ error }) => {
        const message = error?.message || 'unknown'
        dispatch({ kind: 'error-boundary', error: { message, id: activeStep } })
    }

    // typescript is not quite smart enough to figure this part out
    const pageTitle = t(/** @type {any} */(activeStep + '_title'))
    const pageSubTitle = t(/** @type {any} */(activeStep + '_subtitle'))

    /** @type {Record<import('../types').Step['id'], () => import("preact").ComponentChild>} */
    const pages = {
        welcome: () => <Timeout onComplete={enqueueNext} ignore={true} />,
        getStarted: () => <GetStarted onNextPage={enqueueNext} />,
        privateByDefault: () => <PrivacyDefault onNextPage={enqueueNext} />,
        cleanerBrowsing: () => <CleanBrowsing onNextPage={enqueueNext} />,
        systemSettings: () => (
            <SettingsStep
                key={'systemSettings'}
                subtitle={pageSubTitle}
                data={settingsRowItems}
                onNextPage={enqueueNext}
            />
        ),
        customize: () => (
            <SettingsStep
                key={'customize'}
                subtitle={pageSubTitle}
                data={settingsRowItems}
                onNextPage={enqueueNext}
            />
        ),
        summary: () => (
            <Summary
                values={globalState.values}
                onDismiss={dismiss}
                onSettings={dismissToSettings}
            />
        )
    }

    /** @type {import('../types').Step['id'][]} */
    const progress = ['privateByDefault', 'cleanerBrowsing', 'systemSettings', 'customize']
    const showProgress = progress.includes(activeStep)

    return (
        <main className={styles.main}>
            <Background />
            <SkipLink onClick={dismiss} />
            {debugState && <Debug state={globalState} />}
            <div className={styles.container} data-current={activeStep}>
                <ErrorBoundary didCatch={didCatch} fallback={<Fallback />}>
                    {/* This is used to allow an 'exit' animation to take place */}
                    {exiting && <Timeout onComplete={next} timeout={['welcome', 'getStarted'].includes(activeStep) ? 0 : 600} />}
                    <Stack>
                        <Header aside={showProgress && <Progress current={progress.indexOf(activeStep) + 1} total={progress.length} />}>
                            <Typed
                                onComplete={titleDone}
                                text={pageTitle}
                                data-current={activeStep}
                                data-exiting={String(exiting)}
                            />
                        </Header>
                        <div data-current={activeStep} data-exiting={String(exiting)}>
                            {activeStepVisible && (
                                <Content>
                                    {pages[activeStep]()}
                                </Content>
                            )}
                        </div>
                    </Stack>
                    <WillThrow />
                </ErrorBoundary>
            </div>
            {debugState && <DebugLinks current={activeStep} />}
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
    if (window.__playwright_01) return null
    return (
        <div style={{ display: 'flex', gap: '10px', position: 'fixed', bottom: '1rem', justifyContent: 'center', width: '100%' }}>
            {Object.keys(globalState.stepDefinitions).slice(1).map(pageId => {
                return (
                    <a href={`?page=${pageId}`} key={pageId} style={{
                        textDecoration: current === pageId ? 'none' : 'underline',
                        color: current === pageId ? 'black' : undefined
                    }}>{pageId}</a>
                )
            })}
            <a href={'?page=welcome&willThrow=true'}>Exception</a>
        </div>
    )
}

function WillThrow () {
    if (useContext(SettingsContext).willThrow) {
        throw new Error('Simulated Exception')
    }
    return null
}

export function SkipLink ({ onClick }) {
    const count = useRef(0)

    const handler = () => {
        count.current = count.current + 1
        if (count.current >= 5) {
            onClick()
        }
    }

    return (
        <div style="position: fixed; bottom: 0; left: 0; width: 50px; height: 50px" onClick={handler} data-testid="skip" />
    )
}
