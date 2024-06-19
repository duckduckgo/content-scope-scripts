// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from 'preact'
import styles from './App.module.css'
import { ErrorBoundary } from "../../../../shared/components/ErrorBoundary";
import { useEnv } from "../../../../shared/components/EnvironmentProvider";
import { useTranslation } from "../../../../shared/components/TranslationProvider";
import { MessagingContext } from '../messages';
import { useContext } from "preact/hooks";

/**
 * @param {object} props
 * @param {import("preact").ComponentChild} [props.children]
 */
export function App ({ children }) {
    const { t } = useTranslation();
    const { messages} = useContext(MessagingContext);

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
                <h1>{t('hello world')}</h1>
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
