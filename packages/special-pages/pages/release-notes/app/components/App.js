// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Fragment, h } from 'preact'
import styles from './App.module.css'
import { ErrorBoundary } from "../../../../shared/components/ErrorBoundary";
import { useEnv } from "../../../../shared/components/EnvironmentProvider";
import { useTranslation } from "../../../../shared/components/TranslationProvider";
import { MessagingContext } from '../index';
import { useContext, useEffect, useState } from "preact/hooks";
import { DuckDuckGoLogo } from '../../../../shared/components/DuckDuckGoLogo/DuckDuckGoLogo';
import { Card } from '../../../../shared/components/Card/Card';

/**
 * @param {object} props
 * @param {string} [props.title]
 * @param {string[]} props.notes
 */
function ReleaseNotesList({ notes, title }) {
    return (
        <Fragment>
            {title && <h3>{title}</h3>}
            <ul className={styles.releaseNotesList}>
                {notes?.map(note => (<li>{note}</li>))}
            </ul>
        </Fragment>
    )
}

/**
 * @param {object} props
 * @param {string} [props.status]
 * @param {string} [props.currentVersion]
 */
function StatusText({ status, currentVersion }) {
    const { t } = useTranslation();

    let statusText;

    switch(status) {
        case 'updateReady':
            statusText = t('newer version available')
            break;
        case 'loaded':
            statusText = t('DuckDuckGo is up to date')
            break;
        default:
            statusText = t('Checking for update')
    }

    return (
        <p className={styles.statusText}>
            {t('Version number', { version: `${currentVersion}` })} — {statusText}
        </p>
    )
}

/**
 * @param {object} props
 * @param {import('../../../../types/release-notes').UpdateMessage} props.releaseData
 */
function ReleaseNotes({ releaseData })  {
    const { t } = useTranslation();
    const { status, currentVersion, latestVersion, lastUpdate, releaseTitle, releaseNotes, releaseNotesPrivacyPro } = releaseData;
    const releaseVersion = latestVersion || currentVersion;



    return (
        <Fragment>
            <DuckDuckGoLogo />
            <article className={styles.content}>
                <header>
                    <h1 className={styles.title}>{t('Browser Release Notes')}</h1>
                    <div className={styles.statusGrid}>
                        <div className={styles.statusIcon}>Icon</div>

                        {currentVersion && <StatusText status={status} currentVersion={currentVersion} />}

                        <p className={styles.statusTimestamp}>{t('Last checked', { date: (new Date(lastUpdate).toLocaleDateString('en')) })}</p>
                    </div>
                </header>
                {
                    status !== 'loading' &&
                    <Card className={styles.releaseNotesContent}>
                        <header>
                            {releaseTitle && <h2 className={styles.releaseTitle}>{releaseTitle}</h2>}
                            <p className={styles.releaseVersion}>{t('Version number', { version: `${releaseVersion}` })}</p>
                        </header>
                        {releaseNotes?.length &&
                            <ReleaseNotesList notes={releaseNotes} />}

                        {releaseNotesPrivacyPro?.length &&
                            <ReleaseNotesList notes={releaseNotesPrivacyPro} title={t('Privacy Pro')}/>}
                    </Card>
                }
            </article>
        </Fragment>
    )
}

/**
 * @param {object} props
 * @param {import("preact").ComponentChild} [props.children]
 */
export function App ({ children }) {
    const { messages } = useContext(MessagingContext);
    // TODO: Replace with schema
    /** @type {ReturnType<typeof useState<import('../../../../types/release-notes').UpdateMessage>>} */
    const [state, setState] = useState();

    useEffect(() => {
        return messages?.subscribeToUpdates((releaseData) => {
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
                {state && <ReleaseNotes releaseData={state} />}
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
