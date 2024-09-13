// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from 'preact'
import { useContext, useRef } from 'preact/hooks'
import { GlobalContext, GlobalDispatch } from '../global'
import { useEnv } from '../../../../shared/components/EnvironmentProvider'
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary'
import { Fallback } from '../pages/Fallback'
import { useTypedTranslation } from '../types'
import { Timeout } from './Timeout'
import { Background } from './Background'
import { Button } from './Buttons'

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

/**
 * @param {object} props
 * @param {import("preact").ComponentChild} props.children
 */
export function App2 ({ children }) {
    const { debugState, isReducedMotion } = useEnv()
    const globalState = useContext(GlobalContext)
    const dispatch = useContext(GlobalDispatch)
    const { t } = useTypedTranslation()

    const { nextStep, activeStep, activeStepVisible, exiting, order, step } = globalState

    const enqueueNext = () => {
        if (isReducedMotion) {
            dispatch({ kind: 'advance' })
        } else {
            dispatch({ kind: 'enqueue-next' })
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

    /** @type {Partial<Record<import('../types').Step['id'], string>>} */
    const titles = {
        welcome: t('welcome_title'),
        getStarted: t('getStarted_highlights_title', { newline: '\n' }),
        privateByDefault: t('privateByDefault_highlights_title', { newline: '\n' }),
        makeDefaultSingle: t('makeDefault_highlights_title'),
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
                    <div className={styles.content}>
                        <Heading isSpeechBubble={step.id !== 'welcome'}>
                            <h1>{pageTitle}</h1>
                            {pageSubTitle && <h2>{pageSubTitle}</h2>}
                            {step.id === 'getStarted' && <Button onClick={enqueueNext}>{t('getStartedButton_highlights')}</Button>}
                        </Heading>
                        <div data-current={activeStep} data-exiting={String(exiting)} ref={didRender} onAnimationEnd={animationDidFinish}>
                            {step.id === 'welcome' && (
                                <Timeout onComplete={enqueueNext} ignore={true} />
                            )}
                            {step.id === 'getStarted' && (
                                <p>Get Started</p>
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
                            {step.id !== 'welcome' && (
                                <div>
                                    <button onClick={enqueueNext}>Begin Exit...</button>
                                    {exiting && <button onClick={advance}>Advance to {nextStep} ➡️</button>}
                                </div>
                            )}
                        </div>
                    </div>
                </ErrorBoundary>
                {children}
            </div>
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
