// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from 'preact'
import { useContext } from 'preact/hooks'
import styles from './App.module.css'
import { Summary } from '../pages/Summary'
import { useAutoAnimate } from '@formkit/auto-animate/preact'
import { GlobalContext, GlobalDispatch } from '../global'
import { Background } from './Background'
import { WeCanHelp, Welcome } from '../pages/Welcome'
import { PrivacyDefault } from '../pages/PrivacyDefault'
import { CleanBrowsing } from '../pages/CleanBrowsing'
import { Settings } from '../pages/Settings'
import { settingsRowItems } from '../row-data'
import { useTranslation } from '../translations'
import { ErrorBoundary } from '../ErrorBoundary'
import { Fallback } from '../pages/Fallback'

/**
 * App is the main component of the application.
 */
export function App () {
    const state = useContext(GlobalContext)
    const dispatch = useContext(GlobalDispatch)
    const page = state.activePage
    const next = () => dispatch({ kind: 'next' })
    const dismiss = () => dispatch({ kind: 'dismiss' })
    const dismissToSettings = () => dispatch({ kind: 'dismiss-to-settings' })
    const didCatch = ({ error }) => {
        const message = error?.message || 'unknown'
        dispatch({ kind: 'error-boundary', error: { message, page } })
    }

    const { t } = useTranslation()

    // typescript is not quite smart enough to figure this part out
    const pageTitle = t(/** @type {any} */(page + '_title'))

    // animation
    const [pageParent] = useAutoAnimate()

    /** @type {Record<import('../types').Step['id'], () => import("preact").ComponentChild>} */
    const pages = {
        welcome: () => <Welcome title={pageTitle} onNextPage={next}/>,
        we_can_help: () => <WeCanHelp title={pageTitle} onNextPage={next} />,
        private_by_default: () => <PrivacyDefault title={pageTitle} stepNumber={1} onNextPage={next} />,
        cleaner_browsing: () => <CleanBrowsing title={pageTitle} stepNumber={2} onNextPage={next} />,
        system_settings: () => <Settings key={'system_settings'} title={pageTitle} stepNumber={3} data={settingsRowItems} onNextPage={next} />,
        customize: () => <Settings key={'customize'} title={pageTitle} stepNumber={4} data={settingsRowItems} onNextPage={next} />,
        summary: () => <Summary
            title={pageTitle}
            values={state.values}
            onDismiss={dismiss}
            onSettings={dismissToSettings}
        />
    }

    return (
        <main className={styles.main}>
            <Background />
            <div className={styles.container} ref={pageParent} data-current={page}>
                <ErrorBoundary didCatch={didCatch} fallback={<Fallback />}>
                    {pages[page]()}
                </ErrorBoundary>
            </div>
        </main>
    )
}
