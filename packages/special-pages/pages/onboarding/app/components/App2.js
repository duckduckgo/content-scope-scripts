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
import { PlainList } from './List'
import { ListItem } from './ListItem'
import pinningAnimation from '../animations/taskbar_pinning.riv'
import onboardingAnimation from '../animations/Onboarding.riv'

import styles from './App2.module.css'
import { RiveAnimation } from './RiveAnimation'
import { BeforeAfter } from './BeforeAfter'

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
    const { debugState, isReducedMotion, isDarkMode } = useEnv()
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
                            {pageTitle && <h1 className={styles.title}>
                                <Typed
                                    onComplete={titleDone}
                                    text={pageTitle}
                                    data-current={activeStep}
                                    data-exiting={pageTitle !== nextPageTitle && String(exiting)}
                                />
                            </h1>}
                            {pageSubTitle && <h2 className={cn({
                                    [styles.subTitle]: true,
                                    [styles.hidden]: !activeStepVisible,
                                })}>{pageSubTitle}</h2>}
                            {step.id === 'getStarted' && activeStepVisible && <Button size="large" onClick={enqueueNext}>{t('getStartedButton_highlights')}</Button>}
                        </Heading>

                        <div className={styles.content} data-current={activeStep} data-exiting={String(exiting)} ref={didRender} onAnimationEnd={animationDidFinish}>
                            <div className={styles.core}>
                                {step.id === 'welcome' && (
                                    <Timeout onComplete={enqueueNext} ignore={true} />
                                )}
                                {step.id === 'privateByDefault' && (
                                    <ComparisonTable />
                                )}
                                {step.id === 'dockSingle' && (
                                    <RiveAnimation animation={pinningAnimation} state="before" isDarkMode={isDarkMode}/>
                                )}
                                {step.id === 'importSingle' && (
                                    <PlainList>
                                        <ListItem icon={'v3/bookmarks.svg'} title={t('bookmarksAndFavorites')} secondaryText={t('bookmarksAndFavorites_description')} />
                                        <ListItem icon={'v3/key.svg'} title={t('passwords')} secondaryText={t('passwords_description')} />
                                    </PlainList>
                                )}
                                {step.id === 'duckPlayerSingle' && (
                                    <div style={{ display: 'inline-block', width: '432px', height: '208px'}}>
                                        <BeforeAfter
                                            onDone={() => {}}
                                            btnBefore={t('beforeAfter_duckPlayer_show')}
                                            btnAfter={t('beforeAfter_duckPlayer_hide')}
                                            media={({ state }) => {
                                                const animationState = (state === 'initial' || state === 'before') ? 'before' : 'after'
                                                return <RiveAnimation
                                                    animation={onboardingAnimation}
                                                    state={animationState}
                                                    isDarkMode={isDarkMode}
                                                    artboard='Duck Player'
                                                    inputName='Duck Player?'
                                                    stateMachine='State Machine 2'
                                                />}}
                                            />
                                    </div>
                                )}
                                {step.id === 'customize' && (
                                    <PlainList variant='bordered'>
                                        <ListItem icon={'v3/favorite.svg'} title={t('bookmarksBar')}/>
                                        <ListItem icon={'v3/session-restore.svg'} title={t('restoreSession')}/>
                                        <ListItem icon={'v3/home.svg'} title={t('addHomeShortcut')}/>
                                    </PlainList>
                                )}
                            </div>
                            {step.id !== 'welcome' && step.id !== 'getStarted' && (
                                <>
                                <div className={styles.progress}>
                                    {showProgress && <Progress current={progress.indexOf(activeStep) + 1} total={progress.length} variant='single-line'/>}
                                </div>
                                <div className={styles.spacer}></div>
                                <div className={styles.skip}>
                                    {(step.id === 'privateByDefault' || step.id === 'dockSingle' || step.id === 'importSingle') &&
                                        <Button size="large" onClick={enqueueNext} variant='secondary'>{t('skipButton')}</Button> }
                                </div>
                                <div className={styles.accept}>
                                    {step.id === 'privateByDefault' &&
                                        <Button size="large" onClick={enqueueNext}>{t('makeDefaultButton')}</Button> }
                                    {step.id === 'dockSingle' &&
                                        <Button size="large" onClick={enqueueNext}>{t('keepInDockButton')}</Button> }
                                    {step.id === 'importSingle' &&
                                        <Button size="large" onClick={enqueueNext}>{t('importButton')}</Button> }
                                    {step.id === 'duckPlayerSingle' &&
                                        <Button size="large" onClick={enqueueNext}>{t('nextButton')}</Button> }
                                    {step.id === 'customize' &&
                                        <Button size="large" onClick={enqueueNext}>{t('startBrowsing')}</Button> }
                                </div>
                                </>
                            )}
                        </div>
                    </div>
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
