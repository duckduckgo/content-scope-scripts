import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { useEnv } from '../../../../shared/components/EnvironmentProvider';
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary';
import { useMessaging } from '../providers/MessagingProvider';
import { useErrorData } from '../providers/SpecialErrorProvider';
import { useTypedTranslation } from '../types';
import { AdvancedInfo } from './AdvancedInfo';
import styles from './App.module.css';
import { ErrorFallback } from './ErrorFallback';
import { Warning } from './Warning';

export function SpecialErrorView() {
    const [advancedInfoVisible, setAdvancedInfoVisible] = useState(false);
    const { messaging } = useMessaging();
    const { kind } = useErrorData();
    const shouldShowAdvancedInfo = kind !== 'generalPageProblem';

    const advancedButtonHandler = () => {
        messaging?.advancedInfo();
        setAdvancedInfoVisible(true);
    };

    return (
        <div className={styles.container}>
            <Warning advancedInfoVisible={advancedInfoVisible} advancedButtonHandler={advancedButtonHandler} />
            {shouldShowAdvancedInfo && advancedInfoVisible && <AdvancedInfo />}
        </div>
    );
}

function PageTitle() {
    const errorData = useErrorData();
    const { kind } = errorData;
    const generalPageProblemTitle = kind === 'generalPageProblem' ? errorData.title : undefined;
    const { t } = useTypedTranslation();

    useEffect(() => {
        switch (kind) {
            case 'malware':
            case 'phishing':
            case 'scam':
                document.title = t('maliciousSiteTabTitle');
                break;
            case 'generalPageProblem':
                document.title = generalPageProblemTitle || t('generalPageProblemPageHeading');
                break;
            default:
                document.title = t('sslPageHeading');
        }
    }, [kind, generalPageProblemTitle, t]);

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
            <ErrorBoundary didCatch={({ error }) => didCatch(error)} fallback={<ErrorFallback />}>
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
