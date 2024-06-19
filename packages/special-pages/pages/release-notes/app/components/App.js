// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from 'preact'
import styles from './App.module.css'
import { ErrorBoundary } from "../../../../shared/components/ErrorBoundary";
import { useEnv } from "../../../../shared/components/EnvironmentProvider";
import { useTranslation } from "../../../../shared/components/TranslationProvider";
import { MessagingContext } from '../index';
import { useContext, useEffect, useState } from "preact/hooks";

/**
 * @param {object} props
 * @param {import("preact").ComponentChild} [props.children]
 */
export function App ({ children }) {
    const { t } = useTranslation();
    const { messages} = useContext(MessagingContext);
    // TODO: Replace with schema
    /** @type {ReturnType<typeof useState<import('../../../../types/release-notes').UpdateMessage>>} */
    const [state, setState] = useState({ status: 'loading', lastUpdate: Date.now() });

    useEffect(() => {
        messages?.subscribeToUpdates((releaseData) => {
            setState(releaseData);
        });
    }, []);

    /**
     * @param {Error} error
     */
    function didCatch(error) {
        const message = error?.message || 'unknown'
        console.error('ErrorBoundary', message);
        messages?.reportPageException({ message })
    }
    return (
        <ErrorBoundary didCatch={didCatch} fallback={<p>Error occurred</p>}>
            <main className={styles.main}>
                <h1>{t('Browser Release Notes')}</h1>
                <div className={styles.statusContainer}>
                    <div className={styles.icon}></div>
                    { state.version &&
                    <p className={styles.statusText}>{t('Version number', { version: `${state.version}` })}</p> }
                    <p className={styles.lastChecked}>{t('Last checked', { date: (new Date(state.lastUpdate).toLocaleDateString('en')) })}</p>
                </div>
                <div className={styles.releaseNotesContainer}>

                </div>
                <WillThrow />
            </main>
            {children}
        </ErrorBoundary>
    )
}

export function WillThrow () {
    const env = useEnv();
    if (env.willThrow) {
        throw new Error('Simulated Exception')
    }
    return null
}
