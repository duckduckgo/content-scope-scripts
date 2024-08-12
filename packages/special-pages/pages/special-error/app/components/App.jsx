import { h } from "preact";
import { useState } from "preact/hooks";
import { useEnv } from "../../../../shared/components/EnvironmentProvider";
import { useMessaging } from "../providers/MessagingProvider";
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary'
import { ErrorFallback } from "./ErrorFallback";
import { Warning } from "./Warning";
import { AdvancedInfo } from "./AdvancedInfo";

import styles from "./App.module.css";

export function SpecialErrorView() {
    const [advancedInfoVisible, setAdvancedInfoVisible] = useState(false)

    const advancedButtonHandler = () => {
        setAdvancedInfoVisible(true)
    }

    return (
        <div className={styles.container}>
            <Warning advancedInfoVisible={advancedInfoVisible} advancedButtonHandler={advancedButtonHandler}/>
            { advancedInfoVisible && <AdvancedInfo />}
        </div>
    )
}

export function App() {
    const { messaging } = useMessaging()

    /**
     * @param {Error} error
     */
    function didCatch (error) {
        const message = error?.message || 'unknown'
        console.error('ErrorBoundary', message)
        messaging?.reportPageException({ message })
    }

    return (
        <main className={styles.main}>
            <ErrorBoundary didCatch={didCatch} fallback={<ErrorFallback />}>
                <SpecialErrorView />
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