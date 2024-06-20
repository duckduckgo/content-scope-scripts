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
 * @param {string} [props.title]
 * @param {string[]} props.notes
 */
function ReleaseNotesList({ notes, title }) {
    return (
        <section>
            {title && <h3>{title}</h3>}
            <ul className={styles.releaseNotesList}>
                {notes?.map(note => (<li>{note}</li>))}
            </ul>
        </section>
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
        <article className={styles.core}> {/* Fragment? */}
            <header>
                <h1>{t('Browser Release Notes')}</h1>
                <div className={styles.statusContainer}>
                    <div className={styles.icon}></div>

                    {currentVersion &&
                        <p className={styles.statusText}>{t('Version number', { version: `${currentVersion}` })}</p>}

                    <p className={styles.lastChecked}>{t('Last checked', { date: (new Date(lastUpdate).toLocaleDateString('en')) })}</p>
                </div>
            </header>
            {status !== 'loading' &&
                <section className={styles.releaseNotesContainer}>
                    <header>
                        {releaseTitle && <h2>{releaseTitle}</h2>}
                        <p>{releaseVersion}</p>
                    </header>
                    {releaseNotes?.length &&
                        <ReleaseNotesList notes={releaseNotes} />}

                    {releaseNotesPrivacyPro?.length &&
                        <ReleaseNotesList notes={releaseNotesPrivacyPro} title={t('Privacy Pro')}/>}
                </section>}
        </article>
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
