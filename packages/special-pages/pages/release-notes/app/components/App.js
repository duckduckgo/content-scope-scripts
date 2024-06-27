// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { useMessaging } from '../index'
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary'
import { useEnv } from '../../../../shared/components/EnvironmentProvider'
import { Fallback } from '../../../onboarding/app/pages/Fallback'
import { DuckDuckGoLogo } from '../../../../shared/components/DuckDuckGoLogo/DuckDuckGoLogo'
import { ReleaseNotes } from './ReleaseNotes'
import styles from './App.module.css'

/**
 * @typedef {import('../../../../types/release-notes').UpdateMessage} UpdateMessage
 */

/**
 * @param {object} props
 * @param {import("preact").ComponentChild} [props.children]
 */
export function App ({ children }) {
    const { messages } = useMessaging()
    /** @type {ReturnType<typeof useState<UpdateMessage>>} */
    const [releaseData, setReleaseData] = useState()

    useEffect(() => {
        return messages?.subscribeToUpdates((data) => {
            setReleaseData(data)
        })
    }, [])

    /**
     * @param {Error} error
     */
    function didCatch (error) {
        const message = error?.message || 'unknown'
        console.error('ErrorBoundary', message)
        messages?.reportPageException({ message })
    }
    return (
        <ErrorBoundary didCatch={didCatch} fallback={<Fallback/>}>
            <main className={styles.main}>
                <header className={styles.header}>
                    <DuckDuckGoLogo />
                </header>
                <div class={styles.core}>
                    {releaseData && <ReleaseNotes releaseData={releaseData}/>}
                </div>
                <WillThrow/>
            </main>
            {children}
        </ErrorBoundary>
    )
}

export function WillThrow () {
    const env = useEnv()
    if (env.willThrow) {
        throw new Error('Simulated Exception')
    }
    return null
}
