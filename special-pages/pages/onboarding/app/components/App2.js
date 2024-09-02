// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from 'preact'
import { useContext, useRef } from 'preact/hooks'
import { GlobalContext, GlobalDispatch } from '../global'
import { useEnv } from '../../../../shared/components/EnvironmentProvider'
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary'
import { Fallback } from '../pages/Fallback'
import { useTypedTranslation } from '../types'

/**
 * @param {object} props
 * @param {import("preact").ComponentChild} props.children
 */
export function App2 ({ children }) {
    const { isReducedMotion } = useEnv()
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

    /** @type {Record<import('../types').Step['id'], string>} */
    const titles = {
        welcome: t('welcome_title'),
        getStarted: t('getStarted_title', { newline: '\n' }),
        privateByDefault: t('privateByDefault_title', { newline: '\n' }),
        cleanerBrowsing: t('cleanerBrowsing_title', { newline: '\n' }),
        systemSettings: t('systemSettings_title'),
        customize: t('customize_title'),
        summary: t('summary_title'),
        dockSingle: t('systemSettings_title'),
        importSingle: t('systemSettings_title'),
        makeDefaultSingle: t('systemSettings_title')
    }

    // typescript is not quite smart enough to figure this part out
    const pageTitle = titles[activeStep]
    const nextPageTitle = titles[/** @type {any} */(nextStep)]
    const pageSubTitle = t(/** @type {any} */(activeStep + '_subtitle'))

    if (!pageTitle || pageTitle.length === 0) {
        console.warn('missing page title for ', activeStep)
    }

    return (
        <main data-current={activeStep} data-exiting={String(exiting)}>
            <ErrorBoundary didCatch={didCatch} fallback={<Fallback/>}>
                <pre><code>{JSON.stringify({step, exiting, activeStep, nextStep}, null, 2)}</code></pre>
                <h1>{nextPageTitle}</h1>
                {pageSubTitle && <h2>{pageSubTitle}</h2>}
                {step.id==='welcome' && (
                    <p>Welcome...</p>
                )}
                {step.id==='getStarted' && (
                    <p>GetStarted...</p>
                )}
                {step.id==='cleanerBrowsing' && (
                    <p>Cleaner Browser...</p>
                )}
                {step.id==='summary' && (
                    <p>All done!</p>
                )}
                {step.id !== 'summary' && (
                    <div>
                        <button onClick={enqueueNext}>Begin Exit...</button>
                        {exiting && <button onClick={advance}>Advance to {nextStep} ➡️</button>}
                    </div>
                )}
            </ErrorBoundary>
            {children}
        </main>
    )
}
