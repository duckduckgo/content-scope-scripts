// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h, Fragment } from 'preact'
import cn from 'classnames'
import { useContext, useEffect } from 'preact/hooks'
import { GlobalContext, GlobalDispatch } from '../global'
import { useEnv } from '../../../../shared/components/EnvironmentProvider'
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary'
import { Fallback } from '../pages/Fallback'
import { useTypedTranslation } from '../types'
import { Timeout } from './Timeout'
import { Background } from './Background'
import { Button } from './Buttons'
import { ComparisonTable } from './ComparisonTable'
import { PlainList } from './List'
import { ListItem } from './ListItem'
import { SingleLineProgress } from './Progress'
import { Heading } from './Heading'
import { BounceIn, Check, Launch, Replay } from './Icons'
import { SettingsStep } from '../pages/v3/SettingsStep'
import { settingsRowItemsV3 as settingsRowItems, stepMeta } from '../data'

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
 *
 * @param {object} props
 * @param {'before'|'after'} props.state
 * @param {boolean} props.isDarkMode
 */
export function DuckPlayerStep ({ state, isDarkMode }) {
    const dispatch = useContext(GlobalDispatch)

    useEffect(() => {
        setTimeout(() => {
            dispatch({ kind: 'toggle-before-after' })
        }, 500)
    }, [])

    return (
        <div style={{ display: 'inline-block', width: '432px', height: '208px' }}>
            <RiveAnimation
                animation={onboardingAnimation}
                state={state}
                isDarkMode={isDarkMode}
                artboard='Duck Player'
                inputName='Duck Player?'
                stateMachine='State Machine 2'
            />
        </div>
    )
}

/**
 * @param {object} props
 * @param {import("preact").ComponentChild} props.children
 */
export function App2 ({ children }) {
    const { debugState, isReducedMotion, isDarkMode, injectName: platform } = useEnv()
    const globalState = useContext(GlobalContext)
    const dispatch = useContext(GlobalDispatch)
    const { t } = useTypedTranslation()

    const { activeStep, activeStepVisible, exiting, order, step, UIValues, beforeAfter, activeRow } = globalState

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
    // const dismissToSettings = () => dispatch({ kind: 'dismiss-to-settings' })

    const didCatch = ({ error }) => {
        const message = error?.message || 'unknown'
        dispatch({ kind: 'error-boundary', error: { message, id: activeStep } })
    }

    /**
     * @typedef {object} StepConfig
     * @property {string} title
     * @property {string|null} [subtitle]
     * @property {h.JSX.Element|null} content
     * @property {boolean} [showControls]
     * @property {string|null} [skipButtonText]
     * @property {() => void|null} [skipHandler]
     * @property {string|null} [advanceButtonText]
     * @property {() => void|null} [advanceHandler]
     */

    /** @type {Partial<Record<import('../types').Step['id'], () => StepConfig>>} */
    const stepsConfig = {
        welcome: () => ({
            title: t('welcome_title'),
            content: null
        }),
        getStarted: () => ({
            title: t('getStarted_highlights_title', { newline: '\n' }),
            content: null
        }),
        makeDefaultV3: () => {
            const settingIsIdle = UIValues['default-browser'] === 'idle'

            return {
                title: settingIsIdle ? t('protectionsActivated') : t('makeDefaultSuccess'),
                showControls: true,
                skipButtonText: settingIsIdle ? t('skipButton') : null,
                advanceButtonText: settingIsIdle ? t('makeDefaultButton') : t('nextButton'),
                advanceHandler: () => {
                    if (settingIsIdle) {
                        dispatch({
                            kind: 'update-system-value',
                            id: 'default-browser',
                            payload: { enabled: true },
                            current: true
                        })
                    } else {
                        enqueueNext()
                    }
                },
                skipHandler: () => {
                    enqueueNext()
                },
                content: <ComparisonTable />
            }
        },
        dockSingle: () => {
            const settingIsIdle = UIValues.dock === 'idle'
            const pageStrings = platform === 'windows'
                ? {
                    idleTitle: t('stickAroundTaskbarTitle'),
                    acceptTitle: t('taskbarAcceptTitle', { newline: '\n' }),
                    idleButtonText: t('nextButton'),
                    acceptButtonText: t('nextButton')
                }
                : {
                    idleTitle: t('stickAroundDockTitle'),
                    acceptTitle: t('dockAcceptTitle', { newline: '\n' }),
                    idleButtonText: t('keepInDockButton'),
                    acceptButtonText: t('nextButton')
                }

            return {
                title: settingIsIdle ? pageStrings.idleTitle : pageStrings.acceptTitle,
                subtitle: settingIsIdle ? t('dockSubtitle') : null,
                showControls: true,
                skipButtonText: platform !== 'windows' && settingIsIdle ? t('skipButton') : null,
                advanceButtonText: settingIsIdle ? pageStrings.idleButtonText : pageStrings.acceptButtonText,
                advanceHandler: () => {
                    if (settingIsIdle) {
                        dispatch({
                            kind: 'update-system-value',
                            id: 'dock',
                            payload: { enabled: true },
                            current: true
                        })
                    } else {
                        enqueueNext()
                    }
                },
                skipHandler: () => {
                    enqueueNext()
                },
                content: <RiveAnimation animation={pinningAnimation} state="before" isDarkMode={isDarkMode}/>
            }
        },
        importSingle: () => {
            const settingIsIdle = UIValues.import === 'idle'

            return {
                title: t('import_highlights_title'),
                subtitle: t('import_highlights_subtitle'),
                showControls: true,
                skipButtonText: settingIsIdle ? t('skipButton') : null,
                advanceButtonText: settingIsIdle ? t('importButton') : t('nextButton'),
                advanceHandler: () => {
                    if (settingIsIdle) {
                        dispatch({
                            kind: 'update-system-value',
                            id: 'import',
                            payload: { enabled: true },
                            current: true
                        })
                    } else {
                        enqueueNext()
                    }
                },
                skipHandler: () => {
                    enqueueNext()
                },
                content: <PlainList>
                    <ListItem icon={'v3/bookmarks.svg'} title={t('bookmarksAndFavorites')} secondaryText={t('bookmarksAndFavorites_description')} inline={settingIsIdle ? null : <BounceIn><Check/></BounceIn>}/>
                    <ListItem icon={'v3/key.svg'} title={t('passwords')} secondaryText={t('passwords_description')} inline={settingIsIdle ? null : <BounceIn><Check/></BounceIn>} />
                </PlainList>
            }
        },
        duckPlayerV3: () => ({
            title: t('duckPlayer_highlights_title'),
            subtitle: t('duckPlayer_highlights_subtitle'),
            showControls: true,
            advanceButtonText: t('nextButton'),
            advanceHandler: enqueueNext,
            skipButtonText: beforeAfter === 'before' ? t('beforeAfter_duckPlayer_show') : t('beforeAfter_duckPlayer_hide'),
            skipHandler: () => {
                dispatch({ kind: 'toggle-before-after' })
            },
            content: <DuckPlayerStep isDarkMode={isDarkMode} state={beforeAfter} />
        }),
        customizeV3: () => ({
            title: t('customize_highlights_title'),
            subtitle: t('customize_highlights_subtitle'),
            showControls: true,
            content: <SettingsStep
                key={activeStep}
                data={settingsRowItems}
                metaData={stepMeta}
            />
        })
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

    const stepConfig = stepsConfig[step.id]
    if (!stepConfig) {
        console.warn(`Missing step config for ${step.id}`)
        return null
    }

    const { title, subtitle, showControls, advanceButtonText, advanceHandler, skipButtonText, skipHandler, content } = stepConfig()

    return (
        <main className={styles.main}>
            <Background/>
            {debugState && <Debug state={globalState}/>}
            <div className={styles.container} data-current={activeStep} data-exiting={String(exiting)} ref={didRender} onAnimationEnd={animationDidFinish}>
                <ErrorBoundary didCatch={didCatch} fallback={<Fallback/>}>
                    <div className={cn(styles.panel, { [styles.boxed]: step.id !== 'welcome' && step.id !== 'getStarted' })}>
                        <Heading
                            title={title}
                            subtitle={subtitle}
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
                                            {skipButtonText && <Button size="large" onClick={skipHandler || enqueueNext} variant='secondary'>
                                                {step.id === 'duckPlayerV3' && <Replay />}
                                                {skipButtonText}
                                            </Button>}
                                        </div>

                                        <div className={styles.accept}>
                                            {advanceButtonText && <Button size="large" onClick={advanceHandler || enqueueNext}>{advanceButtonText}</Button>}
                                            {step.id === 'customizeV3' && activeRow >= step.rows.length && <Button onClick={dismiss} size={'large'}>{t('startBrowsing')}
                                                <Launch/>
                                            </Button>}
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
