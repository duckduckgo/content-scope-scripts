// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from 'preact'
import { useContext, useEffect, useState } from "preact/hooks"
import { MessagingContext } from '../index'
import { ErrorBoundary } from "../../../../shared/components/ErrorBoundary"
import { useEnv } from "../../../../shared/components/EnvironmentProvider"
import { ReleaseNotes } from './ReleaseNotes'
import styles from './App.module.css'

/**
 * @param {object} props
 * @param {import("preact").ComponentChild} [props.children]
 */
export function App ({ children }) {
    const { messages } = useContext(MessagingContext)
    // TODO: Replace with schema
    /** @type {ReturnType<typeof useState<import('../../../../types/release-notes').UpdateMessage>>} */
    const [state, setState] = useState()

    useEffect(() => {
        return messages?.subscribeToUpdates((releaseData) => {
            setState(releaseData)
        })
    }, [])

    /**
     * @param {Error} error
     */
    function didCatch(error) {
        const message = error?.message || 'unknown'
        console.error('ErrorBoundary', message)
        messages?.reportPageException({ message })
    }
    return (
        <ErrorBoundary didCatch={didCatch} fallback={<p>Error occurred</p>}>
            <main className={styles.main}>
                {state && <ReleaseNotes releaseData={state} />}
                <WillThrow />
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
