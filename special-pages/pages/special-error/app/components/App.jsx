import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { useEnv } from '../../../../shared/components/EnvironmentProvider';
import { useMessaging } from '../providers/MessagingProvider';
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary';
import { ErrorFallback } from './ErrorFallback';
import { useTypedTranslation } from '../types';
import { useErrorData } from '../providers/SpecialErrorProvider';
import { Warning } from './Warning';
import { AdvancedInfo } from './AdvancedInfo';

import styles from './App.module.css';

export function SpecialErrorView() {
    const [advancedInfoVisible, setAdvancedInfoVisible] = useState(false);
    const { messaging } = useMessaging();

    const advancedButtonHandler = () => {
        messaging?.advancedInfo();
        setAdvancedInfoVisible(true);
    };

    return (
        <div className={styles.container}>
            <Warning advancedInfoVisible={advancedInfoVisible} advancedButtonHandler={advancedButtonHandler} />
            {advancedInfoVisible && <AdvancedInfo />}
        </div>
    );
}

function PageTitle() {
    const { kind } = useErrorData();
    const { t } = useTypedTranslation();

    useEffect(() => {
        switch (kind) {
            case 'malware':
                document.title = t('malwarePageHeading');
                break;
            case 'phishing':
                document.title = t('phishingPageHeading');
                break;
            default:
                document.title = t('sslPageHeading');
        }
    }, [kind, t]);

    return null;
}

export function App() {
    const { messaging } = useMessaging();

    /**
     * @param {Error} error
     */
    function didCatch(error) {
        const message = error?.message || 'unknown';
        console.error('ErrorBoundary', message);
        messaging?.reportPageException({ message });
    }

    return (
        <main className={styles.main}>
            <PageTitle />
            <ErrorBoundary didCatch={didCatch} fallback={<ErrorFallback />}>
                <SpecialErrorView />
                <WillThrow />
            </ErrorBoundary>
        </main>
    );
}

export function WillThrow() {
    const env = useEnv();
    if (env.willThrow) {
        throw new Error('Simulated Exception');
    }
    return null;
}
