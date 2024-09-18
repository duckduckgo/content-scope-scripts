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
import { PlainList } from './List'
import { ListItem } from './ListItem'
import { SingleLineProgress } from './Progress'
import { Heading } from './Heading'

import pinningAnimation from '../animations/taskbar_pinning.riv'
import onboardingAnimation from '../animations/Onboarding.riv'

import styles from './App2.module.css'
import { RiveAnimation } from './RiveAnimation'

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

    const { nextStep, activeStep, activeStepVisible, exiting, order, step } = globalState

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

    const stepsConfig = {
        welcome: () => ({
            content: null
        }),
        getStarted: () => ({
            content: null
        }),
        privateByDefault: () => ({
            showControls: true,
            skipButtonText: t('skipButton'),
            advanceButtonText: t('makeDefaultButton'),
            content: <ComparisonTable />
        }),
        dockSingle: () => ({
            showControls: true,
            skipButtonText: t('skipButton'),
            advanceButtonText: t('keepInDockButton'),
            content: <RiveAnimation animation={pinningAnimation} state="before" isDarkMode={isDarkMode}/>
        }),
        importSingle: () => ({
            showControls: true,
            skipButtonText: t('skipButton'),
            advanceButtonText: t('importButton'),
            content: <PlainList>
                <ListItem icon={'v3/bookmarks.svg'} title={t('bookmarksAndFavorites')} secondaryText={t('bookmarksAndFavorites_description')} />
                <ListItem icon={'v3/key.svg'} title={t('passwords')} secondaryText={t('passwords_description')} />
            </PlainList>
        }),
        duckPlayerSingle: () => ({
            showControls: true,
            advanceButtonText: t('nextButton'),
            content: <div style={{ display: 'inline-block', width: '432px', height: '208px' }}>
                <RiveAnimation
                        animation={onboardingAnimation}
                        state={'before'}
                        isDarkMode={isDarkMode}
                        artboard='Duck Player'
                        inputName='Duck Player?'
                        stateMachine='State Machine 2'
                    />
            </div>
        }),
        customize: () => ({
            showControls: true,
            advanceButtonText: t('startBrowsing'),
            content: <PlainList variant='bordered'>
                <ListItem icon={'v3/favorite.svg'} title={t('bookmarksBar')}/>
                <ListItem icon={'v3/session-restore.svg'} title={t('restoreSession')}/>
                <ListItem icon={'v3/home.svg'} title={t('addHomeShortcut')}/>
            </PlainList>
        })
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
    const pageSubTitle = subtitles[activeStep]

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

    const { showControls, advanceButtonText, skipButtonText, content } = stepsConfig[step.id]()

    return (
        <main className={styles.main}>
            <Background/>
            {debugState && <Debug state={globalState}/>}
            <div className={styles.container} data-current={activeStep} data-exiting={String(exiting)} ref={didRender} onAnimationEnd={animationDidFinish}>
                <ErrorBoundary didCatch={didCatch} fallback={<Fallback/>}>
                    <div className={cn(styles.panel, { [styles.boxed]: step.id !== 'welcome' && step.id !== 'getStarted' })}>
                        <Heading
                            title={pageTitle}
                            subtitle={pageSubTitle}
                            hideSubtitle={!activeStepVisible}
                            speechBubble={step.id !== 'welcome'}
                            onComplete={titleDone}>
                                {step.id === 'getStarted' && activeStepVisible && <Button size="large" onClick={enqueueNext}>{t('getStartedButton_highlights')}</Button>}
                        </Heading>

                        {step.id === 'welcome' && <Timeout onComplete={enqueueNext} ignore={true} />}

                        {content &&
                            <div className={styles.contentGrid} >
                                <div className={styles.content}>
                                    {content}
                                </div>
                            {showControls && (
                                <>
                                    <div className={styles.progress}>
                                        {showProgress && <SingleLineProgress current={progress.indexOf(activeStep) + 1} total={progress.length} />}
                                    </div>

                                    <div className={styles.spacer}></div>

                                    <div className={styles.skip}>
                                        {skipButtonText && <Button size="large" onClick={enqueueNext} variant='secondary'>{skipButtonText}</Button>}
                                    </div>

                                    <div className={styles.accept}>
                                        {advanceButtonText && <Button size="large" onClick={enqueueNext}>{advanceButtonText}</Button>}
                                    </div>
                                </>
                            )}
                            </div>}
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
