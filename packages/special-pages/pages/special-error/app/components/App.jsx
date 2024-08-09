import { h } from "preact";
import { usePlatformName } from "../providers/ErrorDataProvider";
import { useEnv } from "../../../../shared/components/EnvironmentProvider";
import { useMessaging } from "../providers/MessagingProvider";
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary'
import { ErrorFallback } from "./ErrorFallback";
import { Warning } from "./Warning";
import { AdvancedInfo } from "./AdvancedInfo";
import { useAdvancedInfo } from "../providers/UIProvider";

import styles from "./App.module.css";

export function SpecialError() {
    const { showAdvancedInfo } = useAdvancedInfo()

    return (
        <div className={styles.container}>
            <Warning />
            { showAdvancedInfo && <AdvancedInfo />}
        </div>
    )
}

export function App() {
    const { messaging } = useMessaging()
    const { platformName } = usePlatformName()

    /**
     * @param {Error} error
     */
    function didCatch (error) {
        const message = error?.message || 'unknown'
        console.error('ErrorBoundary', message)
        messaging?.reportPageException({ message })
    }

    return (
        <main className={styles.main} data-platform-name={platformName}>
            <ErrorBoundary didCatch={didCatch} fallback={<ErrorFallback />}>
                <SpecialError />
                <WillThrow/>
            </ErrorBoundary>
        </main>
    )
}

export function WillThrow () {
    const env = useEnv()
    if (env.willThrow) {
        throw new Error('Simulated Exception')
    }
    return null
}