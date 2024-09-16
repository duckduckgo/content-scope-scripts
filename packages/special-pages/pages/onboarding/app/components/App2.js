// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h, Fragment } from 'preact'
import cn from 'classnames'
import { useContext, useRef } from 'preact/hooks'
import { GlobalContext, GlobalDispatch } from '../global'
import { useEnv } from '../../../../shared/components/EnvironmentProvider'
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary'
import { Fallback } from '../pages/Fallback'
import { useTypedTranslation } from '../types'
import { Timeout } from './Timeout'
import { Background } from './Background'
import { Button } from './Buttons'
import { Typed } from './Typed'
import { ComparisonTable } from './ComparisonTable'
import { Progress } from './Progress'

import styles from './App2.module.css'

/**
 * @param {object} props
 * @param {boolean} props.isSpeechBubble
 * @param {import('preact').ComponentChildren} props.children
 */
export function Heading ({ children, isSpeechBubble = false }) {
    return (
        <header className={styles.heading}>
            <div className={styles.logo}>
                <img className={styles.svg} src="assets/img/dax.svg" alt="DuckDuckGo Logo" />
            </div>
            { isSpeechBubble
                ? <SpeechBubble>{children}</SpeechBubble>
                : <div className={styles.headingContents}>{children}</div> }
        </header>
    )
}

/**
 * @param {object} props
 * @param {import('preact').ComponentChildren} props.children
 */
export function SpeechBubble ({ children }) {
    return (
        <div className={styles.speechBubble}>
            <div className={styles.speechBubbleCallout} />
            <div className={styles.speechBubbleContents}>
                {children}
            </div>
        </div>
    )
}

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

    const { nextStep, activeStep, activeStepVisible, activeTitle, exiting, order, step } = globalState

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
    const titleDone = () => dispatch({ kind: 'title-complete' })
    const nextTitle = () => dispatch({ kind: 'next-title' })
    const dismiss = () => dispatch({ kind: 'dismiss' })
    const dismissToSettings = () => dispatch({ kind: 'dismiss-to-settings' })

    const didCatch = ({ error }) => {
        const message = error?.message || 'unknown'
        dispatch({ kind: 'error-boundary', error: { message, id: activeStep } })
    }

    /** @type {Partial<Record<import('../types').Step['id'], string>>} */
    const titles = {
        welcome: t('welcome_title'),
        getStarted: t('getStarted_highlights_title', { newline: '\n' }),
        privateByDefault: t('privateByDefault_highlights_title', { newline: '\n' }),
        dockSingle: t('dock_highlights_title'),
        importSingle: t('import_highlights_title'),
        duckPlayerSingle: t('duckPlayer_highlights_title'),
        customize: t('customize_highlights_title')
    }

    /** @type {Partial<Record<import('../types').Step['id'], string>>} */
    const subtitles = {
        dockSingle: t('dock_highlights_subtitle'),
        importSingle: t('import_highlights_subtitle'),
        duckPlayerSingle: t('duckPlayer_highlights_subtitle'),
        customize: t('customize_highlights_subtitle')
    }

    // typescript is not quite smart enough to figure this part out
    const pageTitle = titles[activeStep]
    const nextPageTitle = titles[/** @type {any} */(nextStep)]
    const pageSubTitle = subtitles[activeStep] || null

    if (!pageTitle || pageTitle.length === 0) {
        console.warn('missing page title for ', activeStep)
    }

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
            <div className={styles.container} data-current={activeStep} data-exiting={String(exiting)} >
                <ErrorBoundary didCatch={didCatch} fallback={<Fallback/>}>
                    <div className={cn(styles.panel, { [styles.boxed]: step.id !== 'welcome' && step.id !== 'getStarted'})}>
                        <Heading isSpeechBubble={step.id !== 'welcome'}>
                            {pageTitle && <h1>
                                <Typed
                                    onComplete={pageSubTitle ? nextTitle : titleDone}
                                    text={pageTitle}
                                    data-current={activeStep}
                                    data-exiting={pageTitle !== nextPageTitle && String(exiting)}
                                />
                            </h1>}
                            {pageSubTitle && <h2>
                                <Typed
                                    onComplete={titleDone}
                                    text={pageSubTitle}
                                    paused={activeTitle === 0}
                                    data-current={activeStep}
                                    data-exiting={pageTitle !== nextPageTitle && String(exiting)}
                                />
                            </h2>}
                            {step.id === 'getStarted' && <Button onClick={enqueueNext}>{t('getStartedButton_highlights')}</Button>}
                        </Heading>

                        <div className={styles.content} data-current={activeStep} data-exiting={String(exiting)} ref={didRender} onAnimationEnd={animationDidFinish}>
                            <div className={styles.core}>
                                {step.id === 'welcome' && (
                                    <Timeout onComplete={enqueueNext} ignore={true} />
                                )}
                                {step.id === 'privateByDefault' && (
                                    <ComparisonTable />
                                )}
                                {step.id === 'makeDefaultSingle' && (
                                    <p>Make Default</p>
                                )}
                                {step.id === 'dockSingle' && (
                                    <p>Add to Dock / Taskbar</p>
                                )}
                                {step.id === 'importSingle' && (
                                    <p>Import</p>
                                )}
                                {step.id === 'duckPlayerSingle' && (
                                    <p>Duck Player</p>
                                )}
                                {step.id === 'customize' && (
                                    <p>Customize</p>
                                )}
                            </div>
                            {step.id !== 'welcome' && step.id !== 'getStarted' && (
                                <>
                                <div className={styles.progress}>
                                    {showProgress && <Progress current={progress.indexOf(activeStep) + 1} total={progress.length}/>}
                                </div>
                                <div className={styles.spacer}></div>
                                <div className={styles.skip}>
                                    {(step.id === 'privateByDefault' || step.id === 'dockSingle' || step.id === 'importSingle') &&
                                        <Button onClick={enqueueNext} variant='secondary'>{t('skipButton')}</Button> }
                                </div>
                                <div className={styles.accept}>
                                    {step.id === 'privateByDefault' &&
                                        <Button onClick={enqueueNext}>{t('makeDefaultButton')}</Button> }
                                    {step.id === 'dockSingle' &&
                                        <Button onClick={enqueueNext}>{t('keepInDockButton')}</Button> }
                                    {step.id === 'importSingle' &&
                                        <Button onClick={enqueueNext}>{t('importButton')}</Button> }
                                    {step.id === 'duckPlayerSingle' &&
                                        <Button onClick={enqueueNext}>{t('nextButton')}</Button> }
                                    {step.id === 'customize' &&
                                        <Button onClick={enqueueNext}>{t('startBrowsing')}</Button> }
                                </div>
                                </>
                            )}
                        </div>
                    </div>
                </ErrorBoundary>
                {children}
            </div>
            {(step.id === 'welcome' || step.id === 'getStarted') && (
                            <Hiker />
                        )}
        </main>
    )
}

function Debug (props) {
    const { order, step, exiting, activeStep, nextStep } = props.state
    const debugData = { order, step, exiting, activeStep, nextStep }

    return (
        <div style={{ position: 'absolute', top: 0, right: 0, overflowY: 'scroll', height: '100vh' }}>
            <pre>
                <code>{JSON.stringify(debugData, null, 2)}</code>
            </pre>
        </div>
    )
}
